import "dotenv/config";
import { createServer } from "node:http";
import { initSchema } from "./db.js";
import { routeRequest } from "./router.js";
import { ensureDemoAccount } from "./seed.js";

const port = Number(process.env.PORT ?? 8787);
const host = process.env.HOST ?? "127.0.0.1";

async function main(): Promise<void> {
  await initSchema();
  await ensureDemoAccount();
  const server = createServer((request, response) => {
    void routeRequest(request, response);
  });
  server.listen(port, host, () => {
    console.log(`DreamTwin API listening on http://${host}:${port}`);
  });
}

main().catch((error) => {
  console.error("Failed to start DreamTwin API:", error);
  process.exit(1);
});
