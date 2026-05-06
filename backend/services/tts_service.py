"""
TTS 语音合成服务
支持 Edge-TTS（免费）和 ChatTTS（本地）
为 Linger 角色提供温暖的声音
"""

import os
import asyncio
import tempfile
from typing import Optional, Dict
from pathlib import Path

from dotenv import load_dotenv
load_dotenv()

# TTS 配置
TTS_DIR = Path("/tmp/linger_tts")
TTS_DIR.mkdir(exist_ok=True)

# 角色声音映射（Edge-TTS 中文声音）
CHARACTER_VOICES = {
    # 女性角色
    "gf_gentle": "zh-CN-XiaoyiNeural",      # 温柔学姐 - 温暖女声
    "gf_bubbly": "zh-CN-XiaoxiaoNeural",     # 元气少女 - 活泼女声
    "gf_tsundere": "zh-CN-XiaomengNeural",   # 傲娇大小姐 - 可爱女声
    "gf_intellectual": "zh-CN-XiaohanNeural", # 知性御姐 - 成熟女声
    # 男性角色
    "bf_sunny": "zh-CN-YunxiNeural",         # 阳光学长 - 阳光男声
    "bf_cold": "zh-CN-YunjianNeural",         # 腹黑总裁 - 低沉男声
    "bf_steady": "zh-CN-YunyangNeural",       # 稳重哥哥 - 沉稳男声
    "bf_young": "zh-CN-YunxiaNeural",         # 年下弟弟 - 年轻男声
}

# 默认声音
DEFAULT_VOICE = "zh-CN-XiaoyiNeural"


class TTSService:
    """TTS 服务管理器"""
    
    def __init__(self):
        self.edge_tts_available = False
        self.chattts_available = False
        self._init_backends()
    
    def _init_backends(self):
        """初始化可用的 TTS 后端"""
        # Edge-TTS（免费，在线）
        try:
            import edge_tts
            self.edge_tts_available = True
            print("✅ Edge-TTS 已启用（免费在线 TTS）")
        except ImportError:
            print("⚠️ Edge-TTS 未安装")
        
        # ChatTTS（本地，可选）
        try:
            import ChatTTS
            self.chattts_available = True
            print("✅ ChatTTS 已启用（本地 TTS）")
        except ImportError:
            print("⚠️ ChatTTS 未安装（可选）")
    
    async def generate_speech(
        self,
        text: str,
        char_id: str = "gf_gentle",
        voice: Optional[str] = None,
        rate: str = "+0%",
        volume: str = "+0%",
    ) -> Dict:
        """
        生成语音
        
        Args:
            text: 要转换的文本
            char_id: 角色 ID
            voice: 声音名称（可选，覆盖角色默认声音）
            rate: 语速调整（如 "+10%", "-5%"）
            volume: 音量调整
        
        Returns:
            {"status": "ok", "path": "/tmp/linger_tts/xxx.mp3", "duration": 3.5}
        """
        # 选择声音
        if voice is None:
            voice = CHARACTER_VOICES.get(char_id, DEFAULT_VOICE)
        
        # 优先使用 Edge-TTS（免费且稳定）
        if self.edge_tts_available:
            return await self._edge_tts_generate(text, voice, rate, volume)
        
        # 备选：ChatTTS
        if self.chattts_available:
            return await self._chattts_generate(text, char_id)
        
        return {"status": "error", "message": "No TTS backend available"}
    
    async def _edge_tts_generate(
        self,
        text: str,
        voice: str,
        rate: str,
        volume: str,
    ) -> Dict:
        """使用 Edge-TTS 生成语音"""
        try:
            import edge_tts
            
            # 生成唯一文件名
            import hashlib
            import time
            filename = f"tts_{hashlib.md5(text.encode()).hexdigest()[:8]}_{int(time.time())}.mp3"
            filepath = TTS_DIR / filename
            
            # 生成语音
            communicate = edge_tts.Communicate(text, voice, rate=rate, volume=volume)
            await communicate.save(str(filepath))
            
            return {
                "status": "ok",
                "path": str(filepath),
                "voice": voice,
                "backend": "edge-tts",
            }
        except Exception as e:
            return {"status": "error", "message": str(e)}
    
    async def _chattts_generate(self, text: str, char_id: str) -> Dict:
        """使用 ChatTTS 生成语音（本地）"""
        try:
            import ChatTTS
            import torch
            import soundfile as sf
            
            # 初始化 ChatTTS
            chat = ChatTTS.Chat()
            chat.load(compile=False)
            
            # 生成语音
            wavs = chat.infer([text], use_decoder=True)
            
            # 保存音频
            import hashlib
            import time
            filename = f"chattts_{hashlib.md5(text.encode()).hexdigest()[:8]}_{int(time.time())}.wav"
            filepath = TTS_DIR / filename
            
            sf.write(str(filepath), wavs[0][0], 24000)
            
            return {
                "status": "ok",
                "path": str(filepath),
                "backend": "chattts",
            }
        except Exception as e:
            return {"status": "error", "message": str(e)}
    
    def get_voices(self) -> Dict:
        """获取可用声音列表"""
        voices = {
            "edge_tts": CHARACTER_VOICES if self.edge_tts_available else {},
            "chattts": self.chattts_available,
        }
        return voices


# 全局实例
tts_service = TTSService()
