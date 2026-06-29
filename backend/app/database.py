import os
from pathlib import Path

from sqlalchemy import create_engine
from sqlalchemy.orm import DeclarativeBase, sessionmaker


class Base(DeclarativeBase):
    """所有数据库表模型的基础类。"""


default_database_path = Path(__file__).resolve().parents[1] / "mes.db"
DATABASE_URL = os.getenv("DATABASE_URL", f"sqlite:///{default_database_path}")

# SQLite 在 FastAPI 测试和请求中可能跨线程使用，所以关闭同线程限制。
connect_args = {"check_same_thread": False} if DATABASE_URL.startswith("sqlite") else {}
engine = create_engine(DATABASE_URL, connect_args=connect_args)
SessionLocal = sessionmaker(bind=engine, autoflush=False, expire_on_commit=False)


def get_db():
    """为每次 API 请求创建并在结束后关闭数据库会话。"""
    database = SessionLocal()
    try:
        yield database
    finally:
        database.close()
