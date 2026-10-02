import {Prisma} from "../../generated/prisma/client.js";
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
      notaA1: true,
      notaA2: true,
      notaAF: true,
      totalFaltas: true,
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
    select: {
      id: true,
      matriculaId: true,
      turmaId: true,
      notaA1: true,
      notaA2: true,
      notaAF: true,
      notaFinal: true,
      totalFaltas: true,
      chCumprida: true,
      aprovado: true,
      turma: {
        select: {
          id: true,
          codigo: true,
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
        },
      },
    },
    orderBy: {criadoEm: "desc"},
  });
};

export const findDiarioRecordById = async (id: string) => {
  return prisma.diarioClasse.findUnique({
    where: {id},
    select: {
      id: true,
      matriculaId: true,
      turmaId: true,
      notaA1: true,
      notaA2: true,
      notaAF: true,
      notaFinal: true,
      totalFaltas: true,
      chCumprida: true,
      aprovado: true,
      turma: {
        select: {
          id: true,
          codigo: true,
          disciplina: {select: {id: true, nome: true, codigo: true}},
          professor: {select: {userId: true}},
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

export const saveDiarioGrades = async ({
  id,
  notaA1,
  notaA2,
  notaAF,
  notaFinal,
  totalFaltas,
  chCumprida,
  aprovado,
}: {
  id: string;
  notaA1: number | null;
  notaA2: number | null;
  notaAF: number | null;
  notaFinal: number | null;
  totalFaltas: number;
  chCumprida: number;
  aprovado: boolean | null;
}) => {
  return prisma.diarioClasse.update({
    where: {id},
    data: {
      notaA1: decimalOrNull(notaA1),
      notaA2: decimalOrNull(notaA2),
      notaAF: decimalOrNull(notaAF),
      notaFinal: decimalOrNull(notaFinal),
      totalFaltas,
      chCumprida,
      aprovado,
    },
    select: {
      id: true,
      notaA1: true,
      notaA2: true,
      notaAF: true,
      notaFinal: true,
      totalFaltas: true,
      chCumprida: true,
      aprovado: true,
    },
  });
};
