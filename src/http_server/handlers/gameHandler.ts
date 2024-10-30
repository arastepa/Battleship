import { addShipsToGame, startGame } from '../utils/db';

function handleGameMessage(ws, data, id) {
  const { gameId, ships, indexPlayer } = data;
  addShipsToGame(gameId, indexPlayer, ships);
//   if (/* Check if game can start */) {
//     startGame(gameId);
//   }
}

export { handleGameMessage };
