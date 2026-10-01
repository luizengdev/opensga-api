import {FastifyInstance} from "fastify";
import {ZodTypeProvider} from "fastify-type-provider-zod";

import {Role} from "../../generated/prisma/enums.js";
import {enrollInTurmaHandler, updateGradesHandler} from "./grading-controller.js";
import {
  avaliacaoResponseSchema,
  enrollInTurmaSchema,
  enturmacaoResponseSchema,
  errorResponseSchema,
  updateGradesSchema,
} from "./grading-schemas.js";

export const gradingRoutes = async (app: FastifyInstance): Promise<void> => {
  const typedApp = app.withTypeProvider<ZodTypeProvider>();

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
