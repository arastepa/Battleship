import WebSocket from 'ws';
import { createRoom, addPlayerToRoom, getAvailableRooms, getPlayers, createGame } from '../utils/db'; // Utility functions for managing rooms
import { connectedUsers } from '../server';
import { wsWithIdx } from '../types/types';

interface RoomData {
  indexRoom?: string;
}

interface CreateGameResponse {
  type: string;
  data: {
    idGame: string;
    idPlayer: string;
  };
  id: number;
}

interface UpdateRoomResponse {
  type: string;
  data: Array<{
    roomId: string;
    roomUsers: Array<{ name: string; index: string }>;
  }>;
  id: number;
}

function handleRoomMessage(ws: wsWithIdx, data: RoomData, id: number): void {
  if (data)
  {
    data = JSON.parse(data.toString());
  }
 if (!data.indexRoom) {
    const newRoom = createRoom(); // Create a new room with unique roomId
    const players = getPlayers();
    addPlayerToRoom(newRoom.roomId, players[ws.id]); // Add the player to the new room
    sendRoomUpdate(ws, id);
  } else {
    const roomId = data.indexRoom;
    const players = getPlayers();
    const player = players[ws.id];
    const room = addPlayerToRoom(roomId, player);
    console.log("room:", room);
    const game = createGame(roomId);
    if (room?.players.length === 2) {
      console.log("FFF");
      room.players.forEach((player) => {
      const wss = player.ws;
        wss.send(JSON.stringify({
          type: 'create_game',
          data: JSON.stringify({
            idGame: game.gameId,
            idPlayer: player.index,
          }),
          id
        }));
      });
      sendRoomUpdate(ws, id);
    } else {
      ws.send(JSON.stringify({ type: 'error', data: JSON.stringify({ message: 'Room not found or full' }), id }));
    }
  }
}

function sendRoomUpdate(ws: WebSocket, id: number): void {
  const availableRooms = getAvailableRooms();
  ws.send(JSON.stringify({type: 'update_room',
    data: JSON.stringify(availableRooms.map((room) => ({
      roomId: room.roomId,
      roomUsers: room.players.map((p) => ({ name: p.name, index: p.index })),
    }))),
    id}));
}

export { handleRoomMessage };
