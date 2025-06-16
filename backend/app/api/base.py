import json

from fastapi import APIRouter, Request, Response
from fastapi.routing import APIRoute

from app.core.logging import logger


class LoggingRoute(APIRoute):
    def get_route_handler(self):
        original_route_handler = super().get_route_handler()

        async def custom_route_handler(request: Request):
            # リクエスト情報の収集
            request_info = {
                "method": request.method,
                "url": str(request.url),
                "headers": dict(request.headers),
                "client": request.client.host if request.client else None,
                "path_params": request.path_params,
                "query_params": dict(request.query_params),
            }

            # リクエストボディの取得
            if request.method in ["POST", "PUT", "PATCH"]:
                try:
                    request_info["body"] = await request.json()
                except (json.JSONDecodeError, ValueError):
                    request_info["body"] = None

            # レスポンスの取得
            response: Response = await original_route_handler(request)

            # レスポンス情報の収集
            response_info = {
                "status_code": response.status_code,
                "headers": dict(response.headers),
            }

            try:
                response_info["body"] = json.loads(response.body)
            except (json.JSONDecodeError, ValueError):
                response_info["body"] = None

            # ログ出力
            logger.info(
                "API Request/Response",
                extra={
                    "request": request_info,
                    "response": response_info,
                    "duration": response.headers.get("X-Process-Time", "0"),
                },
            )

            return response

        return custom_route_handler

# ベースとなるルーターの作成
base_router = APIRouter(route_class=LoggingRoute)


# ヘルスチェック
@base_router.get("/")
async def health_check():
    return {"status": "healthy", "version": "1.0.0"}
