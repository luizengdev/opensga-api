import {FastifyInstance, FastifyPluginAsync, FastifyReply, FastifyRequest} from "fastify";
import fp from "fastify-plugin";

import {Role} from "../generated/prisma/client.js";

declare module "fastify" {
  interface FastifyInstance {
    authenticate: (request: FastifyRequest, reply: FastifyReply) => Promise<void>;
    authorize: (allowedRoles: Role[]) => (request: FastifyRequest, reply: FastifyReply) => Promise<void>;
  }
}

declare module "@fastify/jwt" {
  interface FastifyJWT {
    payload: {
      sub: string;
      role: Role;
      email: string;
    };
    user: {
      sub: string;
      role: Role;
      email: string;
    };
  }
}

const authPluginAsync: FastifyPluginAsync = async (app: FastifyInstance): Promise<void> => {
  // Hook de autenticação: valida se o token JWT existe no Header Authorization e é válido
  app.decorate("authenticate", async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
    try {
      await request.jwtVerify();
    } catch {
      return reply.status(401).send({
        error: "Não autorizado",
        message: "Token de autenticação ausente, inválido ou expirado.",
      });
    }
  });

  // Hook de autorização (RBAC): valida se o perfil do usuário logado tem permissão para a rota
  app.decorate("authorize", (allowedRoles: Role[]) => {
    return async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
      const {user} = request;

      if (!user || !allowedRoles.includes(user.role)) {
        return reply.status(403).send({
          error: "Acesso proibido",
          message: "Você não possui o nível de acesso necessário para este recurso.",
        });
      }
    };
  });
};

export const authPlugin = fp(authPluginAsync);
