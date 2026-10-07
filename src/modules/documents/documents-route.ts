import {FastifyInstance} from "fastify";
import {ZodTypeProvider} from "fastify-type-provider-zod";

import {Role} from "../../generated/prisma/enums.js";
import {listModelosDocumentoHandler, updateModeloDocumentoHandler} from "./documents-controller.js";
import {
  documentoIdParamsSchema,
  errorResponseSchema,
  modeloDocumentoListSchema,
  modeloDocumentoSchema,
  updateModeloDocumentoSchema,
} from "./documents-schemas.js";

export const documentsRoutes = async (app: FastifyInstance): Promise<void> => {
  const typedApp = app.withTypeProvider<ZodTypeProvider>();
  const acessoAdmin = {
    onRequest: [app.authenticate],
    preHandler: [app.authorize([Role.ADMIN])],
  };

  typedApp.get(
    "/documentos/modelos",
    {
      ...acessoAdmin,
      schema: {
        tags: ["Documentos"],
        summary: "Listar modelos oficiais de emissão acadêmica",
        security: [{bearerAuth: []}],
        response: {
          200: modeloDocumentoListSchema,
          401: errorResponseSchema,
          403: errorResponseSchema,
        },
      },
    },
    listModelosDocumentoHandler,
  );

  typedApp.patch(
    "/documentos/modelos/:id",
    {
      ...acessoAdmin,
      schema: {
        tags: ["Documentos"],
        summary: "Atualizar texto, descrição e disponibilidade de um modelo",
        security: [{bearerAuth: []}],
        params: documentoIdParamsSchema,
        body: updateModeloDocumentoSchema,
        response: {
          200: modeloDocumentoSchema,
          400: errorResponseSchema,
          401: errorResponseSchema,
          403: errorResponseSchema,
          404: errorResponseSchema,
        },
      },
    },
    updateModeloDocumentoHandler,
  );
};
