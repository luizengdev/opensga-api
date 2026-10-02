import {Prisma} from "../../generated/prisma/client.js";
import {StatusFatura} from "../../generated/prisma/enums.js";
import {prisma} from "../../lib/db.js";
import type {ICreateFaturaInput, IListFaturasQuery} from "./financial-schemas.js";

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

const faturaSelect = {
  id: true,
  alunoId: true,
  descricao: true,
  valor: true,
  dataVencimento: true,
  status: true,
  stripeInvoiceId: true,
  stripePaymentUrl: true,
  pagoEm: true,
  aluno: {
    select: {
      ra: true,
      user: {select: {id: true, nome: true, email: true}},
    },
  },
} as const;

export const findAlunoById = async (id: string) => {
  return prisma.aluno.findUnique({
    where: {id},
    select: {id: true},
  });
};

export const listFaturas = async ({alunoId, status}: IListFaturasQuery) => {
  return prisma.fatura.findMany({
    where: {
      ...(alunoId ? {alunoId} : {}),
      ...(status ? {status} : {}),
    },
    select: faturaSelect,
    orderBy: {dataVencimento: "desc"},
  });
};

export const findFaturaById = async (id: string) => {
  return prisma.fatura.findUnique({
    where: {id},
    select: faturaSelect,
  });
};

export const insertFatura = async (data: ICreateFaturaInput) => {
  return prisma.fatura.create({
    data: {
      alunoId: data.alunoId,
      descricao: data.descricao,
      valor: new Prisma.Decimal(data.valor),
      dataVencimento: new Date(data.dataVencimento),
      stripeInvoiceId: data.stripeInvoiceId,
      stripePaymentUrl: data.stripePaymentUrl,
    },
    select: faturaSelect,
  });
};

export const updateFaturaStatusById = async ({
  id,
  status,
  pagoEm,
}: {
  id: string;
  status: StatusFatura;
  pagoEm: Date | null;
}) => {
  return runOrNull(() =>
    prisma.fatura.update({
      where: {id},
      data: {status, pagoEm},
      select: faturaSelect,
    }),
  );
};

export const deleteFaturaById = async (id: string) => {
  return runOrNull(() => prisma.fatura.delete({where: {id}, select: {id: true}}));
};
