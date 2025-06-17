import json
import time
import traceback
from typing import Any, Dict

from fastapi import APIRouter, Request, Response
from fastapi.responses import StreamingResponse
from fastapi.routing import APIRoute

from app.core.logging import logger


class LoggingRoute(APIRoute):
    def get_route_handler(self):
        original_route_handler = super().get_route_handler()

        async def custom_route_handler(request: Request):
            start_time = time.time()
            request_id = f"{int(start_time * 1000)}"

            # リクエスト情報の収集
            request_info = {
                "id": request_id,
                "method": request.method,
                "url": str(request.url),
                "path": request.url.path,
                "client_ip": request.client.host if request.client else None,
                "user_agent": request.headers.get("user-agent", ""),
                "content_type": request.headers.get("content-type", ""),
                "path_params": request.path_params,
                "query_params": dict(request.query_params),
            }

            # リクエストボディの取得
            if request.method in ["POST", "PUT", "PATCH"]:
                try:
                    body = await request.body()
                    if body:
                        request_info["body"] = json.loads(body.decode())
                    else:
                        request_info["body"] = None
                except (json.JSONDecodeError, ValueError, UnicodeDecodeError) as e:
                    request_info["body"] = f"[Invalid JSON: {str(e)}]"

            # リクエスト開始ログ
            logger.info(
                f"🚀 API Request Started - {request.method} {request.url.path}",
                extra={
                    "request": request_info,
                    "duration": 0,
                },
            )

            try:
                # レスポンスの取得
                response: Response = await original_route_handler(request)

                # レスポンス情報の収集
                response_info = {
                    "status_code": response.status_code,
                    "content_type": response.headers.get("content-type", ""),
                    "content_length": response.headers.get("content-length", ""),
                }

                # レスポンスボディの取得
                if not isinstance(response, StreamingResponse):
                    try:
                        if hasattr(response, "body") and response.body:
                            if isinstance(response.body, bytes):
                                response_info["body"] = json.loads(
                                    response.body.decode()
                                )
                            else:
                                response_info["body"] = response.body
                        else:
                            response_info["body"] = None
                    except (json.JSONDecodeError, ValueError, UnicodeDecodeError):
                        response_info["body"] = "[Non-JSON Response]"
                else:
                    response_info["body"] = "[StreamingResponse]"

                duration = time.time() - start_time

                # 成功時のログ出力
                log_level = (
                    logger.info if response.status_code < 400 else logger.warning
                )
                log_level(
                    f"✅ API Request Completed - {request.method} {request.url.path} - {response.status_code}",
                    extra={
                        "request": request_info,
                        "response": response_info,
                        "duration": duration,
                    },
                )

                return response

            except Exception as e:
                duration = time.time() - start_time
                error_info = {
                    "error_message": str(e),
                    "error_type": type(e).__name__,
                    "traceback": traceback.format_exc(),
                }

                # エラー時の詳細ログ出力
                logger.error(
                    f"❌ API Request Failed - {request.method} {request.url.path}",
                    extra={
                        "request": request_info,
                        "error": error_info,
                        "duration": duration,
                    },
                    exc_info=True,
                )

                # エラーの種類に応じた追加ログ
                if "422" in str(e) or "validation" in str(e).lower():
                    logger.error(
                        f"🔍 Validation Error Details for {request.method} {request.url.path}",
                        extra={
                            "request": request_info,
                            "error": error_info,
                            "duration": duration,
                        },
                    )
                elif "409" in str(e) or "already exists" in str(e).lower():
                    logger.warning(
                        f"⚠️  Conflict Error for {request.method} {request.url.path}",
                        extra={
                            "request": request_info,
                            "error": error_info,
                            "duration": duration,
                        },
                    )

                raise

        return custom_route_handler


# ベースとなるルーターの作成
base_router = APIRouter(route_class=LoggingRoute)


# ヘルスチェック
@base_router.get("/")
async def health_check():
    return {"status": "healthy", "version": "1.0.0"}
