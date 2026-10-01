import "dotenv/config";

import fastifyCors from "@fastify/cors";
import jwt from "@fastify/jwt";
import {fastifySwagger} from "@fastify/swagger";
import fastifyApiReference from "@scalar/fastify-api-reference";
import Fastify from "fastify";
import {jsonSchemaTransform, serializerCompiler, validatorCompiler, ZodTypeProvider} from "fastify-type-provider-zod";

import {env} from "./lib/env.js";

const envToLogger = {
  development: {
    transport: {
      target: "pino-pretty",
      options: {
        translateTime: "HH:MM:ss Z",
        ignore: "pid,hostname",
      },
    },
  },
  production: true,
  test: false,
};

const app = Fastify({logger: envToLogger[env.NODE_ENV]});

app.setValidatorCompiler(validatorCompiler);
app.setSerializerCompiler(serializerCompiler);

await app.register(fastifyCors, {
  origin: [env.FRONTEND_URL].filter(Boolean),
  credentials: true,
});

await app.register(jwt, {
  secret: env.JWT_SECRET,
  sign: {expiresIn: env.JWT_EXPIRES_IN},
});

await app.register(fastifySwagger, {
  openapi: {
    info: {
      title: "OpenSGA-api",
      description: "API de Sistema de Gestão Acadêmica",
      version: "1.0.0",
    },
    servers: [
      {
        description: "API Base URL",
        url: env.API_BASE_URL,
      },
    ],
  },
  transform: jsonSchemaTransform,
});

await app.register(fastifyApiReference, {
  routePrefix: "/docs",
  configuration: {
    url: "/swagger.json",
  },
});

app.withTypeProvider<ZodTypeProvider>().route({
  method: "GET",
  url: "/swagger.json",
  schema: {
    hide: true,
  },
  handler: async () => {
    return app.swagger();
  },
});

const startServer = async () => {
  try {
    await app.listen({port: env.PORT, host: "0.0.0.0"});
  } catch (error) {
    app.log.error(error);
    process.exit(1);
  }
};

startServer();
