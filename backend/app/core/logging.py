import json
import logging
import sys
from datetime import datetime
from typing import Any, Dict

from app.core.config import settings


# カスタムフォーマッターを作成
class DetailedFormatter(logging.Formatter):
    def format(self, record):
        # 基本情報
        log_entry = {
            "timestamp": datetime.now().isoformat(),
            "level": record.levelname,
            "logger": record.name,
            "message": record.getMessage(),
        }

        # 追加情報がある場合は詳細を追加
        if hasattr(record, "request"):
            log_entry["request"] = record.request
        if hasattr(record, "response"):
            log_entry["response"] = record.response
        if hasattr(record, "duration"):
            log_entry["duration"] = f"{record.duration:.3f}s"
        if hasattr(record, "error"):
            log_entry["error"] = record.error
        if hasattr(record, "error_type"):
            log_entry["error_type"] = record.error_type

        # JSON形式で出力
        return json.dumps(log_entry, ensure_ascii=False, indent=2)


# シンプルなフォーマッター（通常のログ用）
class SimpleFormatter(logging.Formatter):
    def format(self, record):
        # asctimeを設定
        if not hasattr(record, "asctime"):
            record.asctime = self.formatTime(record)
        return f"{record.asctime} - {record.name} - {record.levelname} - {record.getMessage()}"


# ログフォーマットを改善
detailed_formatter = DetailedFormatter()
simple_formatter = SimpleFormatter(
    "%(asctime)s - %(name)s - %(levelname)s - %(message)s", datefmt="%Y-%m-%d %H:%M:%S"
)

# コンソールハンドラー（詳細ログ用）
console_handler = logging.StreamHandler(sys.stdout)
console_handler.setFormatter(detailed_formatter)

# ファイルハンドラー（通常ログ用）
file_handler = logging.FileHandler("app.log", encoding="utf-8")
file_handler.setFormatter(simple_formatter)

# ルートロガーの設定
root_logger = logging.getLogger()
root_logger.setLevel(settings.LOG_LEVEL)
root_logger.addHandler(console_handler)
root_logger.addHandler(file_handler)

# アプリケーションロガー
logger = logging.getLogger("webimagepro")
logger.setLevel(settings.LOG_LEVEL)

# サードパーティライブラリのログレベルを調整
logging.getLogger("httpx").setLevel(logging.INFO)
logging.getLogger("urllib3").setLevel(logging.INFO)
