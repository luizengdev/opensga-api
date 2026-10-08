import {FastifyReply, FastifyRequest} from "fastify";

import type {IUpdateParametrizacoesInput} from "./settings-schemas.js";
import {changeParametrizacoes, fetchParametrizacoes, SettingsError} from "./settings-service.js";

const replyWithSettingsError = (error: unknown, reply: FastifyReply, fallback: string) => {
  if (error instanceof SettingsError) {
    return reply.status(error.statusCode).send({error: error.message});
  }

  const message = error instanceof Error ? error.message : fallback;
  return reply.status(400).send({error: message});
};

export const getParametrizacoesHandler = async (_request: FastifyRequest, reply: FastifyReply) => {
  try {
    const parametros = await fetchParametrizacoes();
    return reply.status(200).send(parametros);
  } catch (error) {
    return replyWithSettingsError(error, reply, "Erro ao carregar as parametrizações institucionais.");
  }
};

export const updateParametrizacoesHandler = async (
  request: FastifyRequest<{Body: IUpdateParametrizacoesInput}>,
  reply: FastifyReply,
) => {
  try {
    const parametros = await changeParametrizacoes(request.body);
    return reply.status(200).send(parametros);
  } catch (error) {
    return replyWithSettingsError(error, reply, "Erro ao atualizar as parametrizações institucionais.");
  }
};
