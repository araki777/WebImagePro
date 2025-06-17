from datetime import UTC, datetime
from typing import List
from uuid import UUID

from fastapi import UploadFile
from sqlalchemy.orm import Session

from app.models.image import Image as ImageModel
from app.schemas.image import Image, ImageCreate, ImageWithTags
from app.schemas.storage import BlobInfo
from app.services.ai_vision import VisionService
from app.services.storage import StorageService
from app.services.translate import TranslateService


class ImageService:
    def __init__(self, db: Session):
        self.db = db
        self.storage_service = StorageService()
        self.vision_service = VisionService()
        self.translate_service = TranslateService()

    async def get_images_with_tags(
        self, images: List[BlobInfo], lang: str = "ja"
    ) -> List[ImageWithTags]:
        """画像を取得

        Args:
            images: 画像リスト
            lang: 言語（デフォルト: ja）

        Returns:
            List[ImageWithTags]: タグ付き画像のリスト
        """
        # 画像情報をマッピング
        tags_map = {}

        # データベースから画像情報を取得
        for image in images:
            db_image = (
                self.db.query(ImageModel)
                .filter(
                    ImageModel.container_name == image.container_name,
                    ImageModel.blob_name == image.blob_name,
                )
                .first()
            )

            if db_image:
                # データベースのタグ情報を使用
                tags = getattr(db_image, f"{lang}_tags", [])

                tags_map[f"{image.container_name}/{image.blob_name}"] = tags

        # ImageWithTags形式に変換
        return [
            ImageWithTags(
                **Image.model_validate(image).model_dump(),
                tags=tags_map.get(f"{image.container_name}/{image.blob_name}", []),
            )
            for image in images
        ]

    def save_image(self, image_create: ImageCreate) -> Image:
        """画像情報をデータベースに保存"""
        image = ImageModel(
            file_name=image_create.file_name,
            blob_name=image_create.blob_name,
            container_name=image_create.container_name,
            size=image_create.size,
            content_type=image_create.content_type,
            ja_tags=image_create.ja_tags,
            en_tags=image_create.en_tags,
            created_at=datetime.now(UTC),
        )
        self.db.add(image)
        self.db.commit()
        self.db.refresh(image)
        return Image.model_validate(image)

    async def full_upload_image(
        self, file: UploadFile, is_shared: bool, user_id: UUID, target_langs: List[str]
    ) -> Image:
        """画像のアップロードから保存まで一括処理"""
        # 1. 画像をアップロード
        result = await self.storage_service.upload_image(file, is_shared, user_id)

        # 2. 画像のタグを取得
        tags = self.vision_service.get_tags(result.blob_url)

        # 3. タグを翻訳
        translations = self.translate_service.translate(tags, target_langs)

        # 4.DBに保存
        image_create = ImageCreate(
            file_name=result.file_name,
            blob_name=result.blob_name,
            container_name=result.container_name,
            size=result.size,
            content_type=result.content_type,
            ja_tags=translations.get("ja", []),
            en_tags=translations.get("en", []),
        )
        return self.save_image(image_create)

    async def delete_image(self, image_id: str) -> None:
        """画像を削除

        Raises:
            ValueError: 画像が見つからない場合
        """
        image = self.db.query(ImageModel).filter(ImageModel.id == image_id).first()
        if image is None:
            raise ValueError("Image not found")

        # 画像を削除
        self.db.delete(image)
        self.db.commit()
