import WebSocket from 'ws';
import { connectedUsers } from '../server';
import { wsWithIdx } from '../types/types';

interface Player {
  password: string;
  index: string;
  name: string;
  ws: wsWithIdx;
  attacks: {
    position: {
      x: number;
      y: number;
    }
    // result: string;
  }[]
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
  // hits: {x: number; y: number}[]
}

interface Game {
  gameId: string;
  roomId: string;
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
const hits: Map<string, { x: number; y: number }[]> = new Map();
const isSunk: Record<string, boolean> = {};


// Function to add a player
export function addPlayer(name: string, password: string, ws: wsWithIdx): Player {
  const index = Math.random().toString(36).substring(7);
  players[index] = { password, index, name, ws, attacks: []};
  return players[index];
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

function notifyTurn(ws: wsWithIdx, game: Game, id: number) {
  const room = Object.values(rooms).find(el => el.roomId === game.roomId);
  if (room)
  {
    room.players.forEach(el => {
      el.ws.send(JSON.stringify({
        type: 'turn',
        data: JSON.stringify({ currentPlayer: game.currentPlayerIndex }),
        id,
      }));
    }
    )
  }
}

export function performAttack(ws:wsWithIdx, gameId: string, attackerId: string, targetPosition: {x: number; y: number}, id: number) {
  const room = rooms[games[gameId].roomId];
  if (!room) {
    ws.send(JSON.stringify({ type: 'error', message: 'Room not found' }));
    return;
  }

  const attacker = room.players.find(el => el.index === attackerId);
  const defender = room.players.find(el => el.index !== attackerId);
  if (!attacker || !defender) {
    ws.send(JSON.stringify({ type: 'error', message: 'Players not found' }));
    return;
  }

  const currentId =  games[gameId].currentPlayerIndex;
  console.log("turn:", currentId);
  console.log("attacker:", attackerId);
  // Check if it's the attacker's turn
  if (currentId !== attacker.index) {
    room.players.forEach(el => el.ws.send(JSON.stringify({ type: 'error', message: 'Not your turn' })));
    return;
  }

  // Check if the target position has already been attacked
  if (attacker.attacks.some(el => el.position.x === targetPosition.x && el.position.y === targetPosition.y)) {
    ws.send(JSON.stringify({ type: 'error', message: 'Position already attacked' }));
    return;
  }

  // Record the attack in the attacker's history
  attacker.attacks.push({position: targetPosition});

  // Check if the target position hits a ship
  const defenderShips = games[gameId].players[defender.index].ships;
  const hitShip = defenderShips.find(ship => 
    ship.position.x === targetPosition.x && ship.position.y === targetPosition.y)

  if (hitShip) {
    // Mark the hit position on the ship
    if (!hits.has(defender.index))
      hits.set(defender.index, []);
    hits.get(defender.index)!.push(targetPosition);

    // Check if the ship is fully destroyed
    const isShipSunk = hits.get(defender.index)?.length === hitShip.length;
    isSunk[defender.index] = isShipSunk
    // Notify players of the hit or sink result
    room.players.forEach(el => el.ws.send(JSON.stringify({
      type: 'attack',
      result: 'hit',
      position: targetPosition,
      currentPlayer: attackerId,
      message: isShipSunk ? 'Ship sunk!' : 'Hit!',
    })));

    // End the game if all ships are sunk
    const allShipsSunk = defenderShips.every((el, i) => isSunk[i] === true);
    if (allShipsSunk) {
      room.players.forEach(el => ws.send(JSON.stringify({ type: 'finish', winner: attackerId })));
      return;
    }
  } else {
    console.log("byyy");
    // Missed attack
    room.players.forEach(el => ws.send(JSON.stringify({
      type: 'attack',
      result: 'miss',
      position: targetPosition,
      currentPlayer: attackerId,
      message: 'Miss!',
    })));

    const current = games[gameId].currentPlayerIndex;
      games[gameId].currentPlayerIndex = current === defender.index ? attacker.index : defender.index;
      notifyTurn(ws, games[gameId], id);
  }

  // Change turn to the other player
  // room.currentTurn = defenderId;
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
    roomId: roomId
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
        player.ws.send(JSON.stringify({
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


