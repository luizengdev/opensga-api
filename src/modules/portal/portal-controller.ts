import {FastifyReply, FastifyRequest} from "fastify";

import type {ICreatePortalReclamacaoInput, IPortalContextoQuery} from "./portal-schemas.js";
import {createPortalReclamacao, fetchPortalContexto, PortalError} from "./portal-service.js";

const replyWithPortalError = (error: unknown, reply: FastifyReply, fallback: string) => {
  if (error instanceof PortalError) {
    return reply.status(error.statusCode).send({error: error.message});
  }

  const message = error instanceof Error ? error.message : fallback;
  return reply.status(400).send({error: message});
};

export const getPortalContextoHandler = async (
  request: FastifyRequest<{Querystring: IPortalContextoQuery}>,
  reply: FastifyReply,
) => {
  try {
    const contexto = await fetchPortalContexto({
      actorUserId: request.user.sub,
      query: request.query,
    });
    return reply.status(200).send(contexto);
  } catch (error) {
    return replyWithPortalError(error, reply, "Erro ao carregar o portal do aluno.");
  }
};

export const createPortalReclamacaoHandler = async (
  request: FastifyRequest<{Body: ICreatePortalReclamacaoInput}>,
  reply: FastifyReply,
) => {
  try {
    const reclamacao = await createPortalReclamacao({
      actorUserId: request.user.sub,
      data: request.body,
    });
    return reply.status(201).send(reclamacao);
  } catch (error) {
    return replyWithPortalError(error, reply, "Erro ao registrar o protocolo.");
  }
};
