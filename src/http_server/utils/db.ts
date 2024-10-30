interface Player {
    password: string;
    index: string;
  }
  
  interface Room {
    players: Player[];
  }
  
  interface Game {
    players: WebSocket[];
    [key: string]: any;
  }
  
  const players: Record<string, Player> = {};
  const rooms: Record<string, Room> = {};
  const games: Record<string, Game> = {};
  
  export function addPlayer(name: string, password: string): Player {
    const index = Math.random().toString(36).substring(7);
    players[name] = { password, index };
    return players[name];
  }
  
  export function createRoom(): Room {
    const roomId = 'room' + Math.random().toString(36).substring(7);
    rooms[roomId] = { players: [] };
    return rooms[roomId];
  }
  
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
  
  export function startGame(gameId: string): void {
    const game = games[gameId];
    game.players.forEach(player => {
      player.send(JSON.stringify({
        type: 'start_game',
        data: { ships: game[gameId], currentPlayerIndex: Math.random() },
        id: 0,
      }));
    });
  }