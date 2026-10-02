import {Prisma} from "../../generated/prisma/client.js";
import {prisma} from "../../lib/db.js";
import type {
  IAddComponenteMatrizInput,
  ICreateCampusInput,
  ICreateCursoInput,
  ICreateDisciplinaInput,
  ICreateMatrizInput,
  ICreateTurmaInput,
  IListCursosQuery,
  IListMatrizesQuery,
  IListTurmasQuery,
  IUpdateCampusInput,
  IUpdateComponenteMatrizInput,
  IUpdateCursoInput,
  IUpdateDisciplinaInput,
  IUpdateMatrizInput,
  IUpdateTurmaInput,
} from "./academic-schemas.js";

const isKnownRequestError = (error: unknown): error is Prisma.PrismaClientKnownRequestError => {
  return error instanceof Prisma.PrismaClientKnownRequestError;
};

const runOrNull = async <T>(operation: () => Promise<T>) => {
  try {
    return await operation();
  } catch (error) {
    if (isKnownRequestError(error) && error.code === "P2025") {
      return null;
    }

    throw error;
  }
};

const campusSelect = {
  id: true,
  nome: true,
  codigoPolo: true,
  cidade: true,
  estado: true,
  endereco: true,
} as const;

const cursoSelect = {
  id: true,
  campusId: true,
  nome: true,
  codigoMec: true,
  modalidade: true,
  duracaoSemestres: true,
} as const;

const disciplinaSelect = {
  id: true,
  nome: true,
  codigo: true,
} as const;

const matrizSelect = {
  id: true,
  cursoId: true,
  nome: true,
  anoVigencia: true,
  ativo: true,
} as const;

const componenteSelect = {
  id: true,
  matrizCurricularId: true,
  disciplinaId: true,
  semestreIdeal: true,
  tipo: true,
  tipoEntrega: true,
  chTotal: true,
  chPresencial: true,
  chSincrona: true,
  chAssincrona: true,
  chExtensao: true,
  disciplina: {select: disciplinaSelect},
} as const;

const turmaPublicSelect = {
  id: true,
  campusId: true,
  disciplinaId: true,
  professorId: true,
  codigo: true,
  anoLetivo: true,
  semestreLetivo: true,
  capacidade: true,
  horario: true,
  salaOuLink: true,
  tipoEntrega: true,
  disciplina: {select: disciplinaSelect},
  professor: {
    select: {
      id: true,
      matricula: true,
      titulacao: true,
      user: {select: {id: true, nome: true, email: true}},
    },
  },
} as const;

export const listCampi = async () => {
  return prisma.campus.findMany({
    select: campusSelect,
    orderBy: {nome: "asc"},
  });
};

export const findCampusById = async (id: string) => {
  return prisma.campus.findUnique({
    where: {id},
    select: campusSelect,
  });
};

export const insertCampus = async (data: ICreateCampusInput) => {
  return prisma.campus.create({
    data,
    select: campusSelect,
  });
};

export const updateCampusById = async ({id, data}: {id: string; data: IUpdateCampusInput}) => {
  return runOrNull(() => prisma.campus.update({where: {id}, data, select: campusSelect}));
};

export const countMatriculasByCampus = async (campusId: string) => {
  return prisma.matricula.count({
    where: {curso: {campusId}},
  });
};

export const deleteCampusById = async (id: string) => {
  return runOrNull(() => prisma.campus.delete({where: {id}, select: {id: true}}));
};

export const listCursos = async ({campusId}: IListCursosQuery) => {
  return prisma.curso.findMany({
    where: campusId ? {campusId} : undefined,
    select: cursoSelect,
    orderBy: {nome: "asc"},
  });
};

export const findCursoById = async (id: string) => {
  return prisma.curso.findUnique({
    where: {id},
    select: cursoSelect,
  });
};

export const insertCurso = async (data: ICreateCursoInput) => {
  return prisma.curso.create({
    data,
    select: cursoSelect,
  });
};

export const updateCursoById = async ({id, data}: {id: string; data: IUpdateCursoInput}) => {
  return runOrNull(() => prisma.curso.update({where: {id}, data, select: cursoSelect}));
};

export const countMatriculasByCurso = async (cursoId: string) => {
  return prisma.matricula.count({where: {cursoId}});
};

export const deleteCursoById = async (id: string) => {
  return runOrNull(() => prisma.curso.delete({where: {id}, select: {id: true}}));
};

export const listDisciplinas = async () => {
  return prisma.disciplina.findMany({
    select: disciplinaSelect,
    orderBy: {nome: "asc"},
  });
};

export const findDisciplinaById = async (id: string) => {
  return prisma.disciplina.findUnique({
    where: {id},
    select: disciplinaSelect,
  });
};

export const insertDisciplina = async (data: ICreateDisciplinaInput) => {
  return prisma.disciplina.create({
    data,
    select: disciplinaSelect,
  });
};

export const updateDisciplinaById = async ({id, data}: {id: string; data: IUpdateDisciplinaInput}) => {
  return runOrNull(() => prisma.disciplina.update({where: {id}, data, select: disciplinaSelect}));
};

export const countTurmasByDisciplina = async (disciplinaId: string) => {
  return prisma.turma.count({where: {disciplinaId}});
};

export const deleteDisciplinaById = async (id: string) => {
  return runOrNull(() => prisma.disciplina.delete({where: {id}, select: {id: true}}));
};

export const insertMatriz = async (data: ICreateMatrizInput) => {
  return prisma.matrizCurricular.create({
    data,
    select: matrizSelect,
  });
};

export const listMatrizes = async ({cursoId}: IListMatrizesQuery) => {
  return prisma.matrizCurricular.findMany({
    where: cursoId ? {cursoId} : undefined,
    select: matrizSelect,
    orderBy: [{anoVigencia: "desc"}, {nome: "asc"}],
  });
};

export const findMatrizById = async (id: string) => {
  return prisma.matrizCurricular.findUnique({
    where: {id},
    select: {
      ...matrizSelect,
      curso: {select: {id: true, nome: true, modalidade: true}},
      componentes: {
        select: {
          id: true,
          disciplinaId: true,
          semestreIdeal: true,
          tipo: true,
          tipoEntrega: true,
          chTotal: true,
          disciplina: {select: disciplinaSelect},
        },
        orderBy: [{semestreIdeal: "asc"}, {disciplina: {nome: "asc"}}],
      },
    },
  });
};

export const updateMatrizById = async ({id, data}: {id: string; data: IUpdateMatrizInput}) => {
  return runOrNull(() => prisma.matrizCurricular.update({where: {id}, data, select: matrizSelect}));
};

export const countMatriculasByMatriz = async (matrizCurricularId: string) => {
  return prisma.matricula.count({where: {matrizCurricularId}});
};

export const deleteMatrizById = async (id: string) => {
  return runOrNull(() => prisma.matrizCurricular.delete({where: {id}, select: {id: true}}));
};

export const insertMatrizComponente = async (data: IAddComponenteMatrizInput) => {
  return prisma.matrizComponente.create({
    data,
    select: componenteSelect,
  });
};

export const listComponentesByMatriz = async (matrizCurricularId: string) => {
  return prisma.matrizComponente.findMany({
    where: {matrizCurricularId},
    select: componenteSelect,
    orderBy: [{semestreIdeal: "asc"}, {disciplina: {nome: "asc"}}],
  });
};

export const findComponenteById = async (id: string) => {
  return prisma.matrizComponente.findUnique({
    where: {id},
    select: componenteSelect,
  });
};

export const updateComponenteById = async ({id, data}: {id: string; data: IUpdateComponenteMatrizInput}) => {
  return runOrNull(() => prisma.matrizComponente.update({where: {id}, data, select: componenteSelect}));
};

export const deleteComponenteById = async (id: string) => {
  return runOrNull(() => prisma.matrizComponente.delete({where: {id}, select: {id: true}}));
};

export const findMatrizWithComponentes = async ({matrizCurricularId}: {matrizCurricularId: string}) => {
  return prisma.matrizCurricular.findUnique({
    where: {id: matrizCurricularId},
    select: {
      id: true,
      nome: true,
      curso: {
        select: {
          nome: true,
          campus: {select: {id: true, nome: true, codigoPolo: true}},
        },
      },
      componentes: {
        select: {
          chTotal: true,
          chExtensao: true,
          chPresencial: true,
          chSincrona: true,
        },
      },
    },
  });
};

export const findProfessorById = async (id: string) => {
  return prisma.professor.findUnique({
    where: {id},
    select: {id: true},
  });
};

export const insertTurma = async (data: ICreateTurmaInput) => {
  return prisma.turma.create({
    data,
    select: turmaPublicSelect,
  });
};

export const listTurmas = async ({campusId, anoLetivo, semestreLetivo}: IListTurmasQuery) => {
  return prisma.turma.findMany({
    where: {
      ...(campusId ? {campusId} : {}),
      ...(anoLetivo !== undefined ? {anoLetivo} : {}),
      ...(semestreLetivo !== undefined ? {semestreLetivo} : {}),
    },
    select: {
      ...turmaPublicSelect,
      _count: {select: {diarios: true}},
    },
    orderBy: [{anoLetivo: "desc"}, {semestreLetivo: "desc"}, {codigo: "asc"}],
  });
};

export const findTurmaById = async (id: string) => {
  return prisma.turma.findUnique({
    where: {id},
    select: turmaPublicSelect,
  });
};

export const updateTurmaById = async ({id, data}: {id: string; data: IUpdateTurmaInput}) => {
  return runOrNull(() => prisma.turma.update({where: {id}, data, select: turmaPublicSelect}));
};

export const deleteTurmaById = async (id: string) => {
  return runOrNull(() => prisma.turma.delete({where: {id}, select: {id: true}}));
};
