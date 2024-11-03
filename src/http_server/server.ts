import {WebSocketServer} from 'ws';
import { handlePlayerMessage } from './handlers/playerHandler';
import { handleRoomMessage } from './handlers/roomHandler';
import { handleAttack, handleGameMessage } from './handlers/gameHandler';
import WebSocket from 'ws';
import { wsWithIdx } from './types/types';
import { handleRandomAttack } from './utils/db';

export const connectedUsers: Record<string, { ws: WebSocket; name: string }> = {};
export function startWs() {
  const wss = new WebSocketServer({ port: 3000, clientTracking: true });
  
  wss.on('connection', (ws: wsWithIdx) => {
    ws.on('message', message => {
      const { type, data, id } = JSON.parse(message.toString());
      console.log(typeof message);
      console.log(type);
      switch (type) {
        case 'reg':
          handlePlayerMessage(ws, data, id);
          break;
        case 'create_room':
        case 'add_user_to_room':
          handleRoomMessage(ws, data, id);
          break;
        case 'add_ships':
            handleGameMessage(ws, data, id);
            break;
          // More cases as required
        case 'attack':
            handleAttack(ws, data, id);
            break;
        case 'randomAttack':
            handleRandomAttack(ws, data, id);
            break;
        }
      });
    ws.on('close', () => {
      console.log('Client disconnected');
    });
  });
}