import json
from typing import Annotated
from uuid import UUID

from fastapi import Form, UploadFile
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


class UploadImageForm:
    def __init__(
        self,
        file: UploadFile,
        target_langs: Annotated[str, Form()],
        is_shared: Annotated[bool, Form()],
        user_id: Annotated[str, Form()],
    ):
        self.file = file
        self.target_langs = json.loads(target_langs)
        self.is_shared = is_shared
        self.user_id = UUID(user_id)
