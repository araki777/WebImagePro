from datetime import UTC, datetime
from typing import List

from fastapi import UploadFile
from sqlalchemy.orm import Session

from app.models.image import Image as ImageModel
from app.schemas.image import Image, ImageCreate
from app.services.ai_vision import VisionService
from app.services.storage import StorageService
from app.services.translate import TranslateService


class ImageService:
    def __init__(self, db: Session):
        self.db = db
        self.storage_service = StorageService()
        self.vision_service = VisionService()
        self.translate_service = TranslateService()

    def save_image(self, image_create: ImageCreate) -> Image:
        """画像情報をデータベースに保存"""
        image = ImageModel(
            file_name=image_create.file_name,
            blob_name=image_create.blob_name,
            container_name=image_create.container_name,
            ja_tags=image_create.ja_tags,
            en_tags=image_create.en_tags,
            created_at=datetime.now(UTC),
        )
        self.db.add(image)
        self.db.commit()
        self.db.refresh(image)
        return Image.model_validate(image)

    async def full_upload_image(
        self, file: UploadFile, is_shared: bool, user_id: int, target_langs: List[str]
    ) -> Image:
        """画像のアップロードから保存まで一括処理"""
        # 1. 画像をアップロード
        result = await self.storage_service.upload_image(file, is_shared, user_id)

        # 2. 画像のタグを取得
        tags = self.vision_service.get_tags(result["blob_url"])

        # 3. タグを翻訳
        translations = self.translate_service.translate(tags, target_langs)

        # 4.DBに保存
        image_create = ImageCreate(
            file_name=result["file_name"],
            blob_name=result["blob_name"],
            container_name=result["container_name"],
            ja_tags=translations.get("ja", []),
            en_tags=translations.get("en", []),
        )
        return self.save_image(image_create)
