import {Prisma} from "../../generated/prisma/client.js";
import {StatusDisciplina} from "../../generated/prisma/enums.js";
import {prisma} from "../../lib/db.js";

const isKnownRequestError = (error: unknown): error is Prisma.PrismaClientKnownRequestError => {
  return error instanceof Prisma.PrismaClientKnownRequestError;
};

const decimalOrNull = (value: number | null) => {
  if (value === null) {
    return null;
  }

  return new Prisma.Decimal(value);
};

const diarioSelect = {
  id: true,
  matriculaId: true,
  turmaId: true,
  notaAv: true,
  notaAvs: true,
  notaAv3: true,
  notaSemestral: true,
  mediaFinal: true,
  habilitaAv3: true,
  totalFaltas: true,
  chCumprida: true,
  statusDisciplina: true,
  semestreFechado: true,
  turma: {
    select: {
      id: true,
      codigo: true,
      disciplinaId: true,
      disciplina: {select: {id: true, nome: true, codigo: true}},
    },
  },
  matricula: {
    select: {
      aluno: {
        select: {
          ra: true,
          user: {select: {nome: true}},
        },
      },
      matrizCurricular: {
        select: {
          componentes: {select: {disciplinaId: true, chTotal: true}},
        },
      },
    },
  },
} as const;

export const findMatriculaForPlacement = async (matriculaId: string) => {
  return prisma.matricula.findUnique({
    where: {id: matriculaId},
    select: {
      id: true,
      status: true,
      matrizCurricular: {
        select: {
          componentes: {select: {disciplinaId: true}},
        },
      },
      diarios: {
        select: {
          turma: {select: {id: true, disciplinaId: true}},
        },
      },
      aluno: {
        select: {
          ra: true,
          user: {select: {nome: true}},
        },
      },
    },
  });
};

export const findTurmaForPlacement = async (turmaId: string) => {
  return prisma.turma.findUnique({
    where: {id: turmaId},
    select: {
      id: true,
      disciplinaId: true,
      disciplina: {select: {id: true, nome: true, codigo: true}},
    },
  });
};

export const createDiarioEntry = async ({matriculaId, turmaId}: {matriculaId: string; turmaId: string}) => {
  try {
    return await prisma.diarioClasse.create({
      data: {matriculaId, turmaId},
      select: {id: true, matriculaId: true, turmaId: true},
    });
  } catch (error) {
    if (isKnownRequestError(error) && error.code === "P2002") {
      return null;
    }

    throw error;
  }
};

export const findDiarioById = async (id: string) => {
  return prisma.diarioClasse.findUnique({
    where: {id},
    select: {
      id: true,
      notaAv: true,
      notaAvs: true,
      notaAv3: true,
      totalFaltas: true,
      semestreFechado: true,
      turma: {
        select: {
          disciplinaId: true,
          professor: {select: {userId: true}},
        },
      },
      matricula: {
        select: {
          matrizCurricular: {
            select: {
              componentes: {select: {disciplinaId: true, chTotal: true}},
            },
          },
        },
      },
    },
  });
};

export const listDiarios = async ({
  turmaId,
  matriculaId,
  professorUserId,
}: {
  turmaId?: string;
  matriculaId?: string;
  professorUserId?: string;
}) => {
  return prisma.diarioClasse.findMany({
    where: {
      ...(turmaId ? {turmaId} : {}),
      ...(matriculaId ? {matriculaId} : {}),
      ...(professorUserId ? {turma: {professor: {userId: professorUserId}}} : {}),
    },
    select: diarioSelect,
    orderBy: {criadoEm: "desc"},
  });
};

export const findDiarioRecordById = async (id: string) => {
  return prisma.diarioClasse.findUnique({
    where: {id},
    select: {
      ...diarioSelect,
      turma: {
        select: {
          id: true,
          codigo: true,
          disciplinaId: true,
          disciplina: {select: {id: true, nome: true, codigo: true}},
          professor: {select: {userId: true}},
        },
      },
    },
  });
};

export const deleteDiarioById = async (id: string) => {
  try {
    return await prisma.diarioClasse.delete({
      where: {id},
      select: {id: true},
    });
  } catch (error) {
    if (isKnownRequestError(error) && error.code === "P2025") {
      return null;
    }

    throw error;
  }
};

export const saveDiarioLancamento = async ({
  id,
  notaAv,
  notaAvs,
  notaAv3,
  notaSemestral,
  habilitaAv3,
  totalFaltas,
}: {
  id: string;
  notaAv: number | null;
  notaAvs: number | null;
  notaAv3: number | null;
  notaSemestral: number | null;
  habilitaAv3: boolean;
  totalFaltas: number;
}) => {
  return prisma.diarioClasse.update({
    where: {id},
    data: {
      notaAv: decimalOrNull(notaAv),
      notaAvs: decimalOrNull(notaAvs),
      notaAv3: decimalOrNull(notaAv3),
      notaSemestral: decimalOrNull(notaSemestral),
      habilitaAv3,
      totalFaltas,
    },
    select: {
      id: true,
      notaAv: true,
      notaAvs: true,
      notaAv3: true,
      notaSemestral: true,
      mediaFinal: true,
      habilitaAv3: true,
      totalFaltas: true,
      chCumprida: true,
      statusDisciplina: true,
      semestreFechado: true,
    },
  });
};

export const findTurmaForFechamento = async (turmaId: string) => {
  return prisma.turma.findUnique({
    where: {id: turmaId},
    select: {
      id: true,
      professor: {select: {userId: true}},
    },
  });
};

export const listDiariosForFechamento = async (turmaId: string) => {
  return prisma.diarioClasse.findMany({
    where: {turmaId},
    select: {
      id: true,
      notaAv: true,
      notaAvs: true,
      notaAv3: true,
      totalFaltas: true,
      semestreFechado: true,
      turma: {select: {disciplinaId: true}},
      matricula: {
        select: {
          matrizCurricular: {
            select: {
              componentes: {select: {disciplinaId: true, chTotal: true}},
            },
          },
        },
      },
    },
  });
};

export const closeDiariosAtomically = async (
  updates: Array<{
    id: string;
    notaSemestral: number | null;
    mediaFinal: number | null;
    habilitaAv3: boolean;
    statusDisciplina: StatusDisciplina;
    chCumprida: number;
  }>,
) => {
  return prisma.$transaction(
    updates.map((update) =>
      prisma.diarioClasse.update({
        where: {id: update.id},
        data: {
          notaSemestral: decimalOrNull(update.notaSemestral),
          mediaFinal: decimalOrNull(update.mediaFinal),
          habilitaAv3: update.habilitaAv3,
          statusDisciplina: update.statusDisciplina,
          chCumprida: update.chCumprida,
          semestreFechado: true,
        },
        select: {
          id: true,
          notaAv: true,
          notaAvs: true,
          notaAv3: true,
          notaSemestral: true,
          mediaFinal: true,
          habilitaAv3: true,
          totalFaltas: true,
          chCumprida: true,
          statusDisciplina: true,
          semestreFechado: true,
        },
      }),
    ),
  );
};
