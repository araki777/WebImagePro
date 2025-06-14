from pydantic import BaseModel


class VisionRequest(BaseModel):
    blob_url: str


class VisionResponse(BaseModel):
    tags: list[str]
