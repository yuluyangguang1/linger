"""
mem0 记忆层服务
为 Linger 提供跨会话的用户记忆能力
使用 SQLite + LLM 实现轻量级记忆（兼容 Python 3.14）
"""

import os
import json
import sqlite3
from typing import Optional, List, Dict
from datetime import datetime

from dotenv import load_dotenv
load_dotenv()

import httpx


class LingerMemory:
    """Linger 记忆管理器（轻量级 SQLite 实现）"""
    
    def __init__(self):
        self.db_path = "/tmp/linger_memories.db"
        self.enabled = True
        self._init_db()
        print("✅ mem0 记忆层已启用（SQLite 模式）")
    
    def _init_db(self):
        """初始化数据库"""
        conn = sqlite3.connect(self.db_path)
        conn.execute("""
            CREATE TABLE IF NOT EXISTS memories (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id TEXT NOT NULL,
                content TEXT NOT NULL,
                metadata TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)
        conn.commit()
        conn.close()
    
    def add(self, text: str, user_id: str, metadata: Optional[Dict] = None) -> dict:
        """添加记忆"""
        try:
            conn = sqlite3.connect(self.db_path)
            conn.execute(
                "INSERT INTO memories (user_id, content, metadata) VALUES (?, ?, ?)",
                (user_id, text, json.dumps(metadata or {}))
            )
            conn.commit()
            conn.close()
            return {"status": "ok", "message": "memory saved"}
        except Exception as e:
            return {"status": "error", "message": str(e)}
    
    def search(self, query: str, user_id: str, limit: int = 5) -> List[Dict]:
        """搜索相关记忆（简单关键词匹配）"""
        try:
            conn = sqlite3.connect(self.db_path)
            cursor = conn.execute(
                "SELECT content, metadata, created_at FROM memories WHERE user_id = ? AND content LIKE ? ORDER BY created_at DESC LIMIT ?",
                (user_id, f"%{query}%", limit)
            )
            results = []
            for row in cursor.fetchall():
                results.append({
                    "content": row[0],
                    "metadata": json.loads(row[1]) if row[1] else {},
                    "created_at": row[2],
                })
            conn.close()
            return results
        except Exception as e:
            print(f"mem0 search error: {e}")
            return []
    
    def get_all(self, user_id: str) -> List[Dict]:
        """获取用户所有记忆"""
        try:
            conn = sqlite3.connect(self.db_path)
            cursor = conn.execute(
                "SELECT content, metadata, created_at FROM memories WHERE user_id = ? ORDER BY created_at DESC",
                (user_id,)
            )
            results = []
            for row in cursor.fetchall():
                results.append({
                    "content": row[0],
                    "metadata": json.loads(row[1]) if row[1] else {},
                    "created_at": row[2],
                })
            conn.close()
            return results
        except Exception as e:
            print(f"mem0 get_all error: {e}")
            return []
    
    def delete(self, memory_id: str) -> dict:
        """删除记忆"""
        try:
            conn = sqlite3.connect(self.db_path)
            conn.execute("DELETE FROM memories WHERE id = ?", (memory_id,))
            conn.commit()
            conn.close()
            return {"status": "ok"}
        except Exception as e:
            return {"status": "error", "message": str(e)}


# 全局实例
linger_memory = LingerMemory()
