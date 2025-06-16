from functools import wraps

from fastapi import HTTPException, status

from app.core.error_messages import ERROR_MESSAGES


def handle_api_errors(module: str, error_key: str = "error"):
    """
    APIエラーを処理するデコレーター

    Args:
      module: モジュール名
      error_key: エラーメッセージのキー

    Returns:
      Callable: デコレーター関数
    """

    def decorator(func):
        @wraps(func)
        async def wrapper(*args, **kwargs):
            try:
                return await func(*args, **kwargs)
            except ValueError as e:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail=f"{ERROR_MESSAGES[module][error_key]}: {str(e)}",
                )
            except Exception as e:
                raise HTTPException(
                    status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                    detail=f"{ERROR_MESSAGES[module][error_key]}: {str(e)}",
                )

        return wrapper

    return decorator
