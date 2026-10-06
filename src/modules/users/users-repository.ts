import {Prisma} from "../../generated/prisma/client.js";
import {Role} from "../../generated/prisma/enums.js";
import {prisma} from "../../lib/db.js";
import type {
  ICreateProfessorInput,
  IListUsersQuery,
  IUpdateProfessorInput,
  IUpdateUserPersist,
} from "./users-schemas.js";

const isKnownRequestError = (error: unknown): error is Prisma.PrismaClientKnownRequestError => {
  return error instanceof Prisma.PrismaClientKnownRequestError;
};

const runOrNull = async <T>(operation: () => Promise<T>) => {
  try {
    return await operation();
  } catch (error) {
    if (isKnownRequestError(error) && error.code === "P2025") {
      return null;
    }

    throw error;
  }
};

const userSelect = {
  id: true,
  nome: true,
  email: true,
  cpf: true,
  telefone: true,
  avatarUrl: true,
  role: true,
  ativo: true,
} as const;

const professorSelect = {
  id: true,
  matricula: true,
  titulacao: true,
  departamento: true,
  user: {select: userSelect},
} as const;

const alunoSelect = {
  id: true,
  ra: true,
  dataNascimento: true,
  responsavelId: true,
  user: {select: userSelect},
} as const;

const responsavelSelect = {
  id: true,
  parentesco: true,
  user: {select: userSelect},
} as const;

export const listUsers = async ({role}: IListUsersQuery) => {
  return prisma.user.findMany({
    where: role ? {role} : undefined,
    select: userSelect,
    orderBy: {nome: "asc"},
  });
};

export const findUserById = async (id: string) => {
  return prisma.user.findUnique({
    where: {id},
    select: {
      ...userSelect,
      professor: {select: {id: true}},
    },
  });
};

export const findUserByCpfOrEmail = async ({cpf, email}: {cpf: string; email: string}) => {
  return prisma.user.findFirst({
    where: {OR: [{cpf}, {email}]},
    select: {id: true},
  });
};

export const findConflictingUser = async ({
  cpf,
  email,
  excludeId,
}: {
  cpf?: string;
  email?: string;
  excludeId: string;
}) => {
  const or = [...(cpf ? [{cpf}] : []), ...(email ? [{email}] : [])];

  if (or.length === 0) {
    return null;
  }

  return prisma.user.findFirst({
    where: {id: {not: excludeId}, OR: or},
    select: {id: true},
  });
};

export const insertAdminUser = async ({
  nome,
  email,
  cpf,
  telefone,
  senhaHash,
}: {
  nome: string;
  email: string;
  cpf: string;
  telefone?: string;
  senhaHash: string;
}) => {
  return prisma.user.create({
    data: {
      nome,
      email,
      cpf,
      telefone,
      senhaHash,
      role: Role.ADMIN,
    },
    select: userSelect,
  });
};

export const updateUserById = async ({id, data}: {id: string; data: IUpdateUserPersist}) => {
  return runOrNull(() => prisma.user.update({where: {id}, data, select: userSelect}));
};

export const countTurmasByProfessorUser = async (userId: string) => {
  return prisma.turma.count({
    where: {professor: {userId}},
  });
};

export const deleteUserById = async (id: string) => {
  return runOrNull(() => prisma.user.delete({where: {id}, select: {id: true}}));
};

export const listProfessores = async () => {
  return prisma.professor.findMany({
    select: professorSelect,
    orderBy: {matricula: "asc"},
  });
};

export const findProfessorById = async (id: string) => {
  return prisma.professor.findUnique({
    where: {id},
    select: professorSelect,
  });
};

export const insertProfessor = async ({
  nome,
  email,
  cpf,
  telefone,
  senhaHash,
  matricula,
  titulacao,
  departamento,
}: Omit<ICreateProfessorInput, "senha"> & {senhaHash: string}) => {
  return prisma.$transaction(async (tx) => {
    const user = await tx.user.create({
      data: {
        nome,
        email,
        cpf,
        telefone,
        senhaHash,
        role: Role.PROFESSOR,
      },
      select: {id: true},
    });

    return tx.professor.create({
      data: {
        userId: user.id,
        matricula,
        titulacao,
        departamento,
      },
      select: professorSelect,
    });
  });
};

export const updateProfessorById = async ({id, data}: {id: string; data: IUpdateProfessorInput}) => {
  const professor = await prisma.professor.findUnique({
    where: {id},
    select: {id: true, userId: true},
  });

  if (!professor) {
    return null;
  }

  const {nome, telefone, ativo, titulacao, departamento} = data;

  return prisma.$transaction(async (tx) => {
    if (nome !== undefined || telefone !== undefined || ativo !== undefined) {
      await tx.user.update({
        where: {id: professor.userId},
        data: {
          ...(nome !== undefined ? {nome} : {}),
          ...(telefone !== undefined ? {telefone} : {}),
          ...(ativo !== undefined ? {ativo} : {}),
        },
      });
    }

    return tx.professor.update({
      where: {id},
      data: {
        ...(titulacao !== undefined ? {titulacao} : {}),
        ...(departamento !== undefined ? {departamento} : {}),
      },
      select: professorSelect,
    });
  });
};

export const listAlunos = async () => {
  return prisma.aluno.findMany({
    select: alunoSelect,
    orderBy: {ra: "asc"},
  });
};

export const findAlunoById = async (id: string) => {
  return prisma.aluno.findUnique({
    where: {id},
    select: alunoSelect,
  });
};

export const listResponsaveis = async () => {
  return prisma.responsavel.findMany({
    select: responsavelSelect,
    orderBy: {user: {nome: "asc"}},
  });
};

export const findResponsavelById = async (id: string) => {
  return prisma.responsavel.findUnique({
    where: {id},
    select: responsavelSelect,
  });
};
