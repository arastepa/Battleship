import {WebSocketServer} from 'ws';
import { handlePlayerMessage } from './handlers/playerHandler';
import { handleRoomMessage } from './handlers/roomHandler';
import { handleGameMessage } from './handlers/gameHandler';


export function startWs() {
  const wss = new WebSocketServer({ port: 3000, clientTracking: true });
  
  wss.on('connection', ws => {
    console.log("HII");
    ws.on('message', message => {
      const { type, data, id } = JSON.parse(message.toString());
      console.log(typeof message);
      console.log(type);
      switch (type) {
        case 'reg':
          handlePlayerMessage(ws, data, id);
          break;
        case 'create_room':
          handleRoomMessage(ws, data, id);
          break;
          case 'add_ships':
            // handleGameMessage(ws, data, id);
            break;
            // More cases as required
        }
      });
    ws.on('close', () => {
      console.log('Client disconnected');
    });
  });
}