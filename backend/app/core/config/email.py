"""
メール設定
"""

from dataclasses import dataclass

from .utils import get_env, validate_email


@dataclass
class EmailSettings:
    """メール設定"""

    api_key: str
    from_email: str
    to_email: str

    @classmethod
    def from_env(cls) -> "EmailSettings":
        return cls(
            api_key=get_env("RESEND_API_KEY"),
            from_email=validate_email(
                get_env("RESEND_EMAIL_FROM"), "RESEND_EMAIL_FROM"
            ),
            to_email=validate_email(get_env("RESEND_EMAIL_TO"), "RESEND_EMAIL_TO"),
        )
