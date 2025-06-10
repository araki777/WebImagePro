from pydantic import BaseModel

class TranslateRequest(BaseModel):
  tags: list[str]
  target_langs: list[str]

class TranslateResponse(BaseModel):
  translations: dict