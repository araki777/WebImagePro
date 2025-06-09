import uuid
from sqlalchemy import create_engine, text

from lib.database import SQLALCHEMY_DATABASE_URL

print(SQLALCHEMY_DATABASE_URL)

engine = create_engine(SQLALCHEMY_DATABASE_URL)

def seed_roles():
    admin_id = str(uuid.uuid4())
    user_id = str(uuid.uuid4())
    with engine.begin() as conn:
        conn.execute(text("""
            INSERT INTO roles (id, name, description, created_at) VALUES
            (:admin_id, 'Admin', '管理者', now()),
            (:user_id, 'User', '一般ユーザー', now())
            ON CONFLICT (id) DO NOTHING
        """), {"admin_id": admin_id, "user_id": user_id})
    print(f"rolesテーブルに初期データを投入しました (admin_id={admin_id}, user_id={user_id})")

if __name__ == "__main__":
    seed_roles()