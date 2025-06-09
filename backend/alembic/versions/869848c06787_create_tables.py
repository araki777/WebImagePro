"""create tables

Revision ID: 869848c06787
Revises: 
Create Date: 2025-06-09 22:41:13.649790

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '869848c06787'
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.create_table('images',
    sa.Column('id', sa.UUID(), server_default=sa.text('gen_random_uuid()'), nullable=False),
    sa.Column('blob_name', sa.Text(), nullable=True),
    sa.Column('container_name', sa.Text(), nullable=True),
    sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
    sa.Column('ja_tags', sa.ARRAY(sa.Text()), nullable=True),
    sa.Column('en_tags', sa.ARRAY(sa.Text()), nullable=True),
    sa.PrimaryKeyConstraint('id')
    )
    op.create_table('roles',
    sa.Column('id', sa.UUID(), server_default=sa.text('gen_random_uuid()'), nullable=False),
    sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
    sa.Column('name', sa.Text(), nullable=True),
    sa.Column('description', sa.Text(), nullable=True),
    sa.PrimaryKeyConstraint('id')
    )
    op.create_table('contacts',
    sa.Column('id', sa.UUID(), server_default=sa.text('gen_random_uuid()'), nullable=False),
    sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
    sa.Column('user_id', sa.UUID(), nullable=True),
    sa.Column('name', sa.Text(), nullable=True),
    sa.Column('email', sa.Text(), nullable=True),
    sa.Column('subject', sa.Text(), nullable=True),
    sa.Column('message', sa.Text(), nullable=True),
    sa.ForeignKeyConstraint(['user_id'], ['auth.users.id'], ),
    sa.PrimaryKeyConstraint('id')
    )
    op.create_table('user_profiles',
    sa.Column('id', sa.UUID(), nullable=False),
    sa.Column('display_name', sa.Text(), nullable=True),
    sa.Column('bio', sa.Text(), nullable=True),
    sa.Column('avatar_url', sa.Text(), nullable=True),
    sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
    sa.Column('updated_at', sa.DateTime(timezone=True), nullable=True),
    sa.ForeignKeyConstraint(['id'], ['auth.users.id'], ),
    sa.PrimaryKeyConstraint('id')
    )
    op.create_table('user_roles',
    sa.Column('id', sa.UUID(), nullable=False),
    sa.Column('role_id', sa.UUID(), nullable=True),
    sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
    sa.Column('updated_at', sa.DateTime(timezone=True), nullable=True),
    sa.ForeignKeyConstraint(['id'], ['auth.users.id'], ),
    sa.ForeignKeyConstraint(['role_id'], ['roles.id'], ),
    sa.PrimaryKeyConstraint('id')
    )
    op.create_table('user_settings',
    sa.Column('id', sa.UUID(), nullable=False),
    sa.Column('theme', sa.String(), nullable=True),
    sa.Column('language', sa.String(), nullable=True),
    sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
    sa.Column('updated_at', sa.DateTime(timezone=True), nullable=True),
    sa.ForeignKeyConstraint(['id'], ['auth.users.id'], ),
    sa.PrimaryKeyConstraint('id')
    )

    # RLS（Row Level Security）ポリシーの設定
    op.execute("ALTER TABLE roles ENABLE ROW LEVEL SECURITY;")
    op.execute("CREATE POLICY \"Allow all users to view roles\" ON roles FOR SELECT USING (true);")
    op.execute("CREATE POLICY \"Allow authenticated to insert roles\" ON roles FOR INSERT TO authenticated WITH CHECK (true);")

    op.execute("ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;")
    op.execute("CREATE POLICY \"Allow individual select\" ON user_profiles FOR SELECT TO authenticated USING (id = auth.uid());")
    op.execute("CREATE POLICY \"Allow individual insert\" ON user_profiles FOR INSERT TO authenticated WITH CHECK (id = auth.uid());")
    op.execute("CREATE POLICY \"Allow individual update\" ON user_profiles FOR UPDATE TO authenticated USING (id = auth.uid());")
    op.execute("CREATE POLICY \"Allow individual delete\" ON user_profiles FOR DELETE TO authenticated USING (id = auth.uid());")

    op.execute("ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;")
    op.execute("CREATE POLICY \"Allow individual select\" ON user_settings FOR SELECT TO authenticated USING (id = auth.uid());")
    op.execute("CREATE POLICY \"Allow individual insert\" ON user_settings FOR INSERT TO authenticated WITH CHECK (id = auth.uid());")
    op.execute("CREATE POLICY \"Allow individual update\" ON user_settings FOR UPDATE TO authenticated USING (id = auth.uid());")
    op.execute("CREATE POLICY \"Allow individual delete\" ON user_settings FOR DELETE TO authenticated USING (id = auth.uid());")

    op.execute("ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;")
    op.execute("CREATE POLICY \"Allow individual select\" ON user_roles FOR SELECT TO authenticated USING (id = auth.uid());")
    op.execute("CREATE POLICY \"Allow individual insert\" ON user_roles FOR INSERT TO authenticated WITH CHECK (id = auth.uid());")
    op.execute("CREATE POLICY \"Allow individual update\" ON user_roles FOR UPDATE TO authenticated USING (id = auth.uid());")
    op.execute("CREATE POLICY \"Allow individual delete\" ON user_roles FOR DELETE TO authenticated USING (id = auth.uid());")
    # ### end Alembic commands ###


def downgrade() -> None:
    """Downgrade schema."""
    # ### commands auto generated by Alembic - please adjust! ###
    op.drop_table('user_settings')
    op.drop_table('user_roles')
    op.drop_table('user_profiles')
    op.drop_table('contacts')
    op.drop_table('roles')
    op.drop_table('images')
    op.drop_table('users', schema='auth')
    # ### end Alembic commands ###
