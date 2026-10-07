import {dayjs} from "../../src/lib/dayjs.js";
import {evaluateFechamento} from "../../src/modules/grading/grading-engine.js";

export const alunoQuartoPeriodoEsw = {
  nome: "Fernanda Costa",
  email: "aluno.esw.4@opensga.dev",
  cpf: "300.000.000-23",
  ra: "2025000001",
} as const;

export const recuarSemestresLetivos = (
  {anoLetivo, semestreLetivo}: {anoLetivo: number; semestreLetivo: number},
  quantidade: number,
) => {
  const mesInicio = semestreLetivo === 1 ? "01" : "07";
  const data = dayjs(`${anoLetivo}-${mesInicio}-01`, "YYYY-MM-DD").subtract(quantidade * 6, "month");

  return {
    anoLetivo: data.year(),
    semestreLetivo: data.month() < 6 ? 1 : 2,
  };
};

const padroesAprovacao = [
  {notaAv: 8.7, notaAvs: null, notaAv3: null, totalFaltas: 0},
  {notaAv: 5.5, notaAvs: 7.2, notaAv3: null, totalFaltas: 3},
  {notaAv: 6, notaAvs: null, notaAv3: null, totalFaltas: 4},
  {notaAv: 9.4, notaAvs: 8, notaAv3: null, totalFaltas: 1},
  {notaAv: 7.1, notaAvs: 7.8, notaAv3: null, totalFaltas: 6},
  {notaAv: 4.8, notaAvs: 6.5, notaAv3: null, totalFaltas: 2},
  {notaAv: 8, notaAvs: null, notaAv3: null, totalFaltas: 5},
] as const;

export const lancamentoHistoricoAprovado = ({index, chTotal}: {index: number; chTotal: number}) => {
  const padrao = padroesAprovacao[index % padroesAprovacao.length];
  const fechamento = evaluateFechamento({
    notaAv: padrao.notaAv,
    notaAvs: padrao.notaAvs,
    notaAv3: padrao.notaAv3,
    totalFaltas: padrao.totalFaltas,
    chTotal,
  });

  if (fechamento.statusDisciplina !== "APROVADO") {
    throw new Error(`Lançamento histórico ${index} não fechou como APROVADO.`);
  }

  return {
    notaAv: padrao.notaAv,
    notaAvs: padrao.notaAvs,
    notaAv3: padrao.notaAv3,
    totalFaltas: padrao.totalFaltas,
    notaSemestral: fechamento.notaSemestral,
    mediaFinal: fechamento.mediaFinal,
    habilitaAv3: fechamento.habilitaAv3,
    statusDisciplina: fechamento.statusDisciplina,
    chCumprida: fechamento.chCumprida,
    semestreFechado: true,
  };
};
