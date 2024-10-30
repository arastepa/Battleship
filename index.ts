import { httpServer } from "./src/http_server/index.js";
import dotenv from 'dotenv'

dotenv.config();
const HTTP_PORT = 8181;

console.log(`Start static http server on the ${HTTP_PORT} port!`);
httpServer.listen(HTTP_PORT);
