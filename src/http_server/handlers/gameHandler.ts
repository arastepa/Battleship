import WebSocket from 'ws';
import { connectedUsers } from '../server';

interface Ship {
  position: { x: number; y: number };
  direction: boolean;
  length: number;
  type: "small" | "medium" | "large" | "huge";
}

interface GameData {
  gameId: number | string;
  ships: Ship[];
  indexPlayer: number | string;
}

interface StartGameData {
  ships: Ship[];
  currentPlayerIndex: number | string;
}

const games: Record<number | string, { players: number; ships: Record<string, Ship[]> }> = {};

function handleGameMessage(ws: WebSocket, data: GameData, id: number): void {
  const parsedData = JSON.parse(data.toString());
  const { gameId, ships, indexPlayer } = parsedData;
  
  // Add ships to the game
  if (!games[gameId]) {
    games[gameId] = { players: 0, ships: {} };
  }

  games[gameId].ships[indexPlayer] = ships;
  games[gameId].players += 1;

  if (games[gameId].players === 2) {
    // Start the game when both players have added their ships
    Object.keys(games[gameId].ships).forEach(playerId => {
      connectedUsers[playerId].ws.send(
        JSON.stringify({
          type: 'start_game',
          data: JSON.stringify({
            ships: games[gameId].ships[playerId],
            currentPlayerIndex: indexPlayer,
          } as StartGameData),
          id,
        })
      );
    });
  } else {
    // Acknowledge that ships have been added
    ws.send(
      JSON.stringify({
        type: 'add_ships_ack',
        data: JSON.stringify({
          message: "Ships added successfully, waiting for the other player...",
          indexPlayer,
        }),
        id,
      })
    );
  }
}

export { handleGameMessage };
