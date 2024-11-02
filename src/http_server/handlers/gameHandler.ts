import WebSocket from 'ws';
import { connectedUsers } from '../server';
import { addShipsToGame, isGameReady, startGame, getGameById, performAttack } from '../utils/db';
import { wsWithIdx } from '../types/types';

interface Ship {
  position: { x: number; y: number };
  direction: boolean;
  length: number;
  type: "small" | "medium" | "large" | "huge";
}

interface Game {
  gameId: string;
  players: {
    [playerIndex: string]: {
      ships: Ship[];
      hasSubmitted: boolean;
    };
  };
  currentPlayerIndex: string | null;
}

interface AttackData {
  gameId: string;
  x: number;
  y: number;
  indexPlayer: string;
}


interface AddShipsData {
  gameId: string;
  ships: Ship[];
  indexPlayer: string;
}

export function handleGameMessage(ws: wsWithIdx, data: string, id: number): void {
  try {
    const parsedData: AddShipsData = JSON.parse(data);
    const { gameId, ships, indexPlayer } = parsedData;
    console.log(gameId);

    addShipsToGame(gameId, indexPlayer, ships);

    // Acknowledge ship submission
    ws.send(JSON.stringify({
      type: "add_ships_ack",
      data: JSON.stringify({
        message: "Ships added successfully, waiting for the other player...",
      }),
      id,
    }));

    // Check if both players have submitted their ships
    if (isGameReady(gameId)) {
      console.log("SSSS");
      startGame(gameId);
    }

  } catch (error) {
    console.error("Error handling add_ships message:", error);
    ws.send(JSON.stringify({
      type: "error",
      data: JSON.stringify({ message: "Failed to add ships" }),
      id,
    }));
  }
}


function checkAllShipsDestroyed(player: any): boolean {
  // Check if all ships of the player are destroyed
  return false; // Placeholder, implement real logic
}

function notifyTurn(ws: WebSocket, game: Game, id: number) {
  ws.send(JSON.stringify({
    type: 'turn',
    data: JSON.stringify({ currentPlayer: game.currentPlayerIndex }),
    id,
  }));
}

export function handleAttack(ws: wsWithIdx, data: string, id: number) {
  const { gameId, x, y, indexPlayer } = JSON.parse(data);
  console.log("ccc:",gameId, x, y,indexPlayer);
  const game = getGameById(gameId);
  if (!game) return;

  const opponent = Object.keys(game.players).find((idx) => idx !== indexPlayer);
  if (opponent)
  {
    const result = performAttack(ws,gameId, opponent, {x, y});

    // Send attack feedback
    ws.send(JSON.stringify({
      type: 'attack',
      data: JSON.stringify({
        position: { x, y },
        currentPlayer: indexPlayer,
        status: result,
      }),
      id,
    }));

    if (checkAllShipsDestroyed(opponent)) {
      // Game over
      ws.send(JSON.stringify({
        type: 'finish',
        data: JSON.stringify({ winPlayer: indexPlayer }),
        id,
      }));
    } else {
      // Notify turn switch
      notifyTurn(ws, game, id);
    }
  }
}

