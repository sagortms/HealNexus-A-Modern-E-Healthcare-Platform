from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional
from core.database import get_db
from core.security import get_current_user
from models.db_models import User, Notification
from pydantic import BaseModel
from datetime import datetime

router = APIRouter()

class NotificationRead(BaseModel):
    id: int
    title: str
    message: str
    link: Optional[str] = None
    is_read: bool
    created_at: datetime
    class Config:
        from_attributes = True

# --- HELPER TO CREATE NOTIFICATION ---
def create_notification(db: Session, user_id: int, title: str, message: str, link: str = None):
    new_notif = Notification(
        user_id=user_id,
        title=title,
        message=message,
        link=link
    )
    db.add(new_notif)
    db.commit()

@router.get("/", response_model=List[NotificationRead])
def get_my_notifications(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    notifs = db.query(Notification).filter(Notification.user_id == current_user.id).order_by(Notification.created_at.desc()).limit(20).all()
    return notifs

@router.put("/{notif_id}/read")
def mark_as_read(notif_id: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    notif = db.query(Notification).filter(Notification.id == notif_id, Notification.user_id == current_user.id).first()
    if not notif:
        raise HTTPException(status_code=404, detail="Notification not found.")
    
    notif.is_read = True
    db.commit()
    return {"message": "Marked as read."}

@router.put("/read-all")
def mark_all_as_read(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    db.query(Notification).filter(Notification.user_id == current_user.id, Notification.is_read == False).update({"is_read": True})
    db.commit()
    return {"message": "All notifications marked as read."}
