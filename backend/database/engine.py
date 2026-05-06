"""数据库引擎和会话管理"""

import os
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from sqlalchemy.orm import DeclarativeBase


class Base(DeclarativeBase):
    pass


DATABASE_URL = os.getenv(
    "DATABASE_URL",
    "sqlite+aiosqlite:///./linger.db",
)

engine = create_async_engine(DATABASE_URL, echo=False)
async_session = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)


async def init_db():
    """初始化数据库（创建所有表）"""
    async with engine.begin() as conn:
        # 导入所有模型以确保它们被注册
        from models import user, character, conversation, memory, pet, memorial  # noqa
        await conn.run_sync(Base.metadata.create_all)
    print("📦 数据库初始化完成")


async def close_db():
    """关闭数据库连接"""
    await engine.dispose()


async def get_db() -> AsyncSession:
    """获取数据库会话（依赖注入）"""
    async with async_session() as session:
        try:
            yield session
        except Exception:
            await session.rollback()
            raise
        finally:
            await session.close()
