import {StatusDisciplina} from "../../generated/prisma/enums.js";

export interface ILancamentoAcademico {
  notaAv: number | null;
  notaAvs: number | null;
  notaAv3: number | null;
  totalFaltas: number;
  chTotal: number;
}

export interface IRegulamentoAvaliacao {
  corteAprovacaoDireta: number;
  corteMediaFinal: number;
  limiteFaltasPercentual: number;
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

export const REGULAMENTO_AVALIACAO_PADRAO: IRegulamentoAvaliacao = {
  corteAprovacaoDireta: 6,
  corteMediaFinal: 5,
  limiteFaltasPercentual: 25,
};

const roundNota = (value: number) => Number(value.toFixed(2));

export const limiteFaltasDaDisciplina = (
  chTotal: number,
  percentual = REGULAMENTO_AVALIACAO_PADRAO.limiteFaltasPercentual,
) => Math.floor(chTotal * (percentual / 100));

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

export const evaluateLancamento = (
  input: ILancamentoAcademico,
  regulamento: IRegulamentoAvaliacao = REGULAMENTO_AVALIACAO_PADRAO,
): IResultadoLancamento => {
  const limiteFaltas = limiteFaltasDaDisciplina(input.chTotal, regulamento.limiteFaltasPercentual);
  const reprovadoPorFalta = input.totalFaltas > limiteFaltas;
  const notaSemestral = computeNotaSemestral(input.notaAv, input.notaAvs);
  const habilitaAv3 =
    !reprovadoPorFalta && notaSemestral !== null && notaSemestral < regulamento.corteAprovacaoDireta;

  return {notaSemestral, habilitaAv3, limiteFaltas, reprovadoPorFalta};
};

export const evaluateFechamento = (
  input: ILancamentoAcademico,
  regulamento: IRegulamentoAvaliacao = REGULAMENTO_AVALIACAO_PADRAO,
): IResultadoFechamento => {
  const lancamento = evaluateLancamento(input, regulamento);

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

  if (lancamento.notaSemestral >= regulamento.corteAprovacaoDireta) {
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
  const aprovado = mediaFinal >= regulamento.corteMediaFinal;

  return {
    notaSemestral: lancamento.notaSemestral,
    mediaFinal,
    habilitaAv3: true,
    statusDisciplina: aprovado ? StatusDisciplina.APROVADO : StatusDisciplina.RN,
    chCumprida: aprovado ? input.chTotal : 0,
  };
};
