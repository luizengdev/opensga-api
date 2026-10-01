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
      aluno: {select: {ra: true}},
      professor: {select: {matricula: true, titulacao: true}},
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
      aluno: {select: {ra: true}},
      professor: {select: {matricula: true, titulacao: true}},
    },
  });
};
