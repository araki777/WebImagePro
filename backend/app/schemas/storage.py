from uuid import UUID

from fastapi import UploadFile
from pydantic import BaseModel


class UploadImageRequest(BaseModel):
    file: UploadFile
    is_shared: bool
    user_id: UUID


class BlobUploadResult(BaseModel):
    blob_name: str
    blob_url: str
    container_name: str
    file_name: str
    size: int
    content_type: str


class BlobInfo(BaseModel):
    blob_name: str
    size: int
    content_type: str
    container_name: str
