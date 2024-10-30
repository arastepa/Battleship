import WebSocket from 'ws';
import { handlePlayerMessage } from './handlers/playerHandler';
import { handleRoomMessage } from './handlers/roomHandler';
import { handleGameMessage } from './handlers/gameHandler';

const wss = new WebSocket.Server({ port: 8080 });

wss.on('connection', ws => {
  ws.on('message', message => {
    const { type, data, id } = JSON.parse(JSON.stringify(message));

    switch (type) {
      case 'reg':
        handlePlayerMessage(ws, data, id);
        break;
      case 'create_room':
        handleRoomMessage(ws, data, id);
        break;
      case 'add_ships':
        handleGameMessage(ws, data, id);
        break;
      // More cases as required
    }
  });

  ws.on('close', () => {
    console.log('Client disconnected');
  });
});

export default wss;
