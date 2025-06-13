from typing import Any, List

import requests

from app.core.config import settings


class VisionService:
    def __init__(self):
        self.vision_url = settings.AZURE_COMPUTE_VISION_URL
        self.vision_key = settings.AZURE_COMPUTE_VISION_KEY

    def get_tags(self, blob_url: str) -> List[str]:
        """画像のタグを取得"""
        vision_url = f"{self.vision_url}/vision/v3.2/tags"
        headers = {
            "Ocp-Apim-Subscription-Key": self.vision_key,
            "Content-Type": "application/json",
        }
        data = {"url": blob_url}
        response = requests.post(vision_url, headers=headers, json=data)

        if response.status_code == 429:
            raise ValueError("Rate limit exceeded")
        if not response.ok:
            raise Exception(f"Vision API request failed: {response.text}")

        data = response.json()
        tags_data: Any = data.get("tags", [])
        if not isinstance(tags_data, list):
            raise ValueError("Invalid response format from Vision API")

        return [
            tag["name"] for tag in tags_data if isinstance(tag, dict) and "name" in tag
        ]
