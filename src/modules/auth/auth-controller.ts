import {FastifyReply, FastifyRequest} from "fastify";

import type {ILoginInput} from "./auth-schemas.js";
import {authenticateUser, fetchUserProfile} from "./auth-service.js";

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
    const message = error instanceof Error ? error.message : "Erro ao processar login.";
    return reply.status(401).send({error: message});
  }
};

export const getMeHandler = async (request: FastifyRequest, reply: FastifyReply) => {
  try {
    const userId = request.user.sub;
    const profile = await fetchUserProfile({userId});
    return reply.status(200).send(profile);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erro ao buscar perfil.";
    return reply.status(404).send({error: message});
  }
};
