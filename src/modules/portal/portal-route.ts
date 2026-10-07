import {FastifyInstance} from "fastify";
import {ZodTypeProvider} from "fastify-type-provider-zod";

import {Role} from "../../generated/prisma/enums.js";
import {
  emitirPortalDocumentoHandler,
  listPortalDocumentosHandler,
} from "../documents/documents-controller.js";
import {
  documentoEmitidoSchema,
  emitirDocumentoSchema,
  errorResponseSchema as documentoErrorResponseSchema,
  portalDocumentoCatalogoSchema,
} from "../documents/documents-schemas.js";
import {createPortalReclamacaoHandler, getPortalContextoHandler} from "./portal-controller.js";
import {
  createPortalReclamacaoSchema,
  errorResponseSchema,
  portalContextoQuerySchema,
  portalContextoResponseSchema,
  portalReclamacaoSchema,
} from "./portal-schemas.js";

export const portalRoutes = async (app: FastifyInstance): Promise<void> => {
  const typedApp = app.withTypeProvider<ZodTypeProvider>();
  const acessoPortal = {
    onRequest: [app.authenticate],
    preHandler: [app.authorize([Role.ALUNO, Role.RESPONSAVEL])],
  };

  typedApp.get(
    "/portal/contexto",
    {
      ...acessoPortal,
      schema: {
        tags: ["Portal do Aluno"],
        summary: "Contexto acadêmico, financeiro e institucional do aluno ou dependente",
        security: [{bearerAuth: []}],
        querystring: portalContextoQuerySchema,
        response: {
          200: portalContextoResponseSchema,
          401: errorResponseSchema,
          403: errorResponseSchema,
          404: errorResponseSchema,
        },
      },
    },
    getPortalContextoHandler,
  );

  typedApp.post(
    "/portal/ouvidoria",
    {
      ...acessoPortal,
      schema: {
        tags: ["Portal do Aluno"],
        summary: "Abrir protocolo de ouvidoria em nome do usuário autenticado",
        security: [{bearerAuth: []}],
        body: createPortalReclamacaoSchema,
        response: {
          201: portalReclamacaoSchema,
          400: errorResponseSchema,
          401: errorResponseSchema,
          403: errorResponseSchema,
        },
      },
    },
    createPortalReclamacaoHandler,
  );

  typedApp.get(
    "/portal/documentos",
    {
      ...acessoPortal,
      schema: {
        tags: ["Portal do Aluno"],
        summary: "Listar modelos oficiais disponíveis para emissão",
        security: [{bearerAuth: []}],
        response: {
          200: portalDocumentoCatalogoSchema,
          401: errorResponseSchema,
          403: errorResponseSchema,
        },
      },
    },
    listPortalDocumentosHandler,
  );

  typedApp.post(
    "/portal/documentos/emitir",
    {
      ...acessoPortal,
      schema: {
        tags: ["Portal do Aluno"],
        summary: "Emitir documento oficial com o texto da secretaria e os dados do vínculo",
        security: [{bearerAuth: []}],
        body: emitirDocumentoSchema,
        response: {
          200: documentoEmitidoSchema,
          400: documentoErrorResponseSchema,
          401: errorResponseSchema,
          403: errorResponseSchema,
          404: documentoErrorResponseSchema,
          409: documentoErrorResponseSchema,
        },
      },
    },
    emitirPortalDocumentoHandler,
  );
};
