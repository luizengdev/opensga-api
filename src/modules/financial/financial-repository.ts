import {Prisma} from "../../generated/prisma/client.js";
import {StatusFatura, StatusMatricula} from "../../generated/prisma/enums.js";
import {dayjs} from "../../lib/dayjs.js";
import {prisma} from "../../lib/db.js";
import type {ICreateFaturaInput, IListFaturasQuery, IListPrecosQuery} from "./financial-schemas.js";

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

export const findCursoForCheckout = async (id: string) => {
  return prisma.curso.findUnique({
    where: {id},
    select: {
      id: true,
      nome: true,
      modalidade: true,
    },
  });
};

const precoCursoSelect = {
  id: true,
  cursoId: true,
  valor: true,
  moeda: true,
  intervalo: true,
  stripeProductId: true,
  stripePriceId: true,
  ativo: true,
  criadoEm: true,
  atualizadoEm: true,
  curso: {
    select: {
      id: true,
      nome: true,
      modalidade: true,
    },
  },
} as const;

export const listPrecosCurso = async ({cursoId, ativo}: IListPrecosQuery) => {
  return prisma.precoCurso.findMany({
    where: {
      ...(cursoId ? {cursoId} : {}),
      ...(ativo === undefined ? {} : {ativo}),
    },
    select: precoCursoSelect,
    orderBy: {criadoEm: "desc"},
  });
};

export const findPrecoCursoById = async (id: string) => {
  return prisma.precoCurso.findUnique({
    where: {id},
    select: precoCursoSelect,
  });
};

export const findPrecoCursoByCursoId = async (cursoId: string) => {
  return prisma.precoCurso.findUnique({
    where: {cursoId},
    select: precoCursoSelect,
  });
};

export const findPrecoCursoAtivoByCursoId = async (cursoId: string) => {
  return prisma.precoCurso.findFirst({
    where: {cursoId, ativo: true},
    select: {id: true, stripePriceId: true},
  });
};

export const listCatalogoCursos = async () => {
  return prisma.precoCurso.findMany({
    where: {ativo: true},
    select: {
      valor: true,
      moeda: true,
      intervalo: true,
      curso: {
        select: {
          id: true,
          nome: true,
          modalidade: true,
          duracaoSemestres: true,
          campus: {select: {nome: true, cidade: true, estado: true}},
        },
      },
    },
    orderBy: {curso: {nome: "asc"}},
  });
};

export const insertPrecoCurso = async ({
  cursoId,
  valor,
  stripeProductId,
  stripePriceId,
}: {
  cursoId: string;
  valor: number;
  stripeProductId: string;
  stripePriceId: string;
}) => {
  return prisma.precoCurso.create({
    data: {
      cursoId,
      valor: new Prisma.Decimal(valor),
      stripeProductId,
      stripePriceId,
    },
    select: precoCursoSelect,
  });
};

export const updatePrecoCursoById = async ({
  id,
  valor,
  ativo,
  stripePriceId,
}: {
  id: string;
  valor?: number;
  ativo?: boolean;
  stripePriceId?: string;
}) => {
  return runOrNull(() =>
    prisma.precoCurso.update({
      where: {id},
      data: {
        ...(valor !== undefined ? {valor: new Prisma.Decimal(valor)} : {}),
        ...(ativo !== undefined ? {ativo} : {}),
        ...(stripePriceId ? {stripePriceId} : {}),
      },
      select: precoCursoSelect,
    }),
  );
};

export const deletePrecoCursoById = async (id: string) => {
  return runOrNull(() => prisma.precoCurso.delete({where: {id}, select: {id: true}}));
};

export const activateMatriculaByAlunoAndCurso = async ({
  alunoId,
  cursoId,
}: {
  alunoId: string;
  cursoId?: string;
}) => {
  const matricula = await prisma.matricula.findFirst({
    where: {
      alunoId,
      ...(cursoId ? {cursoId} : {}),
    },
    orderBy: {criadoEm: "desc"},
    select: {id: true},
  });

  if (!matricula) {
    return null;
  }

  return prisma.matricula.update({
    where: {id: matricula.id},
    data: {status: StatusMatricula.ATIVO},
    select: {id: true, status: true},
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
      dataVencimento: dayjs(data.dataVencimento, "YYYY-MM-DD").toDate(),
      stripeInvoiceId: data.stripeInvoiceId,
      stripePaymentUrl: data.stripePaymentUrl,
    },
    select: faturaSelect,
  });
};

export const upsertFaturaFromStripeInvoice = async ({
  alunoId,
  descricao,
  valor,
  dataVencimento,
  status,
  stripeInvoiceId,
  stripePaymentUrl,
  pagoEm,
}: {
  alunoId: string;
  descricao: string;
  valor: number;
  dataVencimento: Date;
  status: StatusFatura;
  stripeInvoiceId: string;
  stripePaymentUrl: string | null;
  pagoEm: Date | null;
}) => {
  return prisma.fatura.upsert({
    where: {stripeInvoiceId},
    create: {
      alunoId,
      descricao,
      valor: new Prisma.Decimal(valor),
      dataVencimento,
      status,
      stripeInvoiceId,
      stripePaymentUrl,
      pagoEm,
    },
    update: {
      status,
      stripePaymentUrl,
      pagoEm,
      valor: new Prisma.Decimal(valor),
    },
    select: {id: true},
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
