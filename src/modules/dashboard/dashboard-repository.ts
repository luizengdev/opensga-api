import {StatusFatura, StatusReclamacao} from "../../generated/prisma/enums.js";
import {prisma} from "../../lib/db.js";

export const countMatriculasByStatus = async () => {
  return prisma.matricula.groupBy({
    by: ["status"],
    _count: {_all: true},
  });
};

export const countTurmasInPeriod = async ({
  anoLetivo,
  semestreLetivo,
}: {
  anoLetivo: number;
  semestreLetivo: number;
}) => {
  return prisma.turma.count({
    where: {anoLetivo, semestreLetivo},
  });
};

export const listTurmaOccupancyInPeriod = async ({
  anoLetivo,
  semestreLetivo,
  professorUserId,
}: {
  anoLetivo: number;
  semestreLetivo: number;
  professorUserId?: string;
}) => {
  return prisma.turma.findMany({
    where: {
      anoLetivo,
      semestreLetivo,
      ...(professorUserId ? {professor: {userId: professorUserId}} : {}),
    },
    select: {
      id: true,
      codigo: true,
      capacidade: true,
      _count: {select: {diarios: true}},
    },
    orderBy: {codigo: "asc"},
  });
};

export const countPendingInvoices = async () => {
  return prisma.fatura.count({
    where: {status: StatusFatura.PENDENTE},
  });
};

export const countOpenComplaints = async () => {
  return prisma.reclamacao.count({
    where: {status: StatusReclamacao.ABERTO},
  });
};

export const countPendingGradeLaunches = async ({
  professorUserId,
  anoLetivo,
  semestreLetivo,
}: {
  professorUserId: string;
  anoLetivo: number;
  semestreLetivo: number;
}) => {
  return prisma.diarioClasse.count({
    where: {
      semestreFechado: false,
      turma: {
        professor: {userId: professorUserId},
        anoLetivo,
        semestreLetivo,
      },
      OR: [{notaSemestral: null}, {habilitaAv3: true, notaAv3: null}],
    },
  });
};
