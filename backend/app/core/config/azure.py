"""
Azure設定
"""

from dataclasses import dataclass

from .utils import get_env, validate_url


@dataclass
class AzureSettings:
    """Azure設定"""

    storage_connection_string: str
    storage_shared_container_name: str
    storage_account_name: str
    storage_account_key: str
    compute_vision_url: str
    compute_vision_key: str
    translation_url: str
    translation_key: str
    translation_region: str

    @classmethod
    def from_env(cls) -> "AzureSettings":
        return cls(
            storage_connection_string=get_env("AZURE_STORAGE_CONNECTION_STRING"),
            storage_shared_container_name=get_env(
                "AZURE_STORAGE_SHARED_CONTAINER_NAME"
            ),
            storage_account_name=get_env("AZURE_STORAGE_ACCOUNT_NAME"),
            storage_account_key=get_env("AZURE_STORAGE_ACCOUNT_KEY"),
            compute_vision_url=validate_url(
                get_env("AZURE_COMPUTE_VISION_URL"), "AZURE_COMPUTE_VISION_URL"
            ),
            compute_vision_key=get_env("AZURE_COMPUTE_VISION_KEY"),
            translation_url=validate_url(
                get_env("AZURE_TRANSLATION_URL"), "AZURE_TRANSLATION_URL"
            ),
            translation_key=get_env("AZURE_TRANSLATION_KEY"),
            translation_region=get_env("AZURE_TRANSLATION_REGION"),
        )
