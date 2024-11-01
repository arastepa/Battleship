import {WebSocketServer} from 'ws';
import { handlePlayerMessage } from './handlers/playerHandler';
import { handleRoomMessage } from './handlers/roomHandler';
// import { handleGameMessage } from './handlers/gameHandler';
import WebSocket from 'ws';

export const connectedUsers: Record<string, { ws: WebSocket; name: string }> = {};
let currentIndex = 0;
export function startWs() {
  const wss = new WebSocketServer({ port: 3000, clientTracking: true });
  
  wss.on('connection', ws => {
    currentIndex++;
    ws.on('message', message => {
      const { type, data, id } = JSON.parse(message.toString());
      console.log(typeof message);
      console.log(type);
      switch (type) {
        case 'reg':
          handlePlayerMessage(ws, data, id, currentIndex);
          break;
        case 'create_room':
        case 'add_user_to_room':
          handleRoomMessage(ws, data, id, currentIndex);
          break;
        // case 'add_ships':
        //     handleGameMessage(ws, data, id);
        //     break;
          // More cases as required
        }
      });
    ws.on('close', () => {
      console.log('Client disconnected');
    });
  });
}