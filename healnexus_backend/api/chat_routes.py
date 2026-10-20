from fastapi import APIRouter, Depends, HTTPException, WebSocket, WebSocketDisconnect, status
from sqlalchemy.orm import Session
from typing import List, Dict
import json
from datetime import datetime
from core.database import get_db
from core.security import get_current_user
from models.db_models import User, Appointment, Message
from pydantic import BaseModel
from core.sanitizer import sanitize_html

router = APIRouter()

# --- SCHEMAS ---
class MessageCreate(BaseModel):
    appointment_id: int
    receiver_id: int
    content: str

class MessageRead(BaseModel):
    id: int
    sender_id: int
    receiver_id: int
    content: str
    timestamp: datetime
    is_read: bool
    class Config:
        from_attributes = True

# --- WEBSOCKET MANAGER ---
class ConnectionManager:
    def __init__(self):
        # active_connections: { user_id: WebSocket }
        self.active_connections: Dict[int, WebSocket] = {}

    async def connect(self, user_id: int, websocket: WebSocket):
        await websocket.accept()
        self.active_connections[user_id] = websocket

    def disconnect(self, user_id: int):
        if user_id in self.active_connections:
            del self.active_connections[user_id]

    async def send_personal_message(self, message: str, user_id: int):
        if user_id in self.active_connections:
            await self.active_connections[user_id].send_text(message)

manager = ConnectionManager()

# --- HTTP ENDPOINTS ---

@router.get("/{appointment_id}/history", response_model=List[MessageRead])
def get_chat_history(appointment_id: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    # Verify user belongs to appointment
    apt = db.query(Appointment).filter(Appointment.id == appointment_id).first()
    if not apt or (current_user.id != apt.patient_id and current_user.id != apt.doctor_id):
        raise HTTPException(status_code=403, detail="Not authorized to view this chat.")
    
    messages = db.query(Message).filter(Message.appointment_id == appointment_id).order_by(Message.timestamp.asc()).all()
    return messages

# --- WEBSOCKET ENDPOINT ---

from core.database import SessionLocal # Import SessionLocal directly

@router.websocket("/ws/{user_id}")
async def websocket_endpoint(websocket: WebSocket, user_id: int):
    await manager.connect(user_id, websocket)
    db = SessionLocal() # Create a session for this connection
    try:
        while True:
            data = await websocket.receive_text()
            msg_data = json.loads(data)
            
            # Save to Database
            new_msg = Message(
                appointment_id=msg_data['appointment_id'],
                sender_id=user_id,
                receiver_id=msg_data['receiver_id'],
                content=sanitize_html(msg_data['content'])
            )
            db.add(new_msg)
            db.commit()
            db.refresh(new_msg)

            # Broadcast to receiver if online
            payload = {
                "id": new_msg.id,
                "appointment_id": new_msg.appointment_id,
                "sender_id": new_msg.sender_id,
                "content": new_msg.content,
                "timestamp": new_msg.timestamp.isoformat()
            }
            await manager.send_personal_message(json.dumps(payload), msg_data['receiver_id'])
            # Echo back to sender to confirm receipt
            await manager.send_personal_message(json.dumps(payload), user_id)

    except WebSocketDisconnect:
        manager.disconnect(user_id)
    finally:
        db.close() # Always close the session
