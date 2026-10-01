import {FastifyInstance} from "fastify";
import {ZodTypeProvider} from "fastify-type-provider-zod";

import {Role} from "../../generated/prisma/enums.js";
import {
  addComponenteHandler,
  auditMatrizHandler,
  createMatrizHandler,
  createTurmaHandler,
  listTurmasHandler,
} from "./academic-controller.js";
import {
  addComponenteMatrizSchema,
  auditoriaMecResponseSchema,
  componenteResponseSchema,
  createMatrizSchema,
  createTurmaSchema,
  errorResponseSchema,
  listTurmasQuerySchema,
  matrizIdParamsSchema,
  matrizResponseSchema,
  turmaListResponseSchema,
  turmaResponseSchema,
} from "./academic-schemas.js";

export const academicRoutes = async (app: FastifyInstance): Promise<void> => {
  const typedApp = app.withTypeProvider<ZodTypeProvider>();
  const acessoAdmin = {
    onRequest: [app.authenticate],
    preHandler: [app.authorize([Role.ADMIN])],
  };

  typedApp.post(
    "/academic/matrizes",
    {
      ...acessoAdmin,
      schema: {
        tags: ["Acadêmico - Matrizes"],
        summary: "Criar versão de matriz curricular",
        security: [{bearerAuth: []}],
        body: createMatrizSchema,
        response: {
          201: matrizResponseSchema,
          400: errorResponseSchema,
          401: errorResponseSchema,
          403: errorResponseSchema,
        },
      },
    },
    createMatrizHandler,
  );

  typedApp.post(
    "/academic/matrizes/componentes",
    {
      ...acessoAdmin,
      schema: {
        tags: ["Acadêmico - Matrizes"],
        summary: "Adicionar componente curricular com distribuição de CH",
        security: [{bearerAuth: []}],
        body: addComponenteMatrizSchema,
        response: {
          201: componenteResponseSchema,
          400: errorResponseSchema,
          401: errorResponseSchema,
          403: errorResponseSchema,
        },
      },
    },
    addComponenteHandler,
  );

  typedApp.get(
    "/academic/matrizes/:id/auditoria-mec",
    {
      ...acessoAdmin,
      schema: {
        tags: ["Acadêmico - Regulatório"],
        summary: "Auditar extensão curricular e percentual presencial e síncrono do campus",
        security: [{bearerAuth: []}],
        params: matrizIdParamsSchema,
        response: {
          200: auditoriaMecResponseSchema,
          400: errorResponseSchema,
          401: errorResponseSchema,
          403: errorResponseSchema,
          404: errorResponseSchema,
        },
      },
    },
    auditMatrizHandler,
  );

  typedApp.post(
    "/academic/turmas",
    {
      ...acessoAdmin,
      schema: {
        tags: ["Acadêmico - Turmas"],
        summary: "Ofertar turma de disciplina global no semestre",
        security: [{bearerAuth: []}],
        body: createTurmaSchema,
        response: {
          201: turmaResponseSchema,
          400: errorResponseSchema,
          401: errorResponseSchema,
          403: errorResponseSchema,
        },
      },
    },
    createTurmaHandler,
  );

  typedApp.get(
    "/academic/turmas",
    {
      ...acessoAdmin,
      schema: {
        tags: ["Acadêmico - Turmas"],
        summary: "Listar turmas por campus e período letivo",
        security: [{bearerAuth: []}],
        querystring: listTurmasQuerySchema,
        response: {
          200: turmaListResponseSchema,
          401: errorResponseSchema,
          403: errorResponseSchema,
        },
      },
    },
    listTurmasHandler,
  );
};
