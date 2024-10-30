import { addPlayer } from '../utils/db';
import WebSocket from 'ws';

interface MessageData {
  name: string;
  password: string;
}

interface ResponseData {
  name: string;
  index: string;
  error: boolean;
  errorText: string;
}

function handlePlayerMessage(ws: WebSocket, data: MessageData, id: number): void {
  const { name, password } = data;
  const player = addPlayer(name, password);
  
  const response: { type: string; data: ResponseData; id: number } = {
    type: 'reg',
    data: { name, index: player.index, error: false, errorText: '' },
    id
  };

  ws.send(JSON.stringify(response));
}

export { handlePlayerMessage };
