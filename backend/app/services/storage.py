import os
from datetime import UTC, datetime, timedelta
from typing import List
from uuid import UUID, uuid4

from azure.storage.blob import BlobSasPermissions, BlobServiceClient, generate_blob_sas
from fastapi import UploadFile

from app.core.config import settings
from app.schemas.storage import BlobInfo, BlobUploadResult


class StorageService:
    def __init__(self):
        self.connection_string = settings.azure.storage_connection_string
        self.shared_container = settings.azure.storage_shared_container_name
        self.account_name = settings.azure.storage_account_name
        self.account_key = settings.azure.storage_account_key

    def _get_container_name(self, is_shared: bool, user_id: UUID) -> str:
        """コンテナ名を取得"""
        return self.shared_container if is_shared else f"user-{user_id}"

    def _ensure_container_exists(self, container_name: str):
        """コンテナが存在するか確認"""
        blob_service_client = BlobServiceClient.from_connection_string(
            self.connection_string
        )
        container_client = blob_service_client.get_container_client(container_name)

        # コンテナが存在しない場合は作成
        if not container_client.exists():
            container_client.create_container()

    def _generate_sas_token(
        self, blob_name: str, container_name: str, permission: str = "r"
    ) -> str:
        """SASトークンを生成"""
        if permission == "r":
            sas_permission = BlobSasPermissions(read=True)
        elif permission == "w":
            sas_permission = BlobSasPermissions(write=True)
        elif permission == "rw":
            sas_permission = BlobSasPermissions(read=True, write=True)
        else:
            sas_permission = BlobSasPermissions(read=True)

        # 有効期限を設定（デフォルト1時間）
        expiry = datetime.now(UTC) + timedelta(hours=1)

        # SASトークンを生成
        sas_token = generate_blob_sas(
            account_name=self.account_name,
            container_name=container_name,
            blob_name=blob_name,
            account_key=self.account_key,
            permission=sas_permission,
            expiry=expiry,
            protocol="https",
        )

        return sas_token

    def _get_blob_url(self, blob_name: str, container_name: str) -> str:
        """BlobのURLを取得"""
        return f"https://{self.account_name}.blob.core.windows.net/{container_name}/{blob_name}"

    def _get_blob_url_with_sas(
        self, blob_name: str, container_name: str, permission: str = "r"
    ) -> str:
        """SASトークン付与されたURLを取得"""
        sas_token = self._generate_sas_token(blob_name, container_name, permission)
        blob_url = f"https://{self.account_name}.blob.core.windows.net/{container_name}/{blob_name}?{sas_token}"
        return blob_url

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

            blobs = []
            for blob in container_client.list_blobs():
                if is_shared:
                    blob_url_with_sas = self._get_blob_url(blob.name, container_name)
                else:
                    blob_url_with_sas = self._get_blob_url_with_sas(
                        blob.name, container_name, "r"
                    )

                blobs.append(
                    BlobInfo(
                        blob_name=blob.name,
                        size=blob.size,
                        content_type=blob.content_settings.content_type or "",
                        container_name=container_name,
                        url=blob_url_with_sas,
                        account_name=self.account_name,
                    )
                )
            return blobs
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

        # コンテナが存在しない場合は作成
        self._ensure_container_exists(container_name)

        blob_service_client = BlobServiceClient.from_connection_string(
            self.connection_string
        )
        blob_client = blob_service_client.get_blob_client(
            container=container_name, blob=blob_name
        )

        content = await file.read()
        blob_client.upload_blob(content, overwrite=True)

        # 個人のコンテナの場合はsasTokenを付与
        if is_shared:
            blob_url = self._get_blob_url(blob_name, container_name)
        else:
            blob_url = self._get_blob_url_with_sas(blob_name, container_name, "r")

        return BlobUploadResult(
            blob_name=blob_name,
            blob_url=blob_url,
            container_name=container_name,
            file_name=file.filename or "",
            size=file.size or 0,
            content_type=file.content_type or "",
            account_name=self.account_name,
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
