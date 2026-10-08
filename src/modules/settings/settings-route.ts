import {FastifyInstance} from "fastify";
import {ZodTypeProvider} from "fastify-type-provider-zod";

import {Role} from "../../generated/prisma/enums.js";
import {getParametrizacoesHandler, updateParametrizacoesHandler} from "./settings-controller.js";
import {errorResponseSchema, parametrizacoesSchema, updateParametrizacoesSchema} from "./settings-schemas.js";

export const settingsRoutes = async (app: FastifyInstance): Promise<void> => {
  const typedApp = app.withTypeProvider<ZodTypeProvider>();
  const autenticado = {
    onRequest: [app.authenticate],
  };
  const acessoAdmin = {
    onRequest: [app.authenticate],
    preHandler: [app.authorize([Role.ADMIN])],
  };

  typedApp.get(
    "/parametrizacoes",
    {
      ...autenticado,
      schema: {
        tags: ["Parametrizações"],
        summary: "Ler parâmetros institucionais vigentes",
        security: [{bearerAuth: []}],
        response: {
          200: parametrizacoesSchema,
          401: errorResponseSchema,
        },
      },
    },
    getParametrizacoesHandler,
  );

  typedApp.patch(
    "/parametrizacoes",
    {
      ...acessoAdmin,
      schema: {
        tags: ["Parametrizações"],
        summary: "Atualizar período, regulamento de notas e identidade da IES",
        security: [{bearerAuth: []}],
        body: updateParametrizacoesSchema,
        response: {
          200: parametrizacoesSchema,
          400: errorResponseSchema,
          401: errorResponseSchema,
          403: errorResponseSchema,
        },
      },
    },
    updateParametrizacoesHandler,
  );
};
