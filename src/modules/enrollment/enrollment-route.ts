import {FastifyInstance} from "fastify";
import {ZodTypeProvider} from "fastify-type-provider-zod";

import {Role} from "../../generated/prisma/enums.js";
import {
  createEnrollmentHandler,
  listEnrollmentsHandler,
  updateEnrollmentStatusHandler,
} from "./enrollment-controller.js";
import {
  createEnrollmentResponseSchema,
  createEnrollmentSchema,
  enrollmentIdParamsSchema,
  enrollmentListResponseSchema,
  enrollmentStatusResponseSchema,
  errorResponseSchema,
  updateEnrollmentStatusSchema,
} from "./enrollment-schemas.js";

export const enrollmentRoutes = async (app: FastifyInstance): Promise<void> => {
  const typedApp = app.withTypeProvider<ZodTypeProvider>();
  const acessoAdmin = {
    onRequest: [app.authenticate],
    preHandler: [app.authorize([Role.ADMIN])],
  };

  typedApp.post(
    "/matriculas",
    {
      ...acessoAdmin,
      schema: {
        tags: ["Matrículas"],
        summary: "Efetivar matrícula com vínculo de matriz curricular",
        security: [{bearerAuth: []}],
        body: createEnrollmentSchema,
        response: {
          201: createEnrollmentResponseSchema,
          400: errorResponseSchema,
          401: errorResponseSchema,
          403: errorResponseSchema,
          404: errorResponseSchema,
        },
      },
    },
    createEnrollmentHandler,
  );

  typedApp.get(
    "/matriculas",
    {
      ...acessoAdmin,
      schema: {
        tags: ["Matrículas"],
        summary: "Listar todas as matrículas ativas da instituição",
        security: [{bearerAuth: []}],
        response: {
          200: enrollmentListResponseSchema,
          401: errorResponseSchema,
          403: errorResponseSchema,
        },
      },
    },
    listEnrollmentsHandler,
  );

  typedApp.patch(
    "/matriculas/:id/status",
    {
      ...acessoAdmin,
      schema: {
        tags: ["Matrículas"],
        summary: "Atualizar o status da matrícula",
        security: [{bearerAuth: []}],
        params: enrollmentIdParamsSchema,
        body: updateEnrollmentStatusSchema,
        response: {
          200: enrollmentStatusResponseSchema,
          400: errorResponseSchema,
          401: errorResponseSchema,
          403: errorResponseSchema,
          404: errorResponseSchema,
        },
      },
    },
    updateEnrollmentStatusHandler,
  );
};
