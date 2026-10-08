import {Prisma} from "../../generated/prisma/client.js";
import {StatusDisciplina, StatusTermoAbertura, TipoTermoAbertura} from "../../generated/prisma/enums.js";
import {prisma} from "../../lib/db.js";
import type {IListTermosQuery} from "./termos-schemas.js";

const decimalOrNull = (value: number | null | undefined) => {
  if (value === undefined || value === null) {
    return null;
  }

  return new Prisma.Decimal(value);
};

const turmaResumoSelect = {
  id: true,
  codigo: true,
  anoLetivo: true,
  semestreLetivo: true,
  curso: {select: {id: true, nome: true}},
  disciplina: {select: {id: true, nome: true, codigo: true}},
} as const;

const diarioResumoSelect = {
  id: true,
  notaAv: true,
  notaAvs: true,
  notaAv3: true,
  notaSemestral: true,
  mediaFinal: true,
  totalFaltas: true,
  semestreFechado: true,
  turma: {select: turmaResumoSelect},
  matricula: {
    select: {
      aluno: {
        select: {
          ra: true,
          user: {select: {nome: true}},
        },
      },
    },
  },
} as const;

const termoSelect = {
  id: true,
  tipo: true,
  status: true,
  notaAv: true,
  notaAvs: true,
  notaAv3: true,
  totalFaltas: true,
  criadoEm: true,
  decididoEm: true,
  professor: {
    select: {
      id: true,
      matricula: true,
      user: {select: {nome: true}},
    },
  },
  turma: {select: turmaResumoSelect},
  diario: {select: diarioResumoSelect},
  decididoPor: {select: {id: true, nome: true}},
} as const;

export const findProfessorByUserId = async (userId: string) => {
  return prisma.professor.findUnique({
    where: {userId},
    select: {id: true},
  });
};

export const findTurmaForTermo = async (turmaId: string) => {
  return prisma.turma.findUnique({
    where: {id: turmaId},
    select: {
      id: true,
      professorId: true,
      diarios: {select: {id: true, semestreFechado: true}},
    },
  });
};

export const findDiarioForTermo = async (diarioClasseId: string) => {
  return prisma.diarioClasse.findUnique({
    where: {id: diarioClasseId},
    select: {
      id: true,
      semestreFechado: true,
      turma: {select: {id: true, professorId: true}},
    },
  });
};

export const countTermoPendenteTurma = async (turmaId: string) => {
  return prisma.solicitacaoTermoAbertura.count({
    where: {tipo: TipoTermoAbertura.TURMA, turmaId, status: StatusTermoAbertura.PENDENTE},
  });
};

export const countTermoPendenteDiario = async (diarioClasseId: string) => {
  return prisma.solicitacaoTermoAbertura.count({
    where: {tipo: TipoTermoAbertura.INDIVIDUAL, diarioClasseId, status: StatusTermoAbertura.PENDENTE},
  });
};

export const insertTermosTurma = async ({
  professorId,
  turmaIds,
}: {
  professorId: string;
  turmaIds: string[];
}) => {
  await prisma.solicitacaoTermoAbertura.createMany({
    data: turmaIds.map((turmaId) => ({
      tipo: TipoTermoAbertura.TURMA,
      professorId,
      turmaId,
    })),
  });

  return prisma.solicitacaoTermoAbertura.findMany({
    where: {
      professorId,
      tipo: TipoTermoAbertura.TURMA,
      turmaId: {in: turmaIds},
      status: StatusTermoAbertura.PENDENTE,
    },
    select: termoSelect,
    orderBy: {criadoEm: "desc"},
  });
};

export const insertTermoIndividual = async ({
  professorId,
  diarioClasseId,
  notaAv,
  notaAvs,
  notaAv3,
  totalFaltas,
}: {
  professorId: string;
  diarioClasseId: string;
  notaAv?: number;
  notaAvs?: number;
  notaAv3?: number;
  totalFaltas?: number;
}) => {
  return prisma.solicitacaoTermoAbertura.create({
    data: {
      tipo: TipoTermoAbertura.INDIVIDUAL,
      professorId,
      diarioClasseId,
      notaAv: decimalOrNull(notaAv),
      notaAvs: decimalOrNull(notaAvs),
      notaAv3: decimalOrNull(notaAv3),
      totalFaltas: totalFaltas ?? null,
    },
    select: termoSelect,
  });
};

export const listTermos = async ({
  status,
  tipo,
  professorId,
  criadoDe,
  criadoAte,
}: {
  status?: IListTermosQuery["status"];
  tipo?: IListTermosQuery["tipo"];
  professorId?: string;
  criadoDe?: Date;
  criadoAte?: Date;
}) => {
  return prisma.solicitacaoTermoAbertura.findMany({
    where: {
      ...(status ? {status} : {}),
      ...(tipo ? {tipo} : {}),
      ...(professorId ? {professorId} : {}),
      ...(criadoDe || criadoAte
        ? {
            criadoEm: {
              ...(criadoDe ? {gte: criadoDe} : {}),
              ...(criadoAte ? {lte: criadoAte} : {}),
            },
          }
        : {}),
    },
    select: termoSelect,
    orderBy: {criadoEm: "desc"},
  });
};

export const findTermoById = async (id: string) => {
  return prisma.solicitacaoTermoAbertura.findUnique({
    where: {id},
    select: {
      ...termoSelect,
      turmaId: true,
      diarioClasseId: true,
    },
  });
};

export const decideTermo = async ({
  id,
  status,
  decididoPorId,
  decididoEm,
}: {
  id: string;
  status: StatusTermoAbertura;
  decididoPorId: string;
  decididoEm: Date;
}) => {
  return prisma.solicitacaoTermoAbertura.update({
    where: {id},
    data: {status, decididoPorId, decididoEm},
    select: termoSelect,
  });
};

export const listTurmasFechadasDoProfessor = async ({
  professorId,
  anoLetivo,
  semestreLetivo,
}: {
  professorId: string;
  anoLetivo?: number;
  semestreLetivo?: number;
}) => {
  return prisma.turma.findMany({
    where: {
      professorId,
      ...(anoLetivo !== undefined ? {anoLetivo} : {}),
      ...(semestreLetivo !== undefined ? {semestreLetivo} : {}),
      diarios: {some: {semestreFechado: true}},
    },
    select: {
      ...turmaResumoSelect,
      diarios: {select: {semestreFechado: true}},
    },
    orderBy: [{anoLetivo: "desc"}, {semestreLetivo: "desc"}, {codigo: "asc"}],
  });
};

export const searchDiariosDoProfessor = async ({
  professorId,
  q,
}: {
  professorId: string;
  q: string;
}) => {
  return prisma.diarioClasse.findMany({
    where: {
      turma: {professorId},
      OR: [
        {matricula: {aluno: {ra: {contains: q, mode: "insensitive"}}}},
        {matricula: {aluno: {user: {nome: {contains: q, mode: "insensitive"}}}}},
      ],
    },
    select: diarioResumoSelect,
    orderBy: {atualizadoEm: "desc"},
    take: 20,
  });
};

export const reopenDiariosDaTurma = async (turmaId: string) => {
  return prisma.diarioClasse.updateMany({
    where: {turmaId, semestreFechado: true},
    data: {
      semestreFechado: false,
      statusDisciplina: StatusDisciplina.EM_ABERTO,
      chCumprida: 0,
      mediaFinal: null,
    },
  });
};

export const listProfessoresTermo = async () => {
  return prisma.professor.findMany({
    select: {
      id: true,
      matricula: true,
      user: {select: {nome: true}},
    },
    orderBy: {user: {nome: "asc"}},
  });
};
