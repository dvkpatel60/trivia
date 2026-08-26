import path from "node:path";
import type { Connect, Plugin, ViteDevServer } from "vite";

const ENDPOINT = "/.netlify/functions/game";

/**
 * Serves the game function from the Vite dev server.
 *
 * Without this, `npm run dev` gives you pass-and-play and nothing else: the
 * Host and Join buttons sit disabled because there is no function answering,
 * and the only documented way to get one was the Netlify CLI — which cannot
 * be installed alongside vitest here, and is a very large thing to need
 * before you can check that a lobby works.
 *
 * So the real handler is mounted directly, loaded through Vite's own module
 * graph (which is what lets it resolve the workspace packages from source),
 * backed by a filesystem blob store under `node_modules/.curio-blobs`.
 *
 * Development only. In production Netlify serves the same file itself, and
 * `netlify dev` still works if you want the genuine article.
 */
export function gameApi(): Plugin {
  return {
    name: "curio:game-api",
    apply: "serve",

    configureServer(server: ViteDevServer) {
      // Beside the install, so it is already ignored and easy to throw away.
      process.env.CURIO_LOCAL_BLOBS ??= path.resolve(
        server.config.root,
        "../../node_modules/.curio-blobs",
      );

      const handlerPath = path.resolve(server.config.root, "../../netlify/functions/game.mts");

      const middleware: Connect.NextHandleFunction = (request, response, next) => {
        if (!request.url?.startsWith(ENDPOINT)) return next();

        void (async () => {
          try {
            // Loaded per request so editing the function hot-reloads it, the
            // same as everything else in the app.
            const module = (await server.ssrLoadModule(handlerPath)) as {
              default: (request: Request) => Promise<Response>;
            };

            const chunks: Buffer[] = [];
            for await (const chunk of request) chunks.push(chunk as Buffer);

            const result = await module.default(
              new Request(`http://localhost${request.url}`, {
                method: request.method ?? "POST",
                headers: { "content-type": "application/json" },
                body: request.method === "POST" ? Buffer.concat(chunks).toString() : undefined,
              }),
            );

            response.statusCode = result.status;
            response.setHeader("content-type", "application/json");
            response.end(await result.text());
          } catch (error) {
            // A stack trace in the response beats a silent 500 when the thing
            // you are debugging is the function itself.
            server.config.logger.error(`[game-api] ${String(error)}`);
            response.statusCode = 500;
            response.setHeader("content-type", "application/json");
            response.end(
              JSON.stringify({
                error: error instanceof Error ? error.message : String(error),
                code: "server_error",
              }),
            );
          }
        })();
      };

      server.middlewares.use(middleware);

      server.config.logger.info(
        `  \x1b[32m➜\x1b[0m  \x1b[1mgame api\x1b[0m: serving ${ENDPOINT} (blobs in node_modules/.curio-blobs)`,
      );
    },
  };
}
