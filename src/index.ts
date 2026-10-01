import fastify from "fastify";

import {env} from "./lib/env.js";

const server = fastify({
  logger: true,
});

server.listen({port: env.PORT}, (err, address) => {
  if (err) {
    server.log.error(err);
    process.exit(1);
  }
  server.log.info(`Server is running on ${address}`);
});
