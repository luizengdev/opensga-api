import {FastifyInstance} from "fastify";
import {ZodTypeProvider} from "fastify-type-provider-zod";

import {Role} from "../../generated/prisma/enums.js";
import {
  aprovarTermoHandler,
  createTermoIndividualHandler,
  createTermosTurmaHandler,
  listTermosDiariosHandler,
  listTermosHandler,
  listTermosTurmasHandler,
  recusarTermoHandler,
} from "./termos-controller.js";
import {
  createTermoIndividualSchema,
  createTermoTurmaSchema,
  errorResponseSchema,
  idParamsSchema,
  listTermosDiariosQuerySchema,
  listTermosQuerySchema,
  listTermosTurmasQuerySchema,
  termoDiarioListResponseSchema,
  termoListResponseSchema,
  termoResponseSchema,
  termoTurmaListResponseSchema,
} from "./termos-schemas.js";

export const termosRoutes = async (app: FastifyInstance): Promise<void> => {
  const typedApp = app.withTypeProvider<ZodTypeProvider>();
  const acessoProfessor = {
    onRequest: [app.authenticate],
    preHandler: [app.authorize([Role.PROFESSOR])],
  };
  const acessoAdmin = {
    onRequest: [app.authenticate],
    preHandler: [app.authorize([Role.ADMIN])],
  };
  const acessoLeitura = {
    onRequest: [app.authenticate],
    preHandler: [app.authorize([Role.ADMIN, Role.PROFESSOR])],
  };

  typedApp.get(
    "/termos",
    {
      ...acessoLeitura,
      schema: {
        tags: ["Termo de Abertura"],
        summary: "Listar solicitações de termo; professor vê apenas as próprias",
        security: [{bearerAuth: []}],
        querystring: listTermosQuerySchema,
        response: {
          200: termoListResponseSchema,
          401: errorResponseSchema,
          403: errorResponseSchema,
        },
      },
    },
    listTermosHandler,
  );

  typedApp.get(
    "/termos/turmas",
    {
      ...acessoProfessor,
      schema: {
        tags: ["Termo de Abertura"],
        summary: "Listar turmas fechadas do professor para solicitação de abertura",
        security: [{bearerAuth: []}],
        querystring: listTermosTurmasQuerySchema,
        response: {
          200: termoTurmaListResponseSchema,
          401: errorResponseSchema,
          403: errorResponseSchema,
        },
      },
    },
    listTermosTurmasHandler,
  );

  typedApp.get(
    "/termos/diarios",
    {
      ...acessoProfessor,
      schema: {
        tags: ["Termo de Abertura"],
        summary: "Buscar diários do professor por RA ou nome do aluno (abertos e encerrados)",
        security: [{bearerAuth: []}],
        querystring: listTermosDiariosQuerySchema,
        response: {
          200: termoDiarioListResponseSchema,
          401: errorResponseSchema,
          403: errorResponseSchema,
        },
      },
    },
    listTermosDiariosHandler,
  );

  typedApp.post(
    "/termos/turma",
    {
      ...acessoProfessor,
      schema: {
        tags: ["Termo de Abertura"],
        summary: "Solicitar reabertura de turmas com semestre fechado",
        security: [{bearerAuth: []}],
        body: createTermoTurmaSchema,
        response: {
          201: termoListResponseSchema,
          400: errorResponseSchema,
          401: errorResponseSchema,
          403: errorResponseSchema,
          404: errorResponseSchema,
          409: errorResponseSchema,
        },
      },
    },
    createTermosTurmaHandler,
  );

  typedApp.post(
    "/termos/individual",
    {
      ...acessoProfessor,
      schema: {
        tags: ["Termo de Abertura"],
        summary: "Solicitar alteração individual de AV, AVS, AV3 ou faltas em diário fechado",
        security: [{bearerAuth: []}],
        body: createTermoIndividualSchema,
        response: {
          201: termoResponseSchema,
          400: errorResponseSchema,
          401: errorResponseSchema,
          403: errorResponseSchema,
          404: errorResponseSchema,
          409: errorResponseSchema,
        },
      },
    },
    createTermoIndividualHandler,
  );

  typedApp.patch(
    "/termos/:id/aprovar",
    {
      ...acessoAdmin,
      schema: {
        tags: ["Termo de Abertura"],
        summary: "Aprovar termo: reabre a turma ou persiste a nota/falta individual",
        security: [{bearerAuth: []}],
        params: idParamsSchema,
        response: {
          200: termoResponseSchema,
          400: errorResponseSchema,
          401: errorResponseSchema,
          403: errorResponseSchema,
          404: errorResponseSchema,
          409: errorResponseSchema,
        },
      },
    },
    aprovarTermoHandler,
  );

  typedApp.patch(
    "/termos/:id/recusar",
    {
      ...acessoAdmin,
      schema: {
        tags: ["Termo de Abertura"],
        summary: "Recusar solicitação de termo de abertura",
        security: [{bearerAuth: []}],
        params: idParamsSchema,
        response: {
          200: termoResponseSchema,
          401: errorResponseSchema,
          403: errorResponseSchema,
          404: errorResponseSchema,
          409: errorResponseSchema,
        },
      },
    },
    recusarTermoHandler,
  );
};
