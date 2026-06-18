import { createServer } from "node:http";
import { routeRequest } from "./router.js";

const port = Number(process.env.PORT ?? 8787);
const host = process.env.HOST ?? "127.0.0.1";

const server = createServer((request, response) => {
  void routeRequest(request, response);
});

server.listen(port, host, () => {
  console.log(`DreamTwin API listening on http://${host}:${port}`);
});
