"""
Supabase設定
"""

from dataclasses import dataclass

from .utils import get_env, validate_url


@dataclass
class SupabaseSettings:
    """Supabase設定"""

    url: str
    anon_key: str
    service_role_key: str
    jwt_secret: str

    @classmethod
    def from_env(cls) -> "SupabaseSettings":
        return cls(
            url=validate_url(get_env("SUPABASE_URL"), "SUPABASE_URL"),
            anon_key=get_env("SUPABASE_ANON_KEY"),
            service_role_key=get_env("SUPABASE_SERVICE_ROLE_KEY"),
            jwt_secret=get_env("SUPABASE_JWT_SECRET"),
        )
