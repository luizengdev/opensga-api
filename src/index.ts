import cors from "@fastify/cors";
import jwt from "@fastify/jwt";
import swagger from "@fastify/swagger";
import swaggerUi from "@fastify/swagger-ui";
import Fastify from "fastify";
import {jsonSchemaTransform, serializerCompiler, validatorCompiler} from "fastify-type-provider-zod";

import {env} from "./lib/env.js";

export const buildApp = () => {
  const app = Fastify({logger: true});

  app.setValidatorCompiler(validatorCompiler);
  app.setSerializerCompiler(serializerCompiler);

  app.register(cors, {
    origin: env.FRONTEND_URL,
    credentials: true,
  });

  app.register(jwt, {
    secret: env.JWT_SECRET,
    sign: {expiresIn: env.JWT_EXPIRES_IN},
  });

  app.register(swagger, {
    openapi: {
      info: {
        title: "OpenSGA-api",
        description: "API de Sistema de Gestão Acadêmica",
        version: "1.0.0",
      },
    },
    transform: jsonSchemaTransform,
  });

  app.register(swaggerUi, {routePrefix: "/docs"});

  return app;
};

const startServer = async () => {
  const app = buildApp();
  try {
    await app.listen({port: env.PORT, host: "0.0.0.0"});
    console.log(`🚀 OpenSGA-api executando em http://localhost:${env.PORT}`);
    console.log(`📑 OpenAPI / Swagger UI: http://localhost:${env.PORT}/docs`);
  } catch (error) {
    app.log.error(error);
    process.exit(1);
  }
};

startServer();
