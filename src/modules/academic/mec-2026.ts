import {ModalidadeCurso, TipoComponente} from "../../generated/prisma/enums.js";

export interface IComponenteAuditoria {
  disciplinaId: string;
  tipo: TipoComponente;
  chTotal: number;
  chPresencial: number;
  chSincrona: number;
  chAssincrona: number;
  chExtensao: number;
}

export interface IViolacaoRegulatoria {
  codigo: "IDENTIDADE_CH" | "MODALIDADE_DISCIPLINA" | "EXTENSAO_10";
  mensagem: string;
  disciplinaId?: string;
}

const percentualDe = (parte: number, total: number) => {
  if (total <= 0) {
    return 0;
  }

  return Number(((parte / total) * 100).toFixed(2));
};

export const assertIdentidadeCargaHoraria = ({
  chTotal,
  chPresencial,
  chSincrona,
  chAssincrona,
}: {
  chTotal: number;
  chPresencial: number;
  chSincrona: number;
  chAssincrona: number;
}) => {
  return chTotal === chPresencial + chSincrona + chAssincrona;
};

export const validateModalidadeDisciplina = ({
  modalidade,
  chTotal,
  chPresencial,
  chSincrona,
  chAssincrona,
}: {
  modalidade: ModalidadeCurso;
  chTotal: number;
  chPresencial: number;
  chSincrona: number;
  chAssincrona: number;
}) => {
  if (chTotal <= 0) {
    return "A carga horária total da disciplina deve ser maior que zero.";
  }

  const presencialPct = chPresencial / chTotal;
  const sincronaPct = chSincrona / chTotal;
  const assincronaPct = chAssincrona / chTotal;

  if (modalidade === ModalidadeCurso.PRESENCIAL && presencialPct < 0.7) {
    return `Curso presencial exige CH presencial ≥ 70% (atual ${percentualDe(chPresencial, chTotal)}%).`;
  }

  if (modalidade === ModalidadeCurso.SEMIPRESENCIAL) {
    if (presencialPct < 0.3) {
      return `Curso semipresencial exige CH presencial ≥ 30% (atual ${percentualDe(chPresencial, chTotal)}%).`;
    }

    if (sincronaPct < 0.2) {
      return `Curso semipresencial exige CH síncrona ≥ 20% (atual ${percentualDe(chSincrona, chTotal)}%).`;
    }

    if (assincronaPct > 0.5) {
      return `Curso semipresencial admite no máximo 50% de CH assíncrona (atual ${percentualDe(chAssincrona, chTotal)}%).`;
    }
  }

  if (modalidade === ModalidadeCurso.EAD) {
    if (presencialPct < 0.1) {
      return `Curso EAD exige CH presencial ≥ 10% (atual ${percentualDe(chPresencial, chTotal)}%).`;
    }

    if (sincronaPct < 0.1) {
      return `Curso EAD exige CH síncrona ≥ 10% (atual ${percentualDe(chSincrona, chTotal)}%).`;
    }
  }

  return null;
};

export const collectViolacoesMatriz = ({
  modalidade,
  componentes,
  percentualMinimoExtensao = 10,
}: {
  modalidade: ModalidadeCurso;
  componentes: IComponenteAuditoria[];
  percentualMinimoExtensao?: number;
}) => {
  const violacoes = componentes.flatMap((componente) => {
    const daDisciplina: IViolacaoRegulatoria[] = [];

    if (
      !assertIdentidadeCargaHoraria({
        chTotal: componente.chTotal,
        chPresencial: componente.chPresencial,
        chSincrona: componente.chSincrona,
        chAssincrona: componente.chAssincrona,
      })
    ) {
      daDisciplina.push({
        codigo: "IDENTIDADE_CH",
        disciplinaId: componente.disciplinaId,
        mensagem: `CH_Total deve ser igual a presencial + síncrona + assíncrona na disciplina ${componente.disciplinaId}.`,
      });
    }

    const modalidadeInvalida = validateModalidadeDisciplina({
      modalidade,
      chTotal: componente.chTotal,
      chPresencial: componente.chPresencial,
      chSincrona: componente.chSincrona,
      chAssincrona: componente.chAssincrona,
    });

    if (modalidadeInvalida) {
      daDisciplina.push({
        codigo: "MODALIDADE_DISCIPLINA",
        disciplinaId: componente.disciplinaId,
        mensagem: modalidadeInvalida,
      });
    }

    return daDisciplina;
  });

  const chTotalGeral = componentes.reduce((acc, componente) => acc + componente.chTotal, 0);
  const chExtensaoPorTipo = componentes
    .filter((componente) => componente.tipo === TipoComponente.EXTENSAO)
    .reduce((acc, componente) => acc + componente.chTotal, 0);
  const percentualExtensao = percentualDe(chExtensaoPorTipo, chTotalGeral);

  if (percentualExtensao < percentualMinimoExtensao) {
    violacoes.push({
      codigo: "EXTENSAO_10",
      mensagem: `Componentes do tipo Extensão representam ${percentualExtensao}% da CH da matriz (mínimo institucional ${percentualMinimoExtensao}%).`,
    });
  }

  return {violacoes, chTotalGeral, chExtensaoPorTipo, percentualExtensao, percentualMinimoExtensao};
};
