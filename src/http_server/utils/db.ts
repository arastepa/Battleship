import WebSocket from 'ws';
import { connectedUsers } from '../server';

interface Player {
  password: string;
  index: string;
  name: string;
  currentIndex: number;
}

interface Room {
  players: Player[];
  roomId: string;
}

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

const players: Record<string, Player> = {};
const rooms: Record<string, Room> = {};
const games: Record<string, Game> = {};

// Function to add a player
export function addPlayer(name: string, password: string, currentIndex:number): Player {
  const index = Math.random().toString(36).substring(7);
  players[name] = { password, index, name, currentIndex };
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
    if (room.players.length === 0 || (room.players.length == 1 && player.name !== room.players[0].name))
      room.players.push(player);
    return room;
  }
  return null;
}

// Function to get rooms with only one player
export function getAvailableRooms(): Room[] {
  return Object.values(rooms).filter((room) => room.players.length === 1);
}

// Function to retrieve all rooms
export function getRooms(): Room[] {
  return Object.values(rooms);
}

export function createGame(roomId: string): Game {
  const gameId = 'game_' + Math.random().toString(36).substring(2, 15);
  const room = rooms[roomId];
  const game: Game = {
    gameId,
    players: {},
    currentPlayerIndex: null,
  };

  room.players.forEach(player => {
    game.players[player.index] = {
      ships: [],
      hasSubmitted: false,
    };
  });

  games[gameId] = game;
  return game;
}

export function addShipsToGame(gameId: string, playerIndex: string, ships: Ship[]): void {
  const game = games[gameId];
  if (game && game.players[playerIndex]) {
    game.players[playerIndex].ships = ships;
    game.players[playerIndex].hasSubmitted = true;
  }
  console.log(game);
}

export function isGameReady(gameId: string): boolean {
  const game = games[gameId];
  if (!game) return false;
  return Object.values(game.players).every(player => player.hasSubmitted);
}

export function startGame(gameId: string): void {
  const game = games[gameId];
  if (!game) return;

  // Randomly select who starts
  const playerIndices = Object.keys(game.players);
  const startingPlayerIndex = playerIndices[Math.floor(Math.random() * playerIndices.length)];
  game.currentPlayerIndex = startingPlayerIndex;

  console.log(playerIndices);
  // Notify both players to start the game
  playerIndices.forEach(index => {
    const player = Object.values(players).find(el => el.index === index);
    console.log("player:", player);
    if (player) {
     connectedUsers[player.currentIndex].ws.send(JSON.stringify({
        type: "start_game",
        data: JSON.stringify({
          ships: game.players[index].ships,
          currentPlayerIndex: startingPlayerIndex,
        }),
        id: 0,
      }));
    }
  });
}

export function getGameById(gameId: string): Game | undefined {
  return games[gameId];
}


