import os
import uuid
from typing import Dict, List

from azure.storage.blob import BlobServiceClient
from fastapi import UploadFile

from app.core.config import settings
from app.schemas.image import Image


class StorageService:
    def __init__(self):
        self.connection_string = settings.AZURE_STORAGE_CONNECTION_STRING
        self.shared_container = settings.AZURE_STORAGE_SHARED_CONTAINER_NAME
        self.account_name = settings.AZURE_STORAGE_ACCOUNT_NAME

    def _get_container_name(self, is_shared: bool, user_id: int) -> str:
        """コンテナ名を取得"""
        return self.shared_container if is_shared else f"user-{user_id}"
    
    async def get_image(self, blob_name: str, is_shared: bool, user_id: int) -> bytes:
        """画像データを取得"""
        container_name = self._get_container_name(is_shared, user_id)
        blob_client = self.blob_service_client.get_blob_client(
            container=container_name, blob=blob_name
        )
        download_stream = await blob_client.download_blob()
        return await download_stream.readall()


    async def get_list_images(self, is_shared: bool, user_id: str) -> List[Image]:
        """コンテナ内の画像一覧を取得"""
        try:
            container_name = self._get_container_name(is_shared, user_id)
            blobs = self.client.get_container_client(container_name).list_blobs()
            return [
                Image(
                    file_name=blob.name,
                    blob_name=blob.name,
                    container_name=container_name,
                    size=blob.size,
                    content_type=blob.content_settings.content_type,
                    tags=[],
                )
                for blob in blobs
            ]
        except Exception as e:
            print(f"Error getting images from container {container_name}: {e}")
            return []

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
            "size": file.size,
            "content_type": file.content_type,
        }

    async def delete_image(self, blob_name: str, is_shared: bool, user_id: int) -> None:
        """画像を削除"""
        container_name = self._get_container_name(is_shared, user_id)
        blob_service_client = BlobServiceClient.from_connection_string(
            self.connection_string
        )
        blob_client = blob_service_client.get_blob_client(
            container=container_name, blob=blob_name
        )
        blob_client.delete_blob()