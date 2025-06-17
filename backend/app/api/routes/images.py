import io
from typing import Dict, List
from uuid import UUID

from fastapi import APIRouter, Depends
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session

from app.api.base import LoggingRoute
from app.auth.utils import get_current_user
from app.connection import get_db
from app.core.error_handlers import handle_api_errors
from app.schemas.ai_vision import VisionRequest, VisionResponse
from app.schemas.image import FullUploadImageRequest, Image, ImageCreate, ImageWithTags
from app.schemas.storage import BlobUploadResult, UploadImageRequest
from app.schemas.translate import TranslateRequest, TranslateResponse
from app.services.ai_vision import VisionService
from app.services.image import ImageService
from app.services.storage import StorageService
from app.services.translate import TranslateService

router = APIRouter(route_class=LoggingRoute)


def get_storage_service() -> StorageService:
    return StorageService()


def get_image_service(db: Session = Depends(get_db)) -> ImageService:
    return ImageService(db)


@router.get("/", response_model=List[ImageWithTags])
@handle_api_errors("image", "get_images")
async def get_images(
    user_id: UUID,
    is_shared: bool = False,
    lang: str = "ja",
    storage_service: StorageService = Depends(),
    image_service: ImageService = Depends(get_image_service),
):
    """
    画像を取得する

    Args:
        is_shared: 共有モードかどうか
        user_id: ユーザーID
        lang: 言語
        storage_service: ストレージサービス

    Returns:
        images: 画像

    Raises:
        HTTPException: 画像の取得に失敗した場合
    """
    images = await storage_service.get_blob_list(is_shared, user_id)
    images_with_tags = await image_service.get_images_with_tags(images, lang)
    return images_with_tags


@router.post("/upload", response_model=BlobUploadResult)
@handle_api_errors("image", "upload")
async def upload_image(
    req: UploadImageRequest,
    _current_user=Depends(get_current_user),
    storage_service: StorageService = Depends(get_storage_service),
) -> BlobUploadResult:
    """画像をアップロード"""
    return await storage_service.upload_image(req.file, req.is_shared, req.user_id)


@router.post("/vision-tags", response_model=VisionResponse)
@handle_api_errors("image", "vision-tags")
async def get_vision_tags(
    req: VisionRequest,
    _current_user=Depends(get_current_user),
    vision_service: VisionService = Depends(),
):
    """
    画像のタグを抽出する

    Args:
        req: タグ抽出リクエスト
        _current_user: 現在のユーザー
        vision_service: Visionサービス

    Returns:
        tags: タグ

    Raises:
        HTTPException: タグ抽出に失敗した場合
    """

    tags = vision_service.get_tags(req.blob_url)
    return {"tags": tags}


@router.post("/translate", response_model=TranslateResponse)
@handle_api_errors("image", "translate")
async def translate_tags(
    req: TranslateRequest,
    _current_user=Depends(get_current_user),
    translate_service: TranslateService = Depends(),
):
    """
    タグを翻訳する

    Args:
        req: 翻訳リクエスト
        _current_user: 現在のユーザー
        translate_service: 翻訳サービス

    Returns:
        translations: 翻訳結果

    Raises:
        HTTPException: 翻訳に失敗した場合
    """

    translations = translate_service.translate(req.tags, req.target_langs)
    return {"translations": translations}


@router.post("/save", response_model=Image)
@handle_api_errors("image", "save")
async def save_image(
    image_create: ImageCreate,
    _current_user=Depends(get_current_user),
    image_service: ImageService = Depends(get_image_service),
):
    """
    画像を保存する

    Args:
        image_create: 画像作成リクエスト
        _current_user: 現在のユーザー
        image_service: 画像サービス

    Returns:
        image: 画像

    Raises:
        HTTPException: 保存に失敗した場合
    """

    image = image_service.save_image(image_create)
    return image


@router.post("/full-upload", response_model=Image)
@handle_api_errors("image", "full_upload")
async def full_upload_image(
    req: FullUploadImageRequest,
    current_user=Depends(get_current_user),
    storage_service: StorageService = Depends(),
    vision_service: VisionService = Depends(),
    translate_service: TranslateService = Depends(),
    image_service: ImageService = Depends(get_image_service),
):
    """
    画像をアップロードする

    Args:
        file: アップロードする画像ファイル
        is_shared: 共有モードかどうか
        target_langs: 翻訳対象の言語
        current_user: 現在のユーザー
        storage_service: ストレージサービス
        vision_service: Visionサービス
        translate_service: 翻訳サービス
        image_service: 画像サービス

    Returns:
        image: 画像

    Raises:
        HTTPException: アップロードに失敗した場合
    """

    # 1. 画像アップロード
    result = await storage_service.upload_image(req.file, req.is_shared, req.user_id)

    # 2. Vision APIでタグ抽出
    tags = vision_service.get_tags(result.blob_url)

    # 3. 翻訳APIでタグ翻訳
    translations = translate_service.translate(tags, req.target_langs)
    ja_tags = translations.get("ja", [])
    en_tags = translations.get("en", [])

    # 4. DB保存
    image_create = ImageCreate(
        file_name=result.file_name,
        blob_name=result.blob_name,
        container_name=result.container_name,
        ja_tags=ja_tags,
        en_tags=en_tags,
        size=result.size,
        content_type=result.content_type,
    )
    image = image_service.save_image(image_create)
    return image


@router.delete("/delete", response_model=Dict[str, str])
@handle_api_errors("image", "delete")
async def delete_image(
    image_id: str,
    is_shared: bool,
    user_id: UUID,
    _current_user=Depends(get_current_user),
    image_service: ImageService = Depends(get_image_service),
    storage_service: StorageService = Depends(),
):
    """
    画像を削除する

    Args:
        image_id: 削除する画像のID
        image_service: 画像サービス

    Returns:
        message: 削除成功メッセージ

    Raises:
        HTTPException: 削除に失敗した場合
    """
    await image_service.delete_image(image_id)
    await storage_service.delete_image(image_id, is_shared, user_id)
    return {"message": "Image deleted successfully"}


@router.get("/{blob_name}")
@handle_api_errors("images", "get_image")
async def get_image(
    blob_name: str,
    is_shared: bool,
    user_id: UUID,
    storage_service: StorageService = Depends(get_storage_service),
):
    """画像データを取得"""
    image_data = await storage_service.get_image(blob_name, is_shared, user_id)
    return StreamingResponse(
        io.BytesIO(image_data),
        media_type="image/jpeg",
        headers={"Content-Disposition": f'attachment; filename="{blob_name}"'},
    )
