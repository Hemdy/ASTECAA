// Keep Better Auth's Node-compatible logger within the Deno permission allowlist.
Deno.env.set("FORCE_COLOR", "0");

const [{ createAstecAuth }, { createAuthHandler }] = await Promise.all([
  import("./auth/auth.ts"),
  import("./auth/handler.ts"),
]);

const configuration = createAstecAuth();
const database = (await import("./db/database.ts")).createDatabase(
  Deno.env.get("DATABASE_URL"),
);
const handleRequest = createAuthHandler(configuration, database);
const port = Number(Deno.env.get("ASTEC_API_PORT") ?? "8000");
if (!Number.isInteger(port) || port < 1 || port > 65535) {
  throw new Error("ASTEC_API_PORT must be an integer between 1 and 65535.");
}
const hostname = Deno.env.get("ASTEC_API_HOST") ??
  (configuration.appEnv === "production" ? "0.0.0.0" : "127.0.0.1");

Deno.serve(
  {
    hostname,
    port,
    onListen({ hostname: boundHostname, port: boundPort }) {
      console.info(`ASTECAA API listening on ${boundHostname}:${boundPort}.`);
    },
  },
  handleRequest,
);
