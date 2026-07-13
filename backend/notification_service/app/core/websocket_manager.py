import logging
from typing import Dict, List
from fastapi import WebSocket

logger = logging.getLogger(__name__)

class ConnectionManager:
    """Manages active WebSocket connections grouped by hostel contexts (Task 6.3)."""
    
    def __init__(self):
        # Maps hostel_id -> list of active WebSockets
        self.active_connections: Dict[str, List[WebSocket]] = {}

    async def connect(self, hostel_id: str, websocket: WebSocket):
        await websocket.accept()
        if hostel_id not in self.active_connections:
            self.active_connections[hostel_id] = []
        self.active_connections[hostel_id].append(websocket)
        logger.info(f"WebSocket client connected to hostel: {hostel_id}")

    def disconnect(self, hostel_id: str, websocket: WebSocket):
        if hostel_id in self.active_connections:
            if websocket in self.active_connections[hostel_id]:
                self.active_connections[hostel_id].remove(websocket)
            if not self.active_connections[hostel_id]:
                del self.active_connections[hostel_id]
        logger.info(f"WebSocket client disconnected from hostel: {hostel_id}")

    async def broadcast_to_hostel(self, hostel_id: str, message: dict):
        """Broadcast real-time alert data directly to connected web dashboard (Task 6.3)."""
        if hostel_id in self.active_connections:
            for connection in self.active_connections[hostel_id]:
                try:
                    await connection.send_json(message)
                except Exception as e:
                    logger.error(f"WebSocket broadcast write error: {e}")

manager = ConnectionManager()
