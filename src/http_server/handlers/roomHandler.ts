import { createRoom, getRooms } from '../utils/db';

function handleRoomMessage(ws, data, id) {
  const room = createRoom();
  ws.send(JSON.stringify({
    type: 'update_room',
    data: getRooms(),
    id
  }));
}

export { handleRoomMessage };
