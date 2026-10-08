import {FastifyReply, FastifyRequest} from "fastify";

import type {
  ICreateTermoIndividualInput,
  ICreateTermoTurmaInput,
  IListTermosDiariosQuery,
  IListTermosQuery,
  IListTermosTurmasQuery,
} from "./termos-schemas.js";
import {
  aprovarTermo,
  createTermoIndividual,
  createTermosTurma,
  fetchDiariosParaTermo,
  fetchTermos,
  fetchTurmasParaTermo,
  recusarTermo,
  TermosError,
} from "./termos-service.js";

const replyWithTermosError = (error: unknown, reply: FastifyReply, fallback: string) => {
  if (error instanceof TermosError) {
    return reply.status(error.statusCode).send({error: error.message});
  }

  const message = error instanceof Error ? error.message : fallback;
  return reply.status(400).send({error: message});
};

export const listTermosHandler = async (
  request: FastifyRequest<{Querystring: IListTermosQuery}>,
  reply: FastifyReply,
) => {
  try {
    const termos = await fetchTermos({
      actorRole: request.user.role,
      actorUserId: request.user.sub,
      query: request.query,
    });
    return reply.status(200).send(termos);
  } catch (error) {
    return replyWithTermosError(error, reply, "Erro ao listar solicitações de termo.");
  }
};

export const listTermosTurmasHandler = async (
  request: FastifyRequest<{Querystring: IListTermosTurmasQuery}>,
  reply: FastifyReply,
) => {
  try {
    const turmas = await fetchTurmasParaTermo({
      actorUserId: request.user.sub,
      ...request.query,
    });
    return reply.status(200).send(turmas);
  } catch (error) {
    return replyWithTermosError(error, reply, "Erro ao listar turmas para termo de abertura.");
  }
};

export const listTermosDiariosHandler = async (
  request: FastifyRequest<{Querystring: IListTermosDiariosQuery}>,
  reply: FastifyReply,
) => {
  try {
    const diarios = await fetchDiariosParaTermo({
      actorUserId: request.user.sub,
      q: request.query.q,
    });
    return reply.status(200).send(diarios);
  } catch (error) {
    return replyWithTermosError(error, reply, "Erro ao buscar diários para termo individual.");
  }
};

export const createTermosTurmaHandler = async (
  request: FastifyRequest<{Body: ICreateTermoTurmaInput}>,
  reply: FastifyReply,
) => {
  try {
    const termos = await createTermosTurma({
      actorUserId: request.user.sub,
      turmaIds: request.body.turmaIds,
    });
    return reply.status(201).send(termos);
  } catch (error) {
    return replyWithTermosError(error, reply, "Erro ao solicitar abertura de turma.");
  }
};

export const createTermoIndividualHandler = async (
  request: FastifyRequest<{Body: ICreateTermoIndividualInput}>,
  reply: FastifyReply,
) => {
  try {
    const termo = await createTermoIndividual({
      actorUserId: request.user.sub,
      ...request.body,
    });
    return reply.status(201).send(termo);
  } catch (error) {
    return replyWithTermosError(error, reply, "Erro ao solicitar alteração individual.");
  }
};

export const aprovarTermoHandler = async (request: FastifyRequest<{Params: {id: string}}>, reply: FastifyReply) => {
  try {
    const termo = await aprovarTermo({id: request.params.id, actorUserId: request.user.sub});
    return reply.status(200).send(termo);
  } catch (error) {
    return replyWithTermosError(error, reply, "Erro ao aprovar o termo de abertura.");
  }
};

export const recusarTermoHandler = async (request: FastifyRequest<{Params: {id: string}}>, reply: FastifyReply) => {
  try {
    const termo = await recusarTermo({id: request.params.id, actorUserId: request.user.sub});
    return reply.status(200).send(termo);
  } catch (error) {
    return replyWithTermosError(error, reply, "Erro ao recusar o termo de abertura.");
  }
};
