import os
import uuid
from typing import Dict

from azure.storage.blob import BlobServiceClient
from fastapi import UploadFile

from app.core.config import settings


class StorageService:
    def __init__(self):
        self.connection_string = settings.AZURE_STORAGE_CONNECTION_STRING
        self.shared_container = settings.AZURE_STORAGE_SHARED_CONTAINER_NAME
        self.account_name = settings.AZURE_STORAGE_ACCOUNT_NAME

    def _get_container_name(self, is_shared: bool, user_id: int) -> str:
        """コンテナ名を取得"""
        return self.shared_container if is_shared else f"user-{user_id}"

    async def upload_image(
        self, file: UploadFile, is_shared: bool, user_id: int
    ) -> Dict[str, str]:
        """画像をアップロード"""
        ext = os.path.splitext(file.filename or "")[1]
        blob_name = f"{uuid.uuid4()}{ext}"
        container_name = self._get_container_name(is_shared, user_id)

        blob_service_client = BlobServiceClient.from_connection_string(
            self.connection_string
        )
        blob_client = blob_service_client.get_blob_client(
            container=container_name, blob=blob_name
        )

        content = await file.read()
        blob_client.upload_blob(content, overwrite=True)
        blob_url = f"https://{self.account_name}.blob.core.windows.net/{container_name}/{blob_name}"

        return {
            "blob_name": blob_name,
            "blob_url": blob_url,
            "container_name": container_name,
            "file_name": file.filename or "",
        }
