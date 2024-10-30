import { addShipsToGame, startGame } from '../utils/db';
import WebSocket from 'ws';

interface MessageData {
  gameId: string;
  ships: any[];
  indexPlayer: string;
}

function handleGameMessage(ws: WebSocket, data: MessageData, id: number): void {
  const { gameId, ships, indexPlayer } = data;
  addShipsToGame(gameId, indexPlayer, ships);

  // Uncomment and modify the condition to check if the game can start
  // if (/* Check if game can start */) {
  //   startGame(gameId);
  // }
}

export { handleGameMessage };
