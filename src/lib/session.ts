import {Role} from "../generated/prisma/enums.js";

export const JWT_EXPIRES_IN_ADMIN = "20m";
export const JWT_EXPIRES_IN_ALUNO = "30m";

export const jwtExpiresInForRole = (role: Role) => {
  if (role === Role.ALUNO || role === Role.RESPONSAVEL) {
    return JWT_EXPIRES_IN_ALUNO;
  }

  return JWT_EXPIRES_IN_ADMIN;
};
