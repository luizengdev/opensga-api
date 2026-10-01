import {FastifyInstance} from "fastify";
import {ZodTypeProvider} from "fastify-type-provider-zod";

import {Role} from "../../generated/prisma/client.js";
import {getMeHandler, loginHandler} from "./auth-controller.js";
import {
  errorResponseSchema,
  loginResponseSchema,
  loginSchema,
  meResponseSchema,
  messageResponseSchema,
} from "./auth-schemas.js";

export const authRoutes = async (app: FastifyInstance): Promise<void> => {
  const typedApp = app.withTypeProvider<ZodTypeProvider>();

  // Rota Pública: Login Unificado (Admin, Professor, Aluno por CPF/Email/RA)
  typedApp.post(
    "/auth/login",
    {
      schema: {
        tags: ["Autenticação"],
        summary: "Realizar login unificado e obter JWT",
        body: loginSchema,
        response: {
          200: loginResponseSchema,
          401: errorResponseSchema,
        },
      },
    },
    loginHandler,
  );

  // Rota Protegida: Obter dados do usuário logado
  typedApp.get(
    "/auth/me",
    {
      onRequest: [app.authenticate],
      schema: {
        tags: ["Autenticação"],
        summary: "Obter dados cadastrais e permissões do usuário logado",
        security: [{bearerAuth: []}],
        response: {
          200: meResponseSchema,
          401: errorResponseSchema,
          404: errorResponseSchema,
        },
      },
    },
    getMeHandler,
  );

  // Rota Exclusiva de Teste para o Admin
  typedApp.get(
    "/auth/admin-only",
    {
      onRequest: [app.authenticate],
      preHandler: [app.authorize([Role.ADMIN])],
      schema: {
        tags: ["Autenticação"],
        summary: "Rota de teste restrita a Administradores",
        security: [{bearerAuth: []}],
        response: {
          200: messageResponseSchema,
          401: errorResponseSchema,
          403: errorResponseSchema,
        },
      },
    },
    async (_request, reply) => {
      return reply.send({message: "Acesso de Administrador confirmado com sucesso!"});
    },
  );
};
