import {FastifyInstance} from "fastify";
import {ZodTypeProvider} from "fastify-type-provider-zod";

import {Role} from "../../generated/prisma/enums.js";
import {
  deleteDiarioHandler,
  enrollInTurmaHandler,
  getDiarioHandler,
  listDiariosHandler,
  updateGradesHandler,
} from "./grading-controller.js";
import {
  avaliacaoResponseSchema,
  deleteResponseSchema,
  diarioListResponseSchema,
  diarioResponseSchema,
  enrollInTurmaSchema,
  enturmacaoResponseSchema,
  errorResponseSchema,
  idParamsSchema,
  listDiariosQuerySchema,
  updateGradesSchema,
} from "./grading-schemas.js";

export const gradingRoutes = async (app: FastifyInstance): Promise<void> => {
  const typedApp = app.withTypeProvider<ZodTypeProvider>();

  typedApp.get(
    "/diario",
    {
      onRequest: [app.authenticate],
      preHandler: [app.authorize([Role.ADMIN, Role.PROFESSOR])],
      schema: {
        tags: ["Acadêmico - Diário"],
        summary: "Listar diários por turma e/ou matrícula; professor vê apenas as suas turmas",
        security: [{bearerAuth: []}],
        querystring: listDiariosQuerySchema,
        response: {
          200: diarioListResponseSchema,
          401: errorResponseSchema,
          403: errorResponseSchema,
        },
      },
    },
    listDiariosHandler,
  );

  typedApp.get(
    "/diario/:id",
    {
      onRequest: [app.authenticate],
      preHandler: [app.authorize([Role.ADMIN, Role.PROFESSOR])],
      schema: {
        tags: ["Acadêmico - Diário"],
        summary: "Buscar diário de classe por id; professor somente das próprias turmas",
        security: [{bearerAuth: []}],
        params: idParamsSchema,
        response: {
          200: diarioResponseSchema,
          401: errorResponseSchema,
          403: errorResponseSchema,
          404: errorResponseSchema,
        },
      },
    },
    getDiarioHandler,
  );

  typedApp.delete(
    "/diario/:id",
    {
      onRequest: [app.authenticate],
      preHandler: [app.authorize([Role.ADMIN])],
      schema: {
        tags: ["Acadêmico - Diário"],
        summary: "Desenturmar aluno removendo o diário",
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
    deleteDiarioHandler,
  );

  typedApp.post(
    "/diario/enturmar",
    {
      onRequest: [app.authenticate],
      preHandler: [app.authorize([Role.ADMIN])],
      schema: {
        tags: ["Acadêmico - Diário"],
        summary: "Enturmar matrícula ativa em turma da disciplina da matriz",
        security: [{bearerAuth: []}],
        body: enrollInTurmaSchema,
        response: {
          201: enturmacaoResponseSchema,
          400: errorResponseSchema,
          401: errorResponseSchema,
          403: errorResponseSchema,
          404: errorResponseSchema,
        },
      },
    },
    enrollInTurmaHandler,
  );

  typedApp.patch(
    "/diario/avaliar",
    {
      onRequest: [app.authenticate],
      preHandler: [app.authorize([Role.ADMIN, Role.PROFESSOR])],
      schema: {
        tags: ["Acadêmico - Diário"],
        summary: "Lançar A1, A2, AF e faltas com recálculo de aprovação e integralização",
        security: [{bearerAuth: []}],
        body: updateGradesSchema,
        response: {
          200: avaliacaoResponseSchema,
          400: errorResponseSchema,
          401: errorResponseSchema,
          403: errorResponseSchema,
          404: errorResponseSchema,
        },
      },
    },
    updateGradesHandler,
  );
};
