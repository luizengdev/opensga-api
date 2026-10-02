import {FastifyReply, FastifyRequest} from "fastify";

import type {ICreateFaturaInput, IListFaturasQuery, IUpdateFaturaStatusInput} from "./financial-schemas.js";
import {
  changeFaturaStatus,
  createNewFatura,
  fetchFaturaById,
  fetchFaturas,
  FinancialError,
  removeFatura,
} from "./financial-service.js";

const replyWithFinancialError = (error: unknown, reply: FastifyReply, fallback: string) => {
  if (error instanceof FinancialError) {
    return reply.status(error.statusCode).send({error: error.message});
  }

  const message = error instanceof Error ? error.message : fallback;
  return reply.status(400).send({error: message});
};

export const listFaturasHandler = async (
  request: FastifyRequest<{Querystring: IListFaturasQuery}>,
  reply: FastifyReply,
) => {
  const faturas = await fetchFaturas(request.query);
  return reply.status(200).send(faturas);
};

export const getFaturaHandler = async (request: FastifyRequest<{Params: {id: string}}>, reply: FastifyReply) => {
  try {
    const fatura = await fetchFaturaById(request.params.id);
    return reply.status(200).send(fatura);
  } catch (error) {
    return replyWithFinancialError(error, reply, "Erro ao buscar fatura.");
  }
};

export const createFaturaHandler = async (request: FastifyRequest<{Body: ICreateFaturaInput}>, reply: FastifyReply) => {
  try {
    const fatura = await createNewFatura(request.body);
    return reply.status(201).send(fatura);
  } catch (error) {
    return replyWithFinancialError(error, reply, "Erro ao criar fatura.");
  }
};

export const updateFaturaStatusHandler = async (
  request: FastifyRequest<{Params: {id: string}; Body: IUpdateFaturaStatusInput}>,
  reply: FastifyReply,
) => {
  try {
    const fatura = await changeFaturaStatus({id: request.params.id, data: request.body});
    return reply.status(200).send(fatura);
  } catch (error) {
    return replyWithFinancialError(error, reply, "Erro ao atualizar status da fatura.");
  }
};

export const deleteFaturaHandler = async (request: FastifyRequest<{Params: {id: string}}>, reply: FastifyReply) => {
  try {
    const fatura = await removeFatura(request.params.id);
    return reply.status(200).send(fatura);
  } catch (error) {
    return replyWithFinancialError(error, reply, "Erro ao excluir fatura.");
  }
};
