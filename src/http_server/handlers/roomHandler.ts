import { createRoom, getRooms } from '../utils/db';
import WebSocket from 'ws';


interface MessageData {
  [key: string]: any;
}

function handleRoomMessage(ws: WebSocket, data: MessageData, id: number): void {
  const room = createRoom();
  const response: { type: string; data: any; id: number } = {
    type: 'update_room',
    data: getRooms(),
    id,
  };
  ws.send(JSON.stringify(response));
}

export { handleRoomMessage };
