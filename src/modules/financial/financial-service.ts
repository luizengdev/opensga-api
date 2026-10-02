import {Prisma} from "../../generated/prisma/client.js";
import {StatusFatura} from "../../generated/prisma/enums.js";
import {
  deleteFaturaById,
  findAlunoById,
  findFaturaById,
  insertFatura,
  listFaturas,
  updateFaturaStatusById,
} from "./financial-repository.js";
import type {ICreateFaturaInput, IFaturaOutput, IListFaturasQuery, IUpdateFaturaStatusInput} from "./financial-schemas.js";

export class FinancialError extends Error {
  readonly statusCode: 400 | 404;

  constructor(message: string, statusCode: 400 | 404) {
    super(message);
    this.name = "FinancialError";
    this.statusCode = statusCode;
  }
}

const mapFatura = (fatura: {
  id: string;
  alunoId: string;
  descricao: string;
  valor: Prisma.Decimal;
  dataVencimento: Date;
  status: StatusFatura;
  stripeInvoiceId: string | null;
  stripePaymentUrl: string | null;
  pagoEm: Date | null;
  aluno: IFaturaOutput["aluno"];
}): IFaturaOutput => {
  return {
    id: fatura.id,
    alunoId: fatura.alunoId,
    descricao: fatura.descricao,
    valor: Number(fatura.valor),
    dataVencimento: fatura.dataVencimento.toISOString(),
    status: fatura.status,
    stripeInvoiceId: fatura.stripeInvoiceId,
    stripePaymentUrl: fatura.stripePaymentUrl,
    pagoEm: fatura.pagoEm ? fatura.pagoEm.toISOString() : null,
    aluno: fatura.aluno,
  };
};

export const fetchFaturas = async (query: IListFaturasQuery) => {
  const faturas = await listFaturas(query);
  return faturas.map(mapFatura);
};

export const fetchFaturaById = async (id: string) => {
  const fatura = await findFaturaById(id);

  if (!fatura) {
    throw new FinancialError("Fatura não encontrada.", 404);
  }

  return mapFatura(fatura);
};

export const createNewFatura = async (input: ICreateFaturaInput) => {
  const aluno = await findAlunoById(input.alunoId);

  if (!aluno) {
    throw new FinancialError("Aluno informado não existe.", 404);
  }

  const fatura = await insertFatura(input);
  return mapFatura(fatura);
};

export const changeFaturaStatus = async ({id, data}: {id: string; data: IUpdateFaturaStatusInput}) => {
  const pagoEm =
    data.status === StatusFatura.PAGA ? (data.pagoEm ? new Date(data.pagoEm) : new Date()) : (null);

  const fatura = await updateFaturaStatusById({id, status: data.status, pagoEm});

  if (!fatura) {
    throw new FinancialError("Fatura não encontrada.", 404);
  }

  return mapFatura(fatura);
};

export const removeFatura = async (id: string) => {
  const deleted = await deleteFaturaById(id);

  if (!deleted) {
    throw new FinancialError("Fatura não encontrada.", 404);
  }

  return deleted;
};
