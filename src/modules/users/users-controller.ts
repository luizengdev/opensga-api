import {FastifyReply, FastifyRequest} from "fastify";

import type {
  ICreateAdminInput,
  ICreateProfessorInput,
  IListUsersQuery,
  IUpdateProfessorInput,
  IUpdateUserInput,
} from "./users-schemas.js";
import {
  changeProfessor,
  changeUser,
  createNewAdmin,
  createNewProfessor,
  fetchAlunoById,
  fetchAlunos,
  fetchProfessorById,
  fetchProfessores,
  fetchResponsaveis,
  fetchResponsavelById,
  fetchUserById,
  fetchUsers,
  removeUser,
  UsersError,
} from "./users-service.js";

const replyWithUsersError = (error: unknown, reply: FastifyReply, fallback: string) => {
  if (error instanceof UsersError) {
    return reply.status(error.statusCode).send({error: error.message});
  }

  const message = error instanceof Error ? error.message : fallback;
  return reply.status(400).send({error: message});
};

export const listUsersHandler = async (request: FastifyRequest<{Querystring: IListUsersQuery}>, reply: FastifyReply) => {
  const users = await fetchUsers(request.query);
  return reply.status(200).send(users);
};

export const getUserHandler = async (request: FastifyRequest<{Params: {id: string}}>, reply: FastifyReply) => {
  try {
    const user = await fetchUserById(request.params.id);
    return reply.status(200).send(user);
  } catch (error) {
    return replyWithUsersError(error, reply, "Erro ao buscar usuário.");
  }
};

export const createAdminHandler = async (request: FastifyRequest<{Body: ICreateAdminInput}>, reply: FastifyReply) => {
  try {
    const admin = await createNewAdmin(request.body);
    return reply.status(201).send(admin);
  } catch (error) {
    return replyWithUsersError(error, reply, "Erro ao criar administrador.");
  }
};

export const updateUserHandler = async (
  request: FastifyRequest<{Params: {id: string}; Body: IUpdateUserInput}>,
  reply: FastifyReply,
) => {
  try {
    const user = await changeUser({id: request.params.id, data: request.body});
    return reply.status(200).send(user);
  } catch (error) {
    return replyWithUsersError(error, reply, "Erro ao atualizar usuário.");
  }
};

export const deleteUserHandler = async (request: FastifyRequest<{Params: {id: string}}>, reply: FastifyReply) => {
  try {
    const user = await removeUser({id: request.params.id, actorUserId: request.user.sub});
    return reply.status(200).send(user);
  } catch (error) {
    return replyWithUsersError(error, reply, "Erro ao excluir usuário.");
  }
};

export const listProfessoresHandler = async (_request: FastifyRequest, reply: FastifyReply) => {
  const professores = await fetchProfessores();
  return reply.status(200).send(professores);
};

export const getProfessorHandler = async (request: FastifyRequest<{Params: {id: string}}>, reply: FastifyReply) => {
  try {
    const professor = await fetchProfessorById(request.params.id);
    return reply.status(200).send(professor);
  } catch (error) {
    return replyWithUsersError(error, reply, "Erro ao buscar professor.");
  }
};

export const createProfessorHandler = async (
  request: FastifyRequest<{Body: ICreateProfessorInput}>,
  reply: FastifyReply,
) => {
  try {
    const professor = await createNewProfessor(request.body);
    return reply.status(201).send(professor);
  } catch (error) {
    return replyWithUsersError(error, reply, "Erro ao criar professor.");
  }
};

export const updateProfessorHandler = async (
  request: FastifyRequest<{Params: {id: string}; Body: IUpdateProfessorInput}>,
  reply: FastifyReply,
) => {
  try {
    const professor = await changeProfessor({id: request.params.id, data: request.body});
    return reply.status(200).send(professor);
  } catch (error) {
    return replyWithUsersError(error, reply, "Erro ao atualizar professor.");
  }
};

export const listAlunosHandler = async (_request: FastifyRequest, reply: FastifyReply) => {
  const alunos = await fetchAlunos();
  return reply.status(200).send(alunos);
};

export const getAlunoHandler = async (request: FastifyRequest<{Params: {id: string}}>, reply: FastifyReply) => {
  try {
    const aluno = await fetchAlunoById(request.params.id);
    return reply.status(200).send(aluno);
  } catch (error) {
    return replyWithUsersError(error, reply, "Erro ao buscar aluno.");
  }
};

export const listResponsaveisHandler = async (_request: FastifyRequest, reply: FastifyReply) => {
  const responsaveis = await fetchResponsaveis();
  return reply.status(200).send(responsaveis);
};

export const getResponsavelHandler = async (request: FastifyRequest<{Params: {id: string}}>, reply: FastifyReply) => {
  try {
    const responsavel = await fetchResponsavelById(request.params.id);
    return reply.status(200).send(responsavel);
  } catch (error) {
    return replyWithUsersError(error, reply, "Erro ao buscar responsável.");
  }
};
