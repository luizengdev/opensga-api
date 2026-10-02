import {Prisma} from "../../generated/prisma/client.js";
import {StatusReclamacao} from "../../generated/prisma/enums.js";
import {prisma} from "../../lib/db.js";
import type {
  ICreateComunicadoInput,
  ICreateReclamacaoInput,
  IListComunicadosQuery,
  IListReclamacoesQuery,
  IUpdateComunicadoInput,
} from "./communications-schemas.js";

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

const comunicadoSelect = {
  id: true,
  titulo: true,
  conteudo: true,
  publicoAlvo: true,
  criadoEm: true,
} as const;

const reclamacaoSelect = {
  id: true,
  usuarioId: true,
  assunto: true,
  tipo: true,
  descricao: true,
  resposta: true,
  status: true,
  criadoEm: true,
  usuario: {select: {id: true, nome: true, email: true, role: true}},
} as const;

export const listComunicados = async ({publicoAlvo}: IListComunicadosQuery) => {
  return prisma.comunicado.findMany({
    where: publicoAlvo ? {publicoAlvo: {has: publicoAlvo}} : undefined,
    select: comunicadoSelect,
    orderBy: {criadoEm: "desc"},
  });
};

export const findComunicadoById = async (id: string) => {
  return prisma.comunicado.findUnique({
    where: {id},
    select: comunicadoSelect,
  });
};

export const insertComunicado = async (data: ICreateComunicadoInput) => {
  return prisma.comunicado.create({
    data,
    select: comunicadoSelect,
  });
};

export const updateComunicadoById = async ({id, data}: {id: string; data: IUpdateComunicadoInput}) => {
  return runOrNull(() => prisma.comunicado.update({where: {id}, data, select: comunicadoSelect}));
};

export const deleteComunicadoById = async (id: string) => {
  return runOrNull(() => prisma.comunicado.delete({where: {id}, select: {id: true}}));
};

export const findUserById = async (id: string) => {
  return prisma.user.findUnique({
    where: {id},
    select: {id: true},
  });
};

export const listReclamacoes = async ({status, tipo}: IListReclamacoesQuery) => {
  return prisma.reclamacao.findMany({
    where: {
      ...(status ? {status} : {}),
      ...(tipo ? {tipo} : {}),
    },
    select: reclamacaoSelect,
    orderBy: {criadoEm: "desc"},
  });
};

export const findReclamacaoById = async (id: string) => {
  return prisma.reclamacao.findUnique({
    where: {id},
    select: reclamacaoSelect,
  });
};

export const insertReclamacao = async (data: ICreateReclamacaoInput) => {
  return prisma.reclamacao.create({
    data,
    select: reclamacaoSelect,
  });
};

export const updateReclamacaoById = async ({
  id,
  resposta,
  status,
}: {
  id: string;
  resposta?: string;
  status: StatusReclamacao;
}) => {
  return runOrNull(() =>
    prisma.reclamacao.update({
      where: {id},
      data: {
        status,
        ...(resposta !== undefined ? {resposta} : {}),
      },
      select: reclamacaoSelect,
    }),
  );
};

export const deleteReclamacaoById = async (id: string) => {
  return runOrNull(() => prisma.reclamacao.delete({where: {id}, select: {id: true}}));
};
