import {prisma} from "../../lib/db.js";

export const findUserByIdentifier = async ({identificador}: {identificador: string}) => {
  return prisma.user.findFirst({
    where: {
      OR: [
        {email: identificador},
        {cpf: identificador},
        {aluno: {ra: identificador}},
        {professor: {matricula: identificador}},
      ],
    },
    include: {
      aluno: {select: {id: true, ra: true}},
      professor: {select: {id: true, matricula: true, titulacao: true}},
    },
  });
};

export const findUserById = async ({id}: {id: string}) => {
  return prisma.user.findUnique({
    where: {id},
    select: {
      id: true,
      nome: true,
      email: true,
      cpf: true,
      role: true,
      avatarUrl: true,
      ativo: true,
      aluno: {select: {id: true, ra: true}},
      professor: {select: {id: true, matricula: true, titulacao: true}},
      responsavel: {
        select: {
          alunos: {
            select: {
              id: true,
              ra: true,
              user: {select: {nome: true, avatarUrl: true}},
              matriculas: {
                take: 1,
                orderBy: {criadoEm: "desc"},
                select: {
                  status: true,
                  periodoAtual: true,
                  curso: {select: {nome: true}},
                },
              },
            },
          },
        },
      },
    },
  });
};

export const findUserActiveStatus = async ({id}: {id: string}) => {
  return prisma.user.findUnique({
    where: {id},
    select: {id: true, ativo: true},
  });
};

export const findUserPasswordHash = async ({id}: {id: string}) => {
  return prisma.user.findUnique({
    where: {id},
    select: {id: true, senhaHash: true},
  });
};

export const updateUserPasswordHash = async ({id, senhaHash}: {id: string; senhaHash: string}) => {
  return prisma.user.update({
    where: {id},
    data: {senhaHash},
    select: {id: true},
  });
};
