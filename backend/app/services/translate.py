from typing import Dict, List

import requests

from app.core.config import settings


class TranslateService:
    def __init__(self):
        self.translation_url = settings.AZURE_TRANSLATION_URL
        self.translation_key = settings.AZURE_TRANSLATION_KEY
        self.translation_region = settings.AZURE_TRANSLATION_REGION

    def translate(
        self, texts: List[str], target_langs: List[str]
    ) -> Dict[str, List[str]]:
        """テキストを翻訳"""

        # 言語指定が1つの場合、カンマ区切りで指定されている場合があるので分割
        if (
            len(target_langs) == 1
            and isinstance(target_langs[0], str)
            and "," in target_langs[0]
        ):
            target_langs = target_langs[0].split(",")

        path = "/translate?api-version=3.0"
        for lang in target_langs:
            path += f"&to={lang}"

        url = self.translation_url + path
        headers = {
            "Ocp-Apim-Subscription-Key": self.translation_key,
            "Ocp-Apim-Subscription-Region": self.translation_region,
            "Content-Type": "application/json",
        }
        body = [{"text": text} for text in texts]
        response = requests.post(url, headers=headers, json=body)

        if not response.ok:
            raise ValueError(f"Translation API request failed: {response.text}")

        data = response.json()
        translations: Dict[str, List[str]] = {lang: [] for lang in target_langs}
        for text_result in data:
            for trans in text_result["translations"]:
                translations[trans["to"]].append(trans["text"])
        return translations
