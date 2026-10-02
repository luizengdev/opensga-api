import {FastifyInstance} from "fastify";
import {ZodTypeProvider} from "fastify-type-provider-zod";

import {Role} from "../../generated/prisma/enums.js";
import {
  createAdminHandler,
  createProfessorHandler,
  deleteUserHandler,
  getAlunoHandler,
  getProfessorHandler,
  getResponsavelHandler,
  getUserHandler,
  listAlunosHandler,
  listProfessoresHandler,
  listResponsaveisHandler,
  listUsersHandler,
  updateProfessorHandler,
  updateUserHandler,
} from "./users-controller.js";
import {
  alunoListResponseSchema,
  alunoResponseSchema,
  createAdminSchema,
  createProfessorSchema,
  deleteResponseSchema,
  errorResponseSchema,
  idParamsSchema,
  listUsersQuerySchema,
  professorListResponseSchema,
  professorResponseSchema,
  responsavelListResponseSchema,
  responsavelResponseSchema,
  updateProfessorSchema,
  updateUserSchema,
  userListResponseSchema,
  userResponseSchema,
} from "./users-schemas.js";

export const usersRoutes = async (app: FastifyInstance): Promise<void> => {
  const typedApp = app.withTypeProvider<ZodTypeProvider>();
  const acessoAdmin = {
    onRequest: [app.authenticate],
    preHandler: [app.authorize([Role.ADMIN])],
  };

  typedApp.get(
    "/users",
    {
      ...acessoAdmin,
      schema: {
        tags: ["Usuários"],
        summary: "Listar usuários, com filtro opcional por perfil",
        security: [{bearerAuth: []}],
        querystring: listUsersQuerySchema,
        response: {
          200: userListResponseSchema,
          401: errorResponseSchema,
          403: errorResponseSchema,
        },
      },
    },
    listUsersHandler,
  );

  typedApp.post(
    "/users/admins",
    {
      ...acessoAdmin,
      schema: {
        tags: ["Usuários"],
        summary: "Cadastrar administrador",
        security: [{bearerAuth: []}],
        body: createAdminSchema,
        response: {
          201: userResponseSchema,
          400: errorResponseSchema,
          401: errorResponseSchema,
          403: errorResponseSchema,
        },
      },
    },
    createAdminHandler,
  );

  typedApp.get(
    "/users/professores",
    {
      ...acessoAdmin,
      schema: {
        tags: ["Usuários - Professores"],
        summary: "Listar professores",
        security: [{bearerAuth: []}],
        response: {
          200: professorListResponseSchema,
          401: errorResponseSchema,
          403: errorResponseSchema,
        },
      },
    },
    listProfessoresHandler,
  );

  typedApp.post(
    "/users/professores",
    {
      ...acessoAdmin,
      schema: {
        tags: ["Usuários - Professores"],
        summary: "Cadastrar professor com credenciais de acesso",
        security: [{bearerAuth: []}],
        body: createProfessorSchema,
        response: {
          201: professorResponseSchema,
          400: errorResponseSchema,
          401: errorResponseSchema,
          403: errorResponseSchema,
        },
      },
    },
    createProfessorHandler,
  );

  typedApp.get(
    "/users/professores/:id",
    {
      ...acessoAdmin,
      schema: {
        tags: ["Usuários - Professores"],
        summary: "Buscar professor por id",
        security: [{bearerAuth: []}],
        params: idParamsSchema,
        response: {
          200: professorResponseSchema,
          401: errorResponseSchema,
          403: errorResponseSchema,
          404: errorResponseSchema,
        },
      },
    },
    getProfessorHandler,
  );

  typedApp.patch(
    "/users/professores/:id",
    {
      ...acessoAdmin,
      schema: {
        tags: ["Usuários - Professores"],
        summary: "Atualizar dados do professor",
        security: [{bearerAuth: []}],
        params: idParamsSchema,
        body: updateProfessorSchema,
        response: {
          200: professorResponseSchema,
          400: errorResponseSchema,
          401: errorResponseSchema,
          403: errorResponseSchema,
          404: errorResponseSchema,
        },
      },
    },
    updateProfessorHandler,
  );

  typedApp.get(
    "/users/alunos",
    {
      ...acessoAdmin,
      schema: {
        tags: ["Usuários - Alunos"],
        summary: "Listar alunos",
        security: [{bearerAuth: []}],
        response: {
          200: alunoListResponseSchema,
          401: errorResponseSchema,
          403: errorResponseSchema,
        },
      },
    },
    listAlunosHandler,
  );

  typedApp.get(
    "/users/alunos/:id",
    {
      ...acessoAdmin,
      schema: {
        tags: ["Usuários - Alunos"],
        summary: "Buscar aluno por id",
        security: [{bearerAuth: []}],
        params: idParamsSchema,
        response: {
          200: alunoResponseSchema,
          401: errorResponseSchema,
          403: errorResponseSchema,
          404: errorResponseSchema,
        },
      },
    },
    getAlunoHandler,
  );

  typedApp.get(
    "/users/responsaveis",
    {
      ...acessoAdmin,
      schema: {
        tags: ["Usuários - Responsáveis"],
        summary: "Listar responsáveis",
        security: [{bearerAuth: []}],
        response: {
          200: responsavelListResponseSchema,
          401: errorResponseSchema,
          403: errorResponseSchema,
        },
      },
    },
    listResponsaveisHandler,
  );

  typedApp.get(
    "/users/responsaveis/:id",
    {
      ...acessoAdmin,
      schema: {
        tags: ["Usuários - Responsáveis"],
        summary: "Buscar responsável por id",
        security: [{bearerAuth: []}],
        params: idParamsSchema,
        response: {
          200: responsavelResponseSchema,
          401: errorResponseSchema,
          403: errorResponseSchema,
          404: errorResponseSchema,
        },
      },
    },
    getResponsavelHandler,
  );

  typedApp.get(
    "/users/:id",
    {
      ...acessoAdmin,
      schema: {
        tags: ["Usuários"],
        summary: "Buscar usuário por id",
        security: [{bearerAuth: []}],
        params: idParamsSchema,
        response: {
          200: userResponseSchema,
          401: errorResponseSchema,
          403: errorResponseSchema,
          404: errorResponseSchema,
        },
      },
    },
    getUserHandler,
  );

  typedApp.patch(
    "/users/:id",
    {
      ...acessoAdmin,
      schema: {
        tags: ["Usuários"],
        summary: "Atualizar dados cadastrais do usuário",
        security: [{bearerAuth: []}],
        params: idParamsSchema,
        body: updateUserSchema,
        response: {
          200: userResponseSchema,
          400: errorResponseSchema,
          401: errorResponseSchema,
          403: errorResponseSchema,
          404: errorResponseSchema,
        },
      },
    },
    updateUserHandler,
  );

  typedApp.delete(
    "/users/:id",
    {
      ...acessoAdmin,
      schema: {
        tags: ["Usuários"],
        summary: "Excluir usuário e perfil vinculado",
        security: [{bearerAuth: []}],
        params: idParamsSchema,
        response: {
          200: deleteResponseSchema,
          400: errorResponseSchema,
          401: errorResponseSchema,
          403: errorResponseSchema,
          404: errorResponseSchema,
          409: errorResponseSchema,
        },
      },
    },
    deleteUserHandler,
  );
};
