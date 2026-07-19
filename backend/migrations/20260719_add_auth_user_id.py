"""
Navigation 数据库迁移脚本：添加 auth_user_id 字段，为接入 auth-service 做准备。

用法：
    python backend/migrations/20260719_add_auth_user_id.py

支持 SQLite。
"""
import os
import sys
from pathlib import Path

# 将 backend 目录加入路径
backend_dir = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(backend_dir))

from sqlalchemy import create_engine, text

DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./navigation.db")


def migrate():
    engine = create_engine(DATABASE_URL)
    with engine.connect() as conn:
        # 检查是否已有 auth_user_id 列
        if DATABASE_URL.startswith("sqlite"):
            result = conn.execute(
                text("PRAGMA table_info(users)")
            )
            columns = {row[1] for row in result}
        else:
            result = conn.execute(text("SELECT column_name FROM information_schema.columns WHERE table_name = 'users'"))
            columns = {row[0] for row in result}

        if "auth_user_id" in columns:
            print("auth_user_id already exists, skipping.")
            return

        if DATABASE_URL.startswith("sqlite"):
            # SQLite 需要重建表
            conn.execute(text("""
                CREATE TABLE users_new (
                    id INTEGER PRIMARY KEY,
                    auth_user_id VARCHAR(36),
                    email VARCHAR NOT NULL,
                    hashed_pw VARCHAR,
                    nickname VARCHAR,
                    is_active BOOLEAN DEFAULT 1,
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                    reset_token VARCHAR,
                    reset_expires DATETIME
                )
            """))
            conn.execute(text("""
                INSERT INTO users_new (id, email, hashed_pw, nickname, is_active, created_at, reset_token, reset_expires)
                SELECT id, email, hashed_pw, nickname, is_active, created_at, reset_token, reset_expires FROM users
            """))
            conn.execute(text("DROP TABLE users"))
            conn.execute(text("ALTER TABLE users_new RENAME TO users"))
            conn.execute(text("CREATE UNIQUE INDEX ix_users_email ON users(email)"))
            conn.execute(text("CREATE UNIQUE INDEX ix_users_auth_user_id ON users(auth_user_id)"))
        else:
            conn.execute(text("ALTER TABLE users ADD COLUMN auth_user_id VARCHAR(36)"))
            conn.execute(text("CREATE UNIQUE INDEX ix_users_auth_user_id ON users(auth_user_id)"))
            conn.execute(text("ALTER TABLE users ALTER COLUMN hashed_pw DROP NOT NULL"))

        conn.commit()
        print("Migration completed.")


if __name__ == "__main__":
    migrate()
