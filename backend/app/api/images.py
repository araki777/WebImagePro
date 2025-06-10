import os, logging, uuid, requests
from datetime import datetime, UTC

from fastapi import APIRouter, HTTPException, Depends, UploadFile, File
from sqlalchemy.orm import Session
from dotenv import load_dotenv
from azure.storage.blob import BlobServiceClient

from app.connection import get_db
from app.schemas.image import Image, ImageCreate, ImageUpdate
from app.schemas.ai_vision import VisionResponse, VisionRequest
from app.schemas.translate import TranslateResponse, TranslateRequest
from app.models.image import Image as ImageModel
from app.auth.utils import get_current_user

load_dotenv()
AZURE_STORAGE_CONNECTION_STRING=os.getenv("AZURE_STORAGE_CONNECTION_STRING")
AZURE_STORAGE_SHARED_CONTAINER_NAME=os.getenv("AZURE_STORAGE_SHARED_CONTAINER_NAME")
AZURE_STORAGE_ACCOUNT_NAME=os.getenv("AZURE_STORAGE_ACCOUNT_NAME")
AZURE_COMPUTE_VISION_URL=os.getenv("AZURE_COMPUTE_VISION_URL")
AZURE_COMPUTE_VISION_KEY=os.getenv("AZURE_COMPUTE_VISION_KEY")
AZURE_TRANSLATION_URL=os.getenv("AZURE_TRANSLATION_URL")
AZURE_TRANSLATION_KEY=os.getenv("AZURE_TRANSLATION_KEY")
AZURE_TRANSLATION_REGION=os.getenv("AZURE_TRANSLATION_REGION")

logger = logging.getLogger(__name__)

router = APIRouter()

def get_container_name(is_shared, user_id):
    return AZURE_STORAGE_SHARED_CONTAINER_NAME if is_shared else f"user-{user_id}"

async def upload_image_logic(file: UploadFile, is_shared: bool, current_user):
    ext = os.path.splitext(file.filename)[1]
    blob_name = f"{uuid.uuid4()}{ext}"
    container_name = get_container_name(is_shared, current_user.user.id)
    blob_service_client = BlobServiceClient.from_connection_string(AZURE_STORAGE_CONNECTION_STRING)
    blob_client = blob_service_client.get_blob_client(container=container_name, blob=blob_name)
    content = await file.read()
    blob_client.upload_blob(content, overwrite=True)
    blob_url = f"https://{AZURE_STORAGE_ACCOUNT_NAME}.blob.core.windows.net/{container_name}/{blob_name}"
    return {
       "blob_name": blob_name,
       "blob_url": blob_url,
       "container_name": container_name,
       "file_name": file.filename
    }

def get_vision_tags_logic(blob_url: str):
    vision_url = f"{AZURE_COMPUTE_VISION_URL}/vision/v3.2/tag"
    headers = {
        "Ocp-Apim-Subscription-Key": AZURE_COMPUTE_VISION_KEY,
        "Content-Type": "application/json"
    }
    data = {"url": blob_url}
    response = requests.post(vision_url, headers=headers, json=data)
    if response.status_code == 429:
        raise HTTPException(status_code=429, detail="Rate limit exceeded")
    if not response.ok:
        raise HTTPException(status_code=response.status_code, detail="Vision API error")
    data = response.json()
    tags = [tag["name"] for tag in data.get("tags", [])]
    return tags

def translate_tags_logic(tags, target_langs):
    path = "/translate?api-version=3.0"
    for lang in target_langs:
        path += f"&to={lang}"
    url = AZURE_TRANSLATION_URL + path
    headers = {
        "Ocp-Apim-Subscription-Key": AZURE_TRANSLATION_KEY,
        "Ocp-Apim-Subscription-Region": AZURE_TRANSLATION_REGION,
        "Content-Type": "application/json"
    }
    body = [{"text": tag} for tag in tags]
    response = requests.post(url, headers=headers, json=body)
    if not response.ok:
        raise HTTPException(status_code=response.status_code, detail="Translator API error: " + response.text)
    data = response.json()
    translations = {lang: [] for lang in target_langs}
    for tag_result in data:
        for trans in tag_result["translations"]:
            translations[trans["to"]].append(trans["text"])
    return translations

def save_image_logic(image_create: ImageCreate, db: Session):
    image = ImageModel(
        file_name=image_create.file_name,
        blob_name=image_create.blob_name,
        container_name=image_create.container_name,
        ja_tags=image_create.ja_tags,
        en_tags=image_create.en_tags,
        created_at=datetime.now(UTC)
    )
    db.add(image)
    db.commit()
    db.refresh(image)
    return image

@router.post("/upload", response_model=Image)
async def upload_image(
  file: UploadFile = File(...),
  is_shared: bool = False,
  current_user = Depends(get_current_user)
):
  try:
    result = await upload_image_logic(file, is_shared, current_user)
    return {"blob_name": result["blob_name"], "blob_url": result["blob_url"]}
  except Exception as e:
    raise HTTPException(status_code=500, detail=str(e))

@router.post("/vision-tags", response_model=VisionResponse)
async def get_vision_tags(req: VisionRequest, _current_user = Depends(get_current_user)):
  try:
    tags = get_vision_tags_logic(req.blob_url)
    return {"tags": tags}
  except Exception as e:
    raise HTTPException(status_code=500, detail=str(e))

@router.post("/translate", response_model=TranslateResponse)
async def translate_tags(
  req: TranslateRequest,
  _current_user = Depends(get_current_user)
):
  try:
    translations = translate_tags_logic(req.tags, req.target_langs)
    return {"translations": translations}
  except Exception as e:
    raise HTTPException(status_code=500, detail=str(e))

@router.post("/save", response_model=Image)
async def save_image(
  image_create: ImageCreate,
  db: Session = Depends(get_db),
  _current_user = Depends(get_current_user)
):
  try:
    image = save_image_logic(image_create, db)
    return image
  except Exception as e:
    db.rollback()
    raise HTTPException(status_code=400, detail=str(e))

@router.post("/full-upload", response_model=Image)
async def full_upload_image(
    file: UploadFile = File(...),
    is_shared: bool = False,
    target_langs: list[str] = ["ja", "en"],
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    try:
        # 言語指定が1つの場合、カンマ区切りで指定されている場合があるので分割
        if len(target_langs) == 1 and isinstance(target_langs[0], str) and ',' in target_langs[0]:
           target_langs = target_langs[0].split(",")

        # 1. 画像アップロード
        result = await upload_image_logic(file, is_shared, current_user)
        file_name = result["file_name"]
        blob_name = result["blob_name"]
        blob_url = result["blob_url"]
        container_name = result["container_name"]
        # 2. Vision APIでタグ抽出
        tags = get_vision_tags_logic(blob_url)
        # 3. 翻訳APIでタグ翻訳
        translations = translate_tags_logic(tags, target_langs)
        ja_tags = translations.get("ja", [])
        en_tags = translations.get("en", [])
        # 4. DB保存
        image_create = ImageCreate(
            file_name=file_name,
            blob_name=blob_name,
            container_name=container_name,
            ja_tags=ja_tags,
            en_tags=en_tags
        )
        image = save_image_logic(image_create, db)
        return image
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=400, detail=str(e))