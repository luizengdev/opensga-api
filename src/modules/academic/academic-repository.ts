import {prisma} from "../../lib/db.js";
import type {IAddComponenteMatrizInput, ICreateMatrizInput, ICreateTurmaInput} from "./academic-schemas.js";

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
  disciplina: {select: {id: true, nome: true, codigo: true}},
  professor: {
    select: {
      id: true,
      matricula: true,
      titulacao: true,
      user: {select: {id: true, nome: true, email: true}},
    },
  },
} as const;

export const insertMatriz = async (data: ICreateMatrizInput) => {
  return prisma.matrizCurricular.create({
    data,
    select: {
      id: true,
      cursoId: true,
      nome: true,
      anoVigencia: true,
      ativo: true,
    },
  });
};

export const insertMatrizComponente = async (data: IAddComponenteMatrizInput) => {
  return prisma.matrizComponente.create({
    data,
    select: {
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
      disciplina: {select: {id: true, nome: true, codigo: true}},
    },
  });
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

export const insertTurma = async (data: ICreateTurmaInput) => {
  return prisma.turma.create({
    data,
    select: turmaPublicSelect,
  });
};

export const listTurmasByCampusAndPeriod = async ({
  campusId,
  anoLetivo,
  semestreLetivo,
}: {
  campusId: string;
  anoLetivo: number;
  semestreLetivo: number;
}) => {
  return prisma.turma.findMany({
    where: {campusId, anoLetivo, semestreLetivo},
    select: {
      ...turmaPublicSelect,
      _count: {select: {diarios: true}},
    },
  });
};
