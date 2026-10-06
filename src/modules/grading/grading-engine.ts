import {StatusDisciplina} from "../../generated/prisma/enums.js";

export interface ILancamentoAcademico {
  notaAv: number | null;
  notaAvs: number | null;
  notaAv3: number | null;
  totalFaltas: number;
  chTotal: number;
}

export interface IResultadoLancamento {
  notaSemestral: number | null;
  habilitaAv3: boolean;
  limiteFaltas: number;
  reprovadoPorFalta: boolean;
}

export interface IResultadoFechamento {
  notaSemestral: number | null;
  mediaFinal: number | null;
  habilitaAv3: boolean;
  statusDisciplina: StatusDisciplina;
  chCumprida: number;
}

const roundNota = (value: number) => Number(value.toFixed(2));

export const limiteFaltasDaDisciplina = (chTotal: number) => Math.floor(chTotal * 0.25);

export const computeNotaSemestral = (notaAv: number | null, notaAvs: number | null) => {
  if (notaAv === null && notaAvs === null) {
    return null;
  }

  if (notaAv === null) {
    return notaAvs;
  }

  if (notaAvs === null) {
    return notaAv;
  }

  return roundNota(Math.max(notaAv, notaAvs));
};

export const evaluateLancamento = (input: ILancamentoAcademico): IResultadoLancamento => {
  const limiteFaltas = limiteFaltasDaDisciplina(input.chTotal);
  const reprovadoPorFalta = input.totalFaltas > limiteFaltas;
  const notaSemestral = computeNotaSemestral(input.notaAv, input.notaAvs);
  const habilitaAv3 = !reprovadoPorFalta && notaSemestral !== null && notaSemestral < 6;

  return {notaSemestral, habilitaAv3, limiteFaltas, reprovadoPorFalta};
};

export const evaluateFechamento = (input: ILancamentoAcademico): IResultadoFechamento => {
  const lancamento = evaluateLancamento(input);

  if (lancamento.reprovadoPorFalta) {
    return {
      notaSemestral: lancamento.notaSemestral,
      mediaFinal: null,
      habilitaAv3: false,
      statusDisciplina: StatusDisciplina.RF,
      chCumprida: 0,
    };
  }

  if (lancamento.notaSemestral === null) {
    return {
      notaSemestral: null,
      mediaFinal: null,
      habilitaAv3: false,
      statusDisciplina: StatusDisciplina.EM_ABERTO,
      chCumprida: 0,
    };
  }

  if (lancamento.notaSemestral >= 6) {
    return {
      notaSemestral: lancamento.notaSemestral,
      mediaFinal: lancamento.notaSemestral,
      habilitaAv3: false,
      statusDisciplina: StatusDisciplina.APROVADO,
      chCumprida: input.chTotal,
    };
  }

  if (input.notaAv3 === null) {
    return {
      notaSemestral: lancamento.notaSemestral,
      mediaFinal: null,
      habilitaAv3: true,
      statusDisciplina: StatusDisciplina.EM_ABERTO,
      chCumprida: 0,
    };
  }

  const mediaFinal = roundNota((lancamento.notaSemestral + input.notaAv3) / 2);
  const aprovado = mediaFinal >= 5;

  return {
    notaSemestral: lancamento.notaSemestral,
    mediaFinal,
    habilitaAv3: true,
    statusDisciplina: aprovado ? StatusDisciplina.APROVADO : StatusDisciplina.RN,
    chCumprida: aprovado ? input.chTotal : 0,
  };
};
