import os
from typing import List
from uuid import UUID, uuid4

from azure.storage.blob import BlobServiceClient
from fastapi import UploadFile

from app.core.config import settings
from app.schemas.storage import BlobInfo, BlobUploadResult


class StorageService:
    def __init__(self):
        self.connection_string = settings.AZURE_STORAGE_CONNECTION_STRING
        self.shared_container = settings.AZURE_STORAGE_SHARED_CONTAINER_NAME
        self.account_name = settings.AZURE_STORAGE_ACCOUNT_NAME

    def _get_container_name(self, is_shared: bool, user_id: UUID) -> str:
        """コンテナ名を取得"""
        return self.shared_container if is_shared else f"user-{user_id}"

    async def get_image(self, blob_name: str, is_shared: bool, user_id: UUID) -> bytes:
        """画像データを取得"""
        container_name = self._get_container_name(is_shared, user_id)
        blob_service_client = BlobServiceClient.from_connection_string(
            self.connection_string
        )
        blob_client = blob_service_client.get_blob_client(
            container=container_name, blob=blob_name
        )
        download_stream = blob_client.download_blob()
        return download_stream.readall()

    async def get_blob_list(self, is_shared: bool, user_id: UUID) -> List[BlobInfo]:
        """コンテナ内の画像一覧を取得"""
        try:
            container_name = self._get_container_name(is_shared, user_id)
            blob_service_client = BlobServiceClient.from_connection_string(
                self.connection_string
            )
            container_client = blob_service_client.get_container_client(container_name)
            blobs = container_client.list_blobs()

            return [
                BlobInfo(
                    blob_name=blob.name,
                    size=blob.size,
                    content_type=blob.content_settings.content_type or "",
                    container_name=container_name,
                )
                for blob in blobs
            ]
        except Exception as e:
            print(f"Error getting images from container {container_name}: {e}")
            return []

    async def upload_image(
        self, file: UploadFile, is_shared: bool, user_id: UUID
    ) -> BlobUploadResult:
        """画像をアップロード"""
        ext = os.path.splitext(file.filename or "")[1]
        blob_name = f"{uuid4()}{ext}"
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

        return BlobUploadResult(
            blob_name=blob_name,
            blob_url=blob_url,
            container_name=container_name,
            file_name=file.filename or "",
            size=file.size or 0,
            content_type=file.content_type or "",
        )

    async def delete_image(
        self, blob_name: str, is_shared: bool, user_id: UUID
    ) -> None:
        """画像を削除"""
        container_name = self._get_container_name(is_shared, user_id)
        blob_service_client = BlobServiceClient.from_connection_string(
            self.connection_string
        )
        blob_client = blob_service_client.get_blob_client(
            container=container_name, blob=blob_name
        )
        blob_client.delete_blob()
