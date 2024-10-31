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
  const { name, password } = JSON.parse(data.toString());
  const player = addPlayer(name, password);
  ws.send(
    JSON.stringify(
    {
      type: 'reg',
      data: JSON.stringify({ name, index: player.index, error: false, errorText: '' }),
      id
    })
  );
}

export { handlePlayerMessage };
