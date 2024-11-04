import { addPlayer } from '../utils/db';
import WebSocket from 'ws';
import { connectedUsers } from '../server';
import { wsWithIdx } from '../types/types';


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

function handlePlayerMessage(ws: wsWithIdx, data: MessageData, id: number): void {
  const { name, password } = JSON.parse(data.toString());
  const player = addPlayer(name, password, ws);
  ws.id = player.index;
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
