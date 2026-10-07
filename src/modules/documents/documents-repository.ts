import {Prisma} from "../../generated/prisma/client.js";
import {StatusMatricula, TipoDocumento} from "../../generated/prisma/enums.js";
import {prisma} from "../../lib/db.js";

const isKnownRequestError = (error: unknown): error is Prisma.PrismaClientKnownRequestError => {
  return error instanceof Prisma.PrismaClientKnownRequestError;
};

const modeloSelect = {
  id: true,
  tipo: true,
  titulo: true,
  descricao: true,
  finalidade: true,
  corpo: true,
  ativo: true,
} as const;

export const listModelosDocumento = async () => {
  return prisma.modeloDocumento.findMany({
    select: modeloSelect,
    orderBy: {titulo: "asc"},
  });
};

export const listModelosDocumentoAtivos = async () => {
  return prisma.modeloDocumento.findMany({
    where: {ativo: true},
    select: {
      id: true,
      tipo: true,
      titulo: true,
      descricao: true,
      finalidade: true,
    },
    orderBy: {titulo: "asc"},
  });
};

export const findModeloDocumentoById = async (id: string) => {
  return prisma.modeloDocumento.findUnique({
    where: {id},
    select: modeloSelect,
  });
};

export const findModeloDocumentoAtivoByTipo = async (tipo: TipoDocumento) => {
  return prisma.modeloDocumento.findFirst({
    where: {tipo, ativo: true},
    select: modeloSelect,
  });
};

export const updateModeloDocumentoById = async ({
  id,
  data,
}: {
  id: string;
  data: {
    titulo?: string;
    descricao?: string;
    finalidade?: string;
    corpo?: string;
    ativo?: boolean;
  };
}) => {
  try {
    return await prisma.modeloDocumento.update({
      where: {id},
      data,
      select: modeloSelect,
    });
  } catch (error) {
    if (isKnownRequestError(error) && error.code === "P2025") {
      return null;
    }

    throw error;
  }
};

const MATRICULAS_EMISSAO: StatusMatricula[] = [
  StatusMatricula.ATIVO,
  StatusMatricula.TRANCADO,
  StatusMatricula.FORMADO,
];

export const findAlunoParaEmissao = async (alunoId: string) => {
  return prisma.aluno.findUnique({
    where: {id: alunoId},
    select: {
      id: true,
      ra: true,
      user: {select: {nome: true, cpf: true, avatarUrl: true}},
      faturas: {select: {status: true}},
      matriculas: {
        where: {status: {in: MATRICULAS_EMISSAO}},
        orderBy: {criadoEm: "desc"},
        select: {
          id: true,
          status: true,
          periodoAtual: true,
          semestreIngresso: true,
          curso: {
            select: {
              nome: true,
              modalidade: true,
              campus: {select: {nome: true, codigoPolo: true}},
            },
          },
          matrizCurricular: {
            select: {
              componentes: {
                select: {
                  id: true,
                  semestreIdeal: true,
                  tipo: true,
                  chTotal: true,
                  disciplina: {select: {id: true, codigo: true, nome: true}},
                },
                orderBy: [{semestreIdeal: "asc" as const}, {disciplina: {nome: "asc" as const}}],
              },
            },
          },
          diarios: {
            select: {
              statusDisciplina: true,
              chCumprida: true,
              notaSemestral: true,
              mediaFinal: true,
              semestreFechado: true,
              turma: {
                select: {
                  disciplinaId: true,
                  tipoEntrega: true,
                  disciplina: {select: {id: true, codigo: true, nome: true}},
                },
              },
            },
          },
        },
      },
    },
  });
};

export const insertEmissaoDocumento = async ({
  modeloId,
  alunoId,
  matriculaId,
  codigo,
}: {
  modeloId: string;
  alunoId: string;
  matriculaId: string;
  codigo: string;
}) => {
  return prisma.emissaoDocumento.create({
    data: {modeloId, alunoId, matriculaId, codigo},
    select: {id: true, codigo: true, emitidoEm: true},
  });
};
