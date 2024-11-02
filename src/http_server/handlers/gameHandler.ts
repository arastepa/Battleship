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

export function handleAttack(ws: wsWithIdx, data: string, id: number) {
  const { gameId, x, y, indexPlayer } = JSON.parse(data);
  console.log("ccc:",gameId, x, y,indexPlayer);
  const game = getGameById(gameId);
  if (!game) return;

  const opponent = Object.keys(game.players).find((idx) => idx !== indexPlayer);
  const attacker = Object.keys(game.players).find((idx) => idx === indexPlayer);
  if (opponent && attacker)
  {
    performAttack(ws,gameId, indexPlayer, {x, y}, id);
  }
}

