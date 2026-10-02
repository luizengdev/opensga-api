import bcrypt from "bcrypt";

import {
  findUserById,
  findUserByIdentifier,
  findUserPasswordHash,
  updateUserPasswordHash,
} from "./auth-repository.js";
import type {IChangePasswordInput, ILoginInput} from "./auth-schemas.js";

export class AuthError extends Error {
  readonly statusCode: 400 | 401 | 404;

  constructor(message: string, statusCode: 400 | 401 | 404) {
    super(message);
    this.name = "AuthError";
    this.statusCode = statusCode;
  }
}

export const authenticateUser = async ({identificador, senha}: ILoginInput) => {
  const user = await findUserByIdentifier({identificador});

  if (!user) {
    throw new AuthError("Credenciais inválidas. Verifique os dados informados.", 401);
  }

  if (!user.ativo) {
    throw new AuthError("Conta inativa ou bloqueada. Contate o suporte acadêmico.", 401);
  }

  const isPasswordValid = await bcrypt.compare(senha, user.senhaHash);

  if (!isPasswordValid) {
    throw new AuthError("Credenciais inválidas. Verifique os dados informados.", 401);
  }

  return {
    id: user.id,
    nome: user.nome,
    email: user.email,
    cpf: user.cpf,
    role: user.role,
    avatarUrl: user.avatarUrl,
  };
};

export const fetchUserProfile = async ({userId}: {userId: string}) => {
  const profile = await findUserById({id: userId});

  if (!profile) {
    throw new AuthError("Usuário não encontrado.", 404);
  }

  return profile;
};

export const changeOwnPassword = async ({
  userId,
  senhaAtual,
  senhaNova,
}: IChangePasswordInput & {userId: string}) => {
  const user = await findUserPasswordHash({id: userId});

  if (!user) {
    throw new AuthError("Usuário não encontrado.", 404);
  }

  const isCurrentValid = await bcrypt.compare(senhaAtual, user.senhaHash);

  if (!isCurrentValid) {
    throw new AuthError("A senha atual está incorreta.", 400);
  }

  const senhaHash = await bcrypt.hash(senhaNova, 10);
  await updateUserPasswordHash({id: userId, senhaHash});
};
