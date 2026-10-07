import {FastifyInstance} from "fastify";
import {ZodTypeProvider} from "fastify-type-provider-zod";

import {Role} from "../../generated/prisma/enums.js";
import {
  createEnrollmentHandler,
  deleteEnrollmentHandler,
  executeInternalTransferHandler,
  getEnrollmentHandler,
  listEnrollmentsHandler,
  previewInternalTransferHandler,
  updateEnrollmentStatusHandler,
} from "./enrollment-controller.js";
import {
  createEnrollmentResponseSchema,
  createEnrollmentSchema,
  deleteResponseSchema,
  enrollmentIdParamsSchema,
  enrollmentItemSchema,
  enrollmentListResponseSchema,
  enrollmentStatusResponseSchema,
  errorResponseSchema,
  listEnrollmentsQuerySchema,
  transferEnrollmentResponseSchema,
  transferEnrollmentSchema,
  transferPreviewQuerySchema,
  transferPreviewResponseSchema,
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
        summary: "Listar matrículas, com filtro opcional de status",
        security: [{bearerAuth: []}],
        querystring: listEnrollmentsQuerySchema,
        response: {
          200: enrollmentListResponseSchema,
          401: errorResponseSchema,
          403: errorResponseSchema,
        },
      },
    },
    listEnrollmentsHandler,
  );

  typedApp.get(
    "/matriculas/:id",
    {
      ...acessoAdmin,
      schema: {
        tags: ["Matrículas"],
        summary: "Buscar matrícula por id",
        security: [{bearerAuth: []}],
        params: enrollmentIdParamsSchema,
        response: {
          200: enrollmentItemSchema,
          401: errorResponseSchema,
          403: errorResponseSchema,
          404: errorResponseSchema,
        },
      },
    },
    getEnrollmentHandler,
  );

  typedApp.delete(
    "/matriculas/:id",
    {
      ...acessoAdmin,
      schema: {
        tags: ["Matrículas"],
        summary: "Excluir matrícula e diários vinculados",
        security: [{bearerAuth: []}],
        params: enrollmentIdParamsSchema,
        response: {
          200: deleteResponseSchema,
          401: errorResponseSchema,
          403: errorResponseSchema,
          404: errorResponseSchema,
        },
      },
    },
    deleteEnrollmentHandler,
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

  typedApp.get(
    "/matriculas/:id/transferencia-preview",
    {
      ...acessoAdmin,
      schema: {
        tags: ["Matrículas"],
        summary: "Simular transferência interna de curso ou polo/campus",
        security: [{bearerAuth: []}],
        params: enrollmentIdParamsSchema,
        querystring: transferPreviewQuerySchema,
        response: {
          200: transferPreviewResponseSchema,
          400: errorResponseSchema,
          401: errorResponseSchema,
          403: errorResponseSchema,
          404: errorResponseSchema,
          409: errorResponseSchema,
        },
      },
    },
    previewInternalTransferHandler,
  );

  typedApp.post(
    "/matriculas/:id/transferencia",
    {
      ...acessoAdmin,
      schema: {
        tags: ["Matrículas"],
        summary: "Efetivar transferência interna de curso ou polo/campus",
        security: [{bearerAuth: []}],
        params: enrollmentIdParamsSchema,
        body: transferEnrollmentSchema,
        response: {
          200: transferEnrollmentResponseSchema,
          400: errorResponseSchema,
          401: errorResponseSchema,
          403: errorResponseSchema,
          404: errorResponseSchema,
          409: errorResponseSchema,
        },
      },
    },
    executeInternalTransferHandler,
  );
};
