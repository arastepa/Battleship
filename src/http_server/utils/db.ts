import WebSocket from 'ws';

interface Player {
  password: string;
  index: string;
}

interface Room {
  players: Player[];
  roomId: string;
}

interface Game {
  players: WebSocket[];
  [key: string]: any;
}

const players: Record<string, Player> = {};
const rooms: Record<string, Room> = {};
const games: Record<string, Game> = {};

// Function to add a player
export function addPlayer(name: string, password: string): Player {
  const index = Math.random().toString(36).substring(7);
  players[name] = { password, index };
  return players[name];
}

export function getPlayers() {
  return players;
}

// Function to create a new room and return it
export function createRoom(): Room {
  const roomId = 'room' + Math.random().toString(36).substring(7);
  const newRoom: Room = { players: [], roomId };
  rooms[roomId] = newRoom;
  return newRoom;
}

// Function to add a player to a room by roomId
export function addPlayerToRoom(roomId: string, player: Player): Room | null {
  const room = rooms[roomId];
  if (room && room.players.length < 2) {
    room.players.push(player);
    return room;
  }
  return null;
}

// Function to get rooms with only one player
export function getAvailableRooms(): Room[] {
  return Object.values(rooms).filter((room) => room.players.length === 1);
}

// Function to add ships to a game by player index
export function addShipsToGame(gameId: string, indexPlayer: string, ships: any): void {
  if (!games[gameId]) {
    games[gameId] = {
      players: [],
      [indexPlayer]: ships,
    };
  } else {
    games[gameId][indexPlayer] = ships;
  }
}

// Function to retrieve all rooms
export function getRooms(): Room[] {
  return Object.values(rooms);
}

// Function to start a game
export function startGame(gameId: string): void {
  const game = games[gameId];
  game.players.forEach((player) => {
    player.send(
      JSON.stringify({
        type: 'start_game',
        data: { ships: game[gameId], currentPlayerIndex: Math.random() },
        id: 0,
      })
    );
  });
}
