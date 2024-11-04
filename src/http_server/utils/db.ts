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
const hits: Map<{ x: number; y: number }, number> = new Map();
const isSunk: Map<{ x: number; y: number }, boolean> = new Map();
const shipCells: {
  x: number,
  y: number
}[] = [];

export function addPlayer(name: string, password: string, ws: wsWithIdx): Player {
  const index = Math.random().toString(36).substring(7);
  players[index] = { password, index, name, ws, attacks: []};
  return players[index];
}

export function getPlayers() {
  return players;
}

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
  if (currentId !== attacker.index) {
    room.players.forEach(el => el.ws.send(JSON.stringify({ type: 'error', message: 'Not your turn' })));
    return;
  }

  if (attacker.attacks.some(el => el.position.x === targetPosition.x && el.position.y === targetPosition.y)) {
    ws.send(JSON.stringify({ type: 'error', message: 'Position already attacked' }));
    return;
  }

  attacker.attacks.push({position: targetPosition});

  const defenderShips = games[gameId].players[defender.index].ships;
  const hitShip = defenderShips.find(ship =>  
    (ship.direction === false ? (targetPosition.x >= ship.position.x && targetPosition.x < (ship.position.x + ship.length) && ship.position.y === targetPosition.y):(targetPosition.y >= ship.position.y && targetPosition.y < (ship.position.y + ship.length)) && ship.position.x === targetPosition.x))
  console.log("hit:", hitShip);
  if (hitShip) {
    if (!hits.has(hitShip.position))
      hits.set(hitShip.position, 1);
    else {
      hits.set(hitShip.position, hits.get(hitShip.position)! + 1);
    }
    console.log("lnn:", hits.get(hitShip.position));
    const isShipSunk = hits.get(hitShip.position) === hitShip.length;
    
    for (let i = 0; i < hitShip.length; i++) {
      const x = hitShip.direction ? hitShip.position.x : hitShip.position.x + i;
      const y = hitShip.direction ? hitShip.position.y + i : hitShip.position.y;
      shipCells.push({ x, y });
    }

    if (isShipSunk)
    {
      if (!isSunk.has(hitShip.position))
        isSunk.set(hitShip.position, true);

      shipCells.forEach(cell => {
        room.players.forEach(el => el.ws.send(JSON.stringify({
          type: 'attack',
          data: JSON.stringify({
            position: cell,
            currentPlayer: attackerId,
            status: 'killed'
          }),
          id: 0
        })));
      })
    }
    else {
      room.players.forEach(el => el.ws.send(JSON.stringify({
        type: 'attack',
        data: JSON.stringify({
          position: targetPosition,
          currentPlayer: attackerId,
          status: 'shot',
        }),
        id: 0
      })));
    }

    const allShipsSunk = defenderShips.every((el, i) => isSunk.get(el.position) === true);
    if (allShipsSunk) {
      room.players.forEach(el => ws.send(JSON.stringify({ type: 'finish', data: JSON.stringify({winPlayer: attackerId}) })));
      return;
    }
  } else {
    console.log("byyy");
    room.players.forEach(el => ws.send(JSON.stringify({
      type: 'attack',
      data: JSON.stringify({
        position: targetPosition,
        currentPlayer: attackerId,
        status: 'miss',
      }),
      id: 0,
    })));

    const current = games[gameId].currentPlayerIndex;
      games[gameId].currentPlayerIndex = current === defender.index ? attacker.index : defender.index;
      notifyTurn(ws, games[gameId], id);
  }
}

export function addPlayerToRoom(roomId: string, player: Player): Room | null {
  const room = rooms[roomId];
  if (room && room.players.length < 2) {
    if (room.players.length === 0 || (room.players.length == 1 && player.name !== room.players[0].name))
      room.players.push(player);
    return room;
  }
  return null;
}

export function getAvailableRooms(): Room[] {
  return Object.values(rooms).filter((room) => room.players.length === 1);
}

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
  console.log("ships:", game.players[playerIndex].ships);
}

export function isGameReady(gameId: string): boolean {
  const game = games[gameId];
  if (!game) return false;
  return Object.values(game.players).every(player => player.hasSubmitted);
}

export function startGame(gameId: string): void {
  const game = games[gameId];
  if (!game) return;

  const playerIndices = Object.keys(game.players);
  const startingPlayerIndex = playerIndices[Math.floor(Math.random() * playerIndices.length)];
  game.currentPlayerIndex = startingPlayerIndex;

  console.log(playerIndices);
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

export function handleRandomAttack(ws: wsWithIdx, data: string, id: number) {
  const { gameId, indexPlayer } = JSON.parse(data);
  const game = getGameById(gameId);

  if (!game) return;

  const opponent = Object.keys(game.players).find((idx) => idx !== indexPlayer);
  if (!opponent) {
    ws.send(JSON.stringify({ type: 'error', message: 'No opponent found' }));
    return;
  }

  const x = Math.floor(Math.random() * 10);
  const y = Math.floor(Math.random() * 10);

  console.log(`Random attack at (${x}, ${y}) by player ${indexPlayer}`);

  performAttack(ws, gameId, indexPlayer, { x, y }, id);
}

