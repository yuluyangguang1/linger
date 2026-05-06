"""记忆服务 — 基于数据库的记忆管理"""

from typing import Optional, List
from sqlalchemy import select, desc
from sqlalchemy.ext.asyncio import AsyncSession

from models.memory import Memory


class MemoryService:
    """记忆管理服务 — 读写数据库记忆 + 关键词搜索"""

    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_memories(
        self,
        user_id: str,
        char_id: str,
        limit: int = 20,
    ) -> List[dict]:
        """获取记忆列表"""
        result = await self.db.execute(
            select(Memory)
            .where(Memory.user_id == user_id)
            .where(Memory.character_id == char_id)
            .order_by(desc(Memory.created_at))
            .limit(limit)
        )
        rows = result.scalars().all()
        rows = list(reversed(rows))
        return [
            {
                "type": r.memory_type,
                "content": r.content,
                "timestamp": r.created_at.timestamp() if r.created_at else 0,
            }
            for r in rows
        ]

    async def add_memory(
        self,
        user_id: str,
        char_id: str,
        memory_type: str,
        content: str,
        importance: float = 0.5,
    ) -> dict:
        """存入记忆"""
        mem = Memory(
            user_id=user_id,
            character_id=char_id,
            memory_type=memory_type,
            content=content,
            importance=importance,
        )
        self.db.add(mem)
        await self.db.commit()
        await self.db.refresh(mem)
        return {
            "id": str(mem.id),
            "type": mem.memory_type,
            "content": mem.content,
        }

    async def search_memories(
        self,
        user_id: str,
        char_id: str,
        query: str,
        limit: int = 10,
    ) -> List[dict]:
        """关键词搜索记忆（简单 LIKE 匹配）"""
        result = await self.db.execute(
            select(Memory)
            .where(Memory.user_id == user_id)
            .where(Memory.character_id == char_id)
            .where(Memory.content.contains(query))
            .order_by(desc(Memory.created_at))
            .limit(limit)
        )
        rows = result.scalars().all()
        return [
            {
                "type": r.memory_type,
                "content": r.content,
                "timestamp": r.created_at.timestamp() if r.created_at else 0,
            }
            for r in rows
        ]
