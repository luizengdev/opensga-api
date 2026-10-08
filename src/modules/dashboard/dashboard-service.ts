import {StatusMatricula} from "../../generated/prisma/enums.js";
import {fetchParametrizacoes} from "../settings/settings-service.js";
import {
  countMatriculasByStatus,
  countOpenComplaints,
  countPendingGradeLaunches,
  countPendingInvoices,
  countTurmasInPeriod,
  listTurmaOccupancyInPeriod,
} from "./dashboard-repository.js";
import type {IAdminDashboardOutput, IDashboardPeriodQuery, IProfessorDashboardOutput} from "./dashboard-schemas.js";

const resolvePeriod = async ({anoLetivo, semestreLetivo}: IDashboardPeriodQuery) => {
  const institucional = await fetchParametrizacoes();

  return {
    anoLetivo: anoLetivo ?? institucional.anoLetivo,
    semestreLetivo: semestreLetivo ?? institucional.semestreLetivo,
  };
};

const mapOccupancy = (turmas: {id: string; codigo: string; capacidade: number; _count: {diarios: number}}[]) => {
  return turmas.map((turma) => ({
    id: turma.id,
    codigo: turma.codigo,
    capacidade: turma.capacidade,
    quantidadeDiarios: turma._count.diarios,
  }));
};

const averageOccupancy = (turmas: {capacidade: number; quantidadeDiarios: number}[]) => {
  if (turmas.length === 0) {
    return 0;
  }

  const soma = turmas.reduce((acc, turma) => {
    if (turma.capacidade <= 0) {
      return acc;
    }

    return acc + turma.quantidadeDiarios / turma.capacidade;
  }, 0);

  return Number(((soma / turmas.length) * 100).toFixed(2));
};

export const fetchAdminDashboard = async (query: IDashboardPeriodQuery): Promise<IAdminDashboardOutput> => {
  const period = await resolvePeriod(query);
  const [matriculas, turmasNoPeriodo, ocupacoes, faturasPendentes, reclamacoesAbertas] = await Promise.all([
    countMatriculasByStatus(),
    countTurmasInPeriod(period),
    listTurmaOccupancyInPeriod(period),
    countPendingInvoices(),
    countOpenComplaints(),
  ]);

  const turmas = mapOccupancy(ocupacoes);

  return {
    ...period,
    matriculasPorStatus: Object.values(StatusMatricula).map((status) => ({
      status,
      quantidade: matriculas.find((item) => item.status === status)?._count._all ?? 0,
    })),
    turmasNoPeriodo,
    ocupacaoMedia: averageOccupancy(turmas),
    faturasPendentes,
    reclamacoesAbertas,
  };
};

export const fetchProfessorDashboard = async ({
  actorUserId,
  ...query
}: IDashboardPeriodQuery & {actorUserId: string}): Promise<IProfessorDashboardOutput> => {
  const period = await resolvePeriod(query);
  const [ocupacoes, lancamentosPendentes] = await Promise.all([
    listTurmaOccupancyInPeriod({...period, professorUserId: actorUserId}),
    countPendingGradeLaunches({...period, professorUserId: actorUserId}),
  ]);

  return {
    ...period,
    turmas: mapOccupancy(ocupacoes),
    lancamentosPendentes,
  };
};
