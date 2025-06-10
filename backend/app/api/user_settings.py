import logging
from datetime import datetime, UTC

from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session

from app.connection import get_db
from app.schemas.user_setting import UserSetting, UserSettingUpdate
from app.models.user_setting import UserSetting as UserSettingModel
from app.auth.utils import get_current_user

logger = logging.getLogger(__name__)

router = APIRouter()

@router.get("/me/setting", response_model=UserSetting)
async def get_current_user_setting(
  current_user = Depends(get_current_user),
  db: Session = Depends(get_db)
):
  try:
    # ユーザーIDを使用して設定を取得
    setting = db.query(UserSettingModel).filter(
      UserSettingModel.id == current_user.user.id
    ).first()

    if not setting:
      raise HTTPException(status_code=404, detail="Setting not found")

    return setting
  except Exception as e:
    logger.error(f"Error: {str(e)}")
    raise HTTPException(status_code=400, detail=str(e))

@router.put("/me/setting", response_model=UserSetting)
async def update_current_user_setting(
  setting_update: UserSettingUpdate,
  current_user = Depends(get_current_user),
  db: Session = Depends(get_db)
):
  try:
    # ユーザーIDを使用して設定を取得
    setting = db.query(UserSettingModel).filter(
      UserSettingModel.id == current_user.user.id
    ).first()

    if not setting:
      # 設定が存在しない場合は新規作成
      setting = UserSettingModel(
        id=current_user.user.id,
        created_at=datetime.now(UTC),
        updated_at=datetime.now(UTC),
        **setting_update.dict(exclude_unset=True)
      )
      db.add(setting)
    else:
      # 既存の設定を更新
      for key, value in setting_update.dict(exclude_unset=True).items():
        setattr(setting, key, value)
      setting.updated_at = datetime.now(UTC)

    db.commit()
    db.refresh(setting)
    return setting
  except Exception as e:
    db.rollback()
    raise HTTPException(status_code=400, detail=str(e))