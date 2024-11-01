// file: src/handlers/gameHandler.ts

import WebSocket from 'ws';
import { connectedUsers } from '../server';
import { addShipsToGame, isGameReady, startGame, getGameById } from '../utils/db';

interface Ship {
  position: { x: number; y: number };
  direction: boolean;
  length: number;
  type: "small" | "medium" | "large" | "huge";
}

interface AddShipsData {
  gameId: string;
  ships: Ship[];
  indexPlayer: string;
}

export function handleGameMessage(ws: WebSocket, data: string, id: number): void {
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
