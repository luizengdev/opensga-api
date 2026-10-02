import {FastifyInstance} from "fastify";
import {ZodTypeProvider} from "fastify-type-provider-zod";

import {Role} from "../../generated/prisma/enums.js";
import {getAdminDashboardHandler, getProfessorDashboardHandler} from "./dashboard-controller.js";
import {
  adminDashboardResponseSchema,
  dashboardPeriodQuerySchema,
  errorResponseSchema,
  professorDashboardResponseSchema,
} from "./dashboard-schemas.js";

export const dashboardRoutes = async (app: FastifyInstance): Promise<void> => {
  const typedApp = app.withTypeProvider<ZodTypeProvider>();

  typedApp.get(
    "/dashboard/admin",
    {
      onRequest: [app.authenticate],
      preHandler: [app.authorize([Role.ADMIN])],
      schema: {
        tags: ["Dashboard"],
        summary: "Resumo operacional do período letivo para a secretaria",
        security: [{bearerAuth: []}],
        querystring: dashboardPeriodQuerySchema,
        response: {
          200: adminDashboardResponseSchema,
          401: errorResponseSchema,
          403: errorResponseSchema,
        },
      },
    },
    getAdminDashboardHandler,
  );

  typedApp.get(
    "/dashboard/professor",
    {
      onRequest: [app.authenticate],
      preHandler: [app.authorize([Role.PROFESSOR])],
      schema: {
        tags: ["Dashboard"],
        summary: "Resumo das turmas e lançamentos pendentes do professor",
        security: [{bearerAuth: []}],
        querystring: dashboardPeriodQuerySchema,
        response: {
          200: professorDashboardResponseSchema,
          401: errorResponseSchema,
          403: errorResponseSchema,
        },
      },
    },
    getProfessorDashboardHandler,
  );
};
