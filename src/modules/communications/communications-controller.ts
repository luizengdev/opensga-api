import {FastifyReply, FastifyRequest} from "fastify";

import type {
  ICreateComunicadoInput,
  ICreateReclamacaoInput,
  IListComunicadosQuery,
  IListReclamacoesQuery,
  IResponderReclamacaoInput,
  IUpdateComunicadoInput,
} from "./communications-schemas.js";
import {
  changeComunicado,
  closeReclamacao,
  CommunicationsError,
  createNewComunicado,
  createNewReclamacao,
  fetchComunicadoById,
  fetchComunicados,
  fetchReclamacaoById,
  fetchReclamacoes,
  removeComunicado,
  removeReclamacao,
  respondToReclamacao,
} from "./communications-service.js";

const replyWithCommunicationsError = (error: unknown, reply: FastifyReply, fallback: string) => {
  if (error instanceof CommunicationsError) {
    return reply.status(error.statusCode).send({error: error.message});
  }

  const message = error instanceof Error ? error.message : fallback;
  return reply.status(400).send({error: message});
};

export const listComunicadosHandler = async (
  request: FastifyRequest<{Querystring: IListComunicadosQuery}>,
  reply: FastifyReply,
) => {
  const comunicados = await fetchComunicados(request.query);
  return reply.status(200).send(comunicados);
};

export const getComunicadoHandler = async (request: FastifyRequest<{Params: {id: string}}>, reply: FastifyReply) => {
  try {
    const comunicado = await fetchComunicadoById(request.params.id);
    return reply.status(200).send(comunicado);
  } catch (error) {
    return replyWithCommunicationsError(error, reply, "Erro ao buscar comunicado.");
  }
};

export const createComunicadoHandler = async (
  request: FastifyRequest<{Body: ICreateComunicadoInput}>,
  reply: FastifyReply,
) => {
  try {
    const comunicado = await createNewComunicado(request.body);
    return reply.status(201).send(comunicado);
  } catch (error) {
    return replyWithCommunicationsError(error, reply, "Erro ao criar comunicado.");
  }
};

export const updateComunicadoHandler = async (
  request: FastifyRequest<{Params: {id: string}; Body: IUpdateComunicadoInput}>,
  reply: FastifyReply,
) => {
  try {
    const comunicado = await changeComunicado({id: request.params.id, data: request.body});
    return reply.status(200).send(comunicado);
  } catch (error) {
    return replyWithCommunicationsError(error, reply, "Erro ao atualizar comunicado.");
  }
};

export const deleteComunicadoHandler = async (request: FastifyRequest<{Params: {id: string}}>, reply: FastifyReply) => {
  try {
    const comunicado = await removeComunicado(request.params.id);
    return reply.status(200).send(comunicado);
  } catch (error) {
    return replyWithCommunicationsError(error, reply, "Erro ao excluir comunicado.");
  }
};

export const listReclamacoesHandler = async (
  request: FastifyRequest<{Querystring: IListReclamacoesQuery}>,
  reply: FastifyReply,
) => {
  const reclamacoes = await fetchReclamacoes(request.query);
  return reply.status(200).send(reclamacoes);
};

export const getReclamacaoHandler = async (request: FastifyRequest<{Params: {id: string}}>, reply: FastifyReply) => {
  try {
    const reclamacao = await fetchReclamacaoById(request.params.id);
    return reply.status(200).send(reclamacao);
  } catch (error) {
    return replyWithCommunicationsError(error, reply, "Erro ao buscar reclamação.");
  }
};

export const createReclamacaoHandler = async (
  request: FastifyRequest<{Body: ICreateReclamacaoInput}>,
  reply: FastifyReply,
) => {
  try {
    const reclamacao = await createNewReclamacao(request.body);
    return reply.status(201).send(reclamacao);
  } catch (error) {
    return replyWithCommunicationsError(error, reply, "Erro ao criar reclamação.");
  }
};

export const respondReclamacaoHandler = async (
  request: FastifyRequest<{Params: {id: string}; Body: IResponderReclamacaoInput}>,
  reply: FastifyReply,
) => {
  try {
    const reclamacao = await respondToReclamacao({id: request.params.id, data: request.body});
    return reply.status(200).send(reclamacao);
  } catch (error) {
    return replyWithCommunicationsError(error, reply, "Erro ao responder reclamação.");
  }
};

export const closeReclamacaoHandler = async (request: FastifyRequest<{Params: {id: string}}>, reply: FastifyReply) => {
  try {
    const reclamacao = await closeReclamacao(request.params.id);
    return reply.status(200).send(reclamacao);
  } catch (error) {
    return replyWithCommunicationsError(error, reply, "Erro ao fechar reclamação.");
  }
};

export const deleteReclamacaoHandler = async (request: FastifyRequest<{Params: {id: string}}>, reply: FastifyReply) => {
  try {
    const reclamacao = await removeReclamacao(request.params.id);
    return reply.status(200).send(reclamacao);
  } catch (error) {
    return replyWithCommunicationsError(error, reply, "Erro ao excluir reclamação.");
  }
};
