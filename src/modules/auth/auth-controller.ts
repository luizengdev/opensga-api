import {FastifyReply, FastifyRequest} from "fastify";

import type {IChangePasswordInput, ILoginInput} from "./auth-schemas.js";
import {authenticateUser, AuthError, changeOwnPassword, fetchUserProfile} from "./auth-service.js";

const replyWithAuthError = (error: unknown, reply: FastifyReply, fallback: string) => {
  if (error instanceof AuthError) {
    return reply.status(error.statusCode).send({error: error.message});
  }

  const message = error instanceof Error ? error.message : fallback;
  return reply.status(400).send({error: message});
};

export const loginHandler = async (request: FastifyRequest<{Body: ILoginInput}>, reply: FastifyReply) => {
  try {
    const user = await authenticateUser(request.body);

    const token = await reply.jwtSign({
      sub: user.id,
      role: user.role,
      email: user.email,
    });

    return reply.status(200).send({
      token,
      user,
    });
  } catch (error) {
    return replyWithAuthError(error, reply, "Erro ao processar login.");
  }
};

export const getMeHandler = async (request: FastifyRequest, reply: FastifyReply) => {
  try {
    const userId = request.user.sub;
    const profile = await fetchUserProfile({userId});
    return reply.status(200).send(profile);
  } catch (error) {
    return replyWithAuthError(error, reply, "Erro ao buscar perfil.");
  }
};

export const changePasswordHandler = async (
  request: FastifyRequest<{Body: IChangePasswordInput}>,
  reply: FastifyReply,
) => {
  try {
    await changeOwnPassword({
      userId: request.user.sub,
      senhaAtual: request.body.senhaAtual,
      senhaNova: request.body.senhaNova,
    });
    return reply.status(200).send({message: "Senha atualizada com sucesso."});
  } catch (error) {
    return replyWithAuthError(error, reply, "Erro ao atualizar senha.");
  }
};
