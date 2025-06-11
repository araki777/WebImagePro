from datetime import datetime
from uuid import UUID

from pydantic import BaseModel


class ImageBaseModel(BaseModel):
    file_name: str
    container_name: str
    blob_name: str
    ja_tags: list[str]
    en_tags: list[str]


class ImageCreate(ImageBaseModel):
    pass


class ImageUpdate(ImageBaseModel):
    pass


class Image(ImageBaseModel):
    id: UUID
    created_at: datetime

    class Config:
        from_attributes = True
