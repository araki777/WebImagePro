import json
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
        try:
            # JSON文字列の場合はパースする
            if (
                len(target_langs) == 1
                and isinstance(target_langs[0], str)
                and target_langs[0].startswith("[")
            ):
                target_langs = json.loads(target_langs[0])
            # カンマ区切りの場合は分割
            elif (
                len(target_langs) == 1
                and isinstance(target_langs[0], str)
                and "," in target_langs[0]
            ):
                target_langs = target_langs[0].split(",")

            # 翻訳対象の言語をフィルタリング（英語は翻訳しない）
            translate_langs = [lang for lang in target_langs if lang != "en"]

            # 英語のタグはそのまま保持
            translations: Dict[str, List[str]] = {lang: [] for lang in target_langs}
            if "en" in target_langs:
                translations["en"] = texts  # 英語のタグはそのまま

            # 翻訳対象の言語がない場合は早期リターン
            if not translate_langs:
                return translations

            # 翻訳APIを呼び出し
            path = "/translate?api-version=3.0&from=en"
            for lang in translate_langs:
                path += f"&to={lang}"

            url = self.translation_url + path
            headers = {
                "Ocp-Apim-Subscription-Key": self.translation_key,
                "Ocp-Apim-Subscription-Region": self.translation_region,
                "Content-Type": "application/json",
            }
            body = [{"text": text} for text in texts]

            response = requests.post(url, headers=headers, json=body, timeout=30)

            if not response.ok:
                # エラーが発生した場合は英語のタグのみを返す
                return translations

            data = response.json()
            for text_result in data:
                for trans in text_result["translations"]:
                    target_lang = trans["to"]
                    translations[target_lang].append(trans["text"])

            return translations

        except Exception as e:
            print(f"Unexpected error in Translation API request: {e}")
            # エラーが発生した場合は英語のタグのみを返す
            translations = {lang: [] for lang in target_langs}
            if "en" in target_langs:
                translations["en"] = texts
            return translations
