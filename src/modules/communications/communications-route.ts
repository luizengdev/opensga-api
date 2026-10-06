import {FastifyInstance} from "fastify";
import {ZodTypeProvider} from "fastify-type-provider-zod";

import {Role} from "../../generated/prisma/enums.js";
import {
  closeReclamacaoHandler,
  createComunicadoHandler,
  createReclamacaoHandler,
  deleteComunicadoHandler,
  deleteReclamacaoHandler,
  getComunicadoHandler,
  getReclamacaoHandler,
  listComunicadosHandler,
  listReclamacoesHandler,
  respondReclamacaoHandler,
  updateComunicadoHandler,
} from "./communications-controller.js";
import {
  comunicadoListResponseSchema,
  comunicadoResponseSchema,
  createComunicadoSchema,
  createReclamacaoSchema,
  deleteResponseSchema,
  errorResponseSchema,
  idParamsSchema,
  listComunicadosQuerySchema,
  listReclamacoesQuerySchema,
  reclamacaoListResponseSchema,
  reclamacaoResponseSchema,
  responderReclamacaoSchema,
  updateComunicadoSchema,
} from "./communications-schemas.js";

export const communicationsRoutes = async (app: FastifyInstance): Promise<void> => {
  const typedApp = app.withTypeProvider<ZodTypeProvider>();
  const acessoAdmin = {
    onRequest: [app.authenticate],
    preHandler: [app.authorize([Role.ADMIN])],
  };
  const acessoLeitura = {
    onRequest: [app.authenticate],
    preHandler: [app.authorize([Role.ADMIN, Role.PROFESSOR])],
  };

  typedApp.get(
    "/comunicados",
    {
      ...acessoLeitura,
      schema: {
        tags: ["Comunicados"],
        summary: "Listar comunicados, com filtro opcional por público-alvo",
        security: [{bearerAuth: []}],
        querystring: listComunicadosQuerySchema,
        response: {
          200: comunicadoListResponseSchema,
          401: errorResponseSchema,
          403: errorResponseSchema,
        },
      },
    },
    listComunicadosHandler,
  );

  typedApp.post(
    "/comunicados",
    {
      ...acessoAdmin,
      schema: {
        tags: ["Comunicados"],
        summary: "Publicar comunicado institucional",
        security: [{bearerAuth: []}],
        body: createComunicadoSchema,
        response: {
          201: comunicadoResponseSchema,
          400: errorResponseSchema,
          401: errorResponseSchema,
          403: errorResponseSchema,
        },
      },
    },
    createComunicadoHandler,
  );

  typedApp.get(
    "/comunicados/:id",
    {
      ...acessoLeitura,
      schema: {
        tags: ["Comunicados"],
        summary: "Buscar comunicado por id",
        security: [{bearerAuth: []}],
        params: idParamsSchema,
        response: {
          200: comunicadoResponseSchema,
          401: errorResponseSchema,
          403: errorResponseSchema,
          404: errorResponseSchema,
        },
      },
    },
    getComunicadoHandler,
  );

  typedApp.patch(
    "/comunicados/:id",
    {
      ...acessoAdmin,
      schema: {
        tags: ["Comunicados"],
        summary: "Atualizar comunicado",
        security: [{bearerAuth: []}],
        params: idParamsSchema,
        body: updateComunicadoSchema,
        response: {
          200: comunicadoResponseSchema,
          400: errorResponseSchema,
          401: errorResponseSchema,
          403: errorResponseSchema,
          404: errorResponseSchema,
        },
      },
    },
    updateComunicadoHandler,
  );

  typedApp.delete(
    "/comunicados/:id",
    {
      ...acessoAdmin,
      schema: {
        tags: ["Comunicados"],
        summary: "Excluir comunicado",
        security: [{bearerAuth: []}],
        params: idParamsSchema,
        response: {
          200: deleteResponseSchema,
          401: errorResponseSchema,
          403: errorResponseSchema,
          404: errorResponseSchema,
        },
      },
    },
    deleteComunicadoHandler,
  );

  typedApp.get(
    "/ouvidoria/reclamacoes",
    {
      ...acessoAdmin,
      schema: {
        tags: ["Ouvidoria"],
        summary: "Listar reclamações, com filtro opcional por status e tipo",
        security: [{bearerAuth: []}],
        querystring: listReclamacoesQuerySchema,
        response: {
          200: reclamacaoListResponseSchema,
          401: errorResponseSchema,
          403: errorResponseSchema,
        },
      },
    },
    listReclamacoesHandler,
  );

  typedApp.post(
    "/ouvidoria/reclamacoes",
    {
      ...acessoAdmin,
      schema: {
        tags: ["Ouvidoria"],
        summary: "Registrar reclamação em nome de um usuário",
        security: [{bearerAuth: []}],
        body: createReclamacaoSchema,
        response: {
          201: reclamacaoResponseSchema,
          400: errorResponseSchema,
          401: errorResponseSchema,
          403: errorResponseSchema,
          404: errorResponseSchema,
        },
      },
    },
    createReclamacaoHandler,
  );

  typedApp.get(
    "/ouvidoria/reclamacoes/:id",
    {
      ...acessoAdmin,
      schema: {
        tags: ["Ouvidoria"],
        summary: "Buscar reclamação por id",
        security: [{bearerAuth: []}],
        params: idParamsSchema,
        response: {
          200: reclamacaoResponseSchema,
          401: errorResponseSchema,
          403: errorResponseSchema,
          404: errorResponseSchema,
        },
      },
    },
    getReclamacaoHandler,
  );

  typedApp.patch(
    "/ouvidoria/reclamacoes/:id/responder",
    {
      ...acessoAdmin,
      schema: {
        tags: ["Ouvidoria"],
        summary: "Registrar resposta oficial da ouvidoria",
        security: [{bearerAuth: []}],
        params: idParamsSchema,
        body: responderReclamacaoSchema,
        response: {
          200: reclamacaoResponseSchema,
          400: errorResponseSchema,
          401: errorResponseSchema,
          403: errorResponseSchema,
          404: errorResponseSchema,
        },
      },
    },
    respondReclamacaoHandler,
  );

  typedApp.patch(
    "/ouvidoria/reclamacoes/:id/fechar",
    {
      ...acessoAdmin,
      schema: {
        tags: ["Ouvidoria"],
        summary: "Encerrar reclamação",
        security: [{bearerAuth: []}],
        params: idParamsSchema,
        response: {
          200: reclamacaoResponseSchema,
          401: errorResponseSchema,
          403: errorResponseSchema,
          404: errorResponseSchema,
        },
      },
    },
    closeReclamacaoHandler,
  );

  typedApp.delete(
    "/ouvidoria/reclamacoes/:id",
    {
      ...acessoAdmin,
      schema: {
        tags: ["Ouvidoria"],
        summary: "Excluir reclamação",
        security: [{bearerAuth: []}],
        params: idParamsSchema,
        response: {
          200: deleteResponseSchema,
          401: errorResponseSchema,
          403: errorResponseSchema,
          404: errorResponseSchema,
        },
      },
    },
    deleteReclamacaoHandler,
  );
};
