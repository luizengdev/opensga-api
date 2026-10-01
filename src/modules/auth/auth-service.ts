import bcrypt from "bcrypt";

import {findUserById, findUserByIdentifier} from "./auth-repository.js";
import type {ILoginInput} from "./auth-schemas.js";

export const authenticateUser = async ({identificador, senha}: ILoginInput) => {
  const user = await findUserByIdentifier({identificador});

  if (!user) {
    throw new Error("Credenciais inválidas. Verifique os dados informados.");
  }

  if (!user.ativo) {
    throw new Error("Conta inativa ou bloqueada. Contate o suporte acadêmico.");
  }

  const isPasswordValid = await bcrypt.compare(senha, user.senhaHash);

  if (!isPasswordValid) {
    throw new Error("Credenciais inválidas. Verifique os dados informados.");
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
    throw new Error("Usuário não encontrado.");
  }

  return profile;
};
