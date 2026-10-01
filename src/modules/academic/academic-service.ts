import {
  findMatrizWithComponentes,
  insertMatriz,
  insertMatrizComponente,
  insertTurma,
  listTurmasByCampusAndPeriod,
} from "./academic-repository.js";
import type {
  IAddComponenteMatrizInput,
  IAuditoriaMecOutput,
  ICreateMatrizInput,
  ICreateTurmaInput,
  IListTurmasQuery,
} from "./academic-schemas.js";

export class AcademicError extends Error {
  readonly statusCode: 400 | 404;

  constructor(message: string, statusCode: 400 | 404) {
    super(message);
    this.name = "AcademicError";
    this.statusCode = statusCode;
  }
}

const percentualDe = (parte: number, total: number) => {
  if (total <= 0) {
    return 0;
  }

  return Number(((parte / total) * 100).toFixed(2));
};

export const createNewMatriz = async (input: ICreateMatrizInput) => {
  return insertMatriz(input);
};

export const addComponentToMatriz = async (input: IAddComponenteMatrizInput) => {
  const somaCargas = input.chPresencial + input.chSincrona + input.chAssincrona;

  if (somaCargas !== input.chTotal) {
    throw new AcademicError(
      `A soma das cargas (Presencial: ${input.chPresencial}h + Síncrona: ${input.chSincrona}h + Assíncrona: ${input.chAssincrona}h = ${somaCargas}h) deve ser idêntica à CH Total (${input.chTotal}h).`,
      400,
    );
  }

  return insertMatrizComponente(input);
};

export const auditMatrizForMecCompliance = async ({
  matrizCurricularId,
}: {
  matrizCurricularId: string;
}): Promise<IAuditoriaMecOutput> => {
  const matriz = await findMatrizWithComponentes({matrizCurricularId});

  if (!matriz) {
    throw new AcademicError("Matriz curricular não encontrada no sistema.", 404);
  }

  if (matriz.componentes.length === 0) {
    throw new AcademicError("A matriz curricular informada não possui componentes vinculados.", 400);
  }

  const totais = matriz.componentes.reduce(
    (acc, componente) => ({
      chTotal: acc.chTotal + componente.chTotal,
      chExtensao: acc.chExtensao + componente.chExtensao,
      chPresencial: acc.chPresencial + componente.chPresencial,
      chSincrona: acc.chSincrona + componente.chSincrona,
    }),
    {chTotal: 0, chExtensao: 0, chPresencial: 0, chSincrona: 0},
  );

  const razaoExtensao = totais.chTotal > 0 ? (totais.chExtensao / totais.chTotal) * 100 : 0;

  return {
    matrizId: matriz.id,
    matrizNome: matriz.nome,
    cursoNome: matriz.curso.nome,
    campusId: matriz.curso.campus.id,
    campusNome: matriz.curso.campus.nome,
    codigoPolo: matriz.curso.campus.codigoPolo,
    chTotalGeral: totais.chTotal,
    chExtensaoTotal: totais.chExtensao,
    percentualExtensao: Number(razaoExtensao.toFixed(2)),
    cumpreRegra10PorcentoExtensao: razaoExtensao >= 10,
    chPresencialTotal: totais.chPresencial,
    percentualPresencial: percentualDe(totais.chPresencial, totais.chTotal),
    chSincronaTotal: totais.chSincrona,
    percentualSincrono: percentualDe(totais.chSincrona, totais.chTotal),
    percentualPresencialESincrono: percentualDe(totais.chPresencial + totais.chSincrona, totais.chTotal),
    quantidadeComponentes: matriz.componentes.length,
  };
};

export const createNewTurma = async (input: ICreateTurmaInput) => {
  return insertTurma(input);
};

export const fetchTurmas = async (params: IListTurmasQuery) => {
  const turmas = await listTurmasByCampusAndPeriod(params);

  return turmas.map(({_count, ...turma}) => ({
    ...turma,
    quantidadeDiarios: _count.diarios,
  }));
};
