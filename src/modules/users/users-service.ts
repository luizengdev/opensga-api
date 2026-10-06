import bcrypt from "bcrypt";

import {Role} from "../../generated/prisma/enums.js";
import {dayjs} from "../../lib/dayjs.js";
import {
  countTurmasByProfessorUser,
  deleteUserById,
  findAlunoById,
  findProfessorById,
  findResponsavelById,
  findConflictingUser,
  findUserByCpfOrEmail,
  findUserById,
  insertAdminUser,
  insertProfessor,
  listAlunos,
  listProfessores,
  listResponsaveis,
  listUsers,
  updateProfessorById,
  updateUserById,
} from "./users-repository.js";
import type {
  ICreateAdminInput,
  ICreateProfessorInput,
  IListUsersQuery,
  IUpdateProfessorInput,
  IUpdateUserInput,
} from "./users-schemas.js";

export class UsersError extends Error {
  readonly statusCode: 400 | 404 | 409;

  constructor(message: string, statusCode: 400 | 404 | 409) {
    super(message);
    this.name = "UsersError";
    this.statusCode = statusCode;
  }
}

const mapAluno = (aluno: {id: string; ra: string; dataNascimento: Date; responsavelId: string | null; user: unknown}) => {
  return {
    id: aluno.id,
    ra: aluno.ra,
    dataNascimento: dayjs(aluno.dataNascimento).toISOString(),
    responsavelId: aluno.responsavelId,
    user: aluno.user,
  };
};

export const fetchUsers = async (query: IListUsersQuery) => {
  return listUsers(query);
};

export const fetchUserById = async (id: string) => {
  const user = await findUserById(id);

  if (!user) {
    throw new UsersError("Usuário não encontrado.", 404);
  }

  return {
    id: user.id,
    nome: user.nome,
    email: user.email,
    cpf: user.cpf,
    telefone: user.telefone,
    avatarUrl: user.avatarUrl,
    role: user.role,
    ativo: user.ativo,
  };
};

export const createNewAdmin = async (input: ICreateAdminInput) => {
  const existing = await findUserByCpfOrEmail({cpf: input.cpf, email: input.email});

  if (existing) {
    throw new UsersError("CPF ou e-mail já cadastrado na instituição.", 400);
  }

  const senhaHash = await bcrypt.hash(input.senha, 10);

  return insertAdminUser({
    nome: input.nome,
    email: input.email,
    cpf: input.cpf,
    telefone: input.telefone,
    senhaHash,
  });
};

export const changeUser = async ({id, data}: {id: string; data: IUpdateUserInput}) => {
  const current = await findUserById(id);

  if (!current) {
    throw new UsersError("Usuário não encontrado.", 404);
  }

  const {senha, ...fields} = data;

  if (fields.email !== undefined || fields.cpf !== undefined) {
    const conflict = await findConflictingUser({
      cpf: fields.cpf,
      email: fields.email,
      excludeId: id,
    });

    if (conflict) {
      throw new UsersError("CPF ou e-mail já cadastrado na instituição.", 400);
    }
  }

  const senhaHash = senha ? await bcrypt.hash(senha, 10) : undefined;
  const user = await updateUserById({
    id,
    data: {
      ...fields,
      ...(senhaHash ? {senhaHash} : {}),
    },
  });

  if (!user) {
    throw new UsersError("Usuário não encontrado.", 404);
  }

  return user;
};

export const removeUser = async ({id, actorUserId}: {id: string; actorUserId: string}) => {
  if (id === actorUserId) {
    throw new UsersError("Não é permitido excluir o próprio usuário autenticado.", 400);
  }

  const user = await findUserById(id);

  if (!user) {
    throw new UsersError("Usuário não encontrado.", 404);
  }

  if (user.role === Role.PROFESSOR) {
    const turmas = await countTurmasByProfessorUser(id);

    if (turmas > 0) {
      throw new UsersError("Não é possível excluir o professor enquanto houver turmas sob sua regência.", 409);
    }
  }

  const deleted = await deleteUserById(id);

  if (!deleted) {
    throw new UsersError("Usuário não encontrado.", 404);
  }

  return deleted;
};

export const fetchProfessores = async () => {
  return listProfessores();
};

export const fetchProfessorById = async (id: string) => {
  const professor = await findProfessorById(id);

  if (!professor) {
    throw new UsersError("Professor não encontrado.", 404);
  }

  return professor;
};

export const createNewProfessor = async (input: ICreateProfessorInput) => {
  const existing = await findUserByCpfOrEmail({cpf: input.cpf, email: input.email});

  if (existing) {
    throw new UsersError("CPF ou e-mail já cadastrado na instituição.", 400);
  }

  const {senha, ...profile} = input;
  const senhaHash = await bcrypt.hash(senha, 10);

  return insertProfessor({...profile, senhaHash});
};

export const changeProfessor = async ({id, data}: {id: string; data: IUpdateProfessorInput}) => {
  const professor = await updateProfessorById({id, data});

  if (!professor) {
    throw new UsersError("Professor não encontrado.", 404);
  }

  return professor;
};

export const fetchAlunos = async () => {
  const alunos = await listAlunos();
  return alunos.map(mapAluno);
};

export const fetchAlunoById = async (id: string) => {
  const aluno = await findAlunoById(id);

  if (!aluno) {
    throw new UsersError("Aluno não encontrado.", 404);
  }

  return mapAluno(aluno);
};

export const fetchResponsaveis = async () => {
  return listResponsaveis();
};

export const fetchResponsavelById = async (id: string) => {
  const responsavel = await findResponsavelById(id);

  if (!responsavel) {
    throw new UsersError("Responsável não encontrado.", 404);
  }

  return responsavel;
};
