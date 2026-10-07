import {Prisma} from "../../generated/prisma/client.js";
import {Role, StatusDisciplina} from "../../generated/prisma/enums.js";
import {prisma} from "../../lib/db.js";
import type {ICreatePortalReclamacaoInput} from "./portal-schemas.js";

export const findPortalActor = async ({userId}: {userId: string}) => {
  return prisma.user.findUnique({
    where: {id: userId},
    select: {
      id: true,
      nome: true,
      email: true,
      cpf: true,
      role: true,
      avatarUrl: true,
      ativo: true,
      aluno: {select: {id: true, ra: true}},
      professor: {select: {id: true, matricula: true, titulacao: true}},
      responsavel: {
        select: {
          alunos: {
            select: {
              id: true,
              ra: true,
              user: {select: {nome: true, avatarUrl: true}},
              matriculas: {
                take: 1,
                orderBy: {criadoEm: "desc"},
                select: {
                  status: true,
                  periodoAtual: true,
                  curso: {select: {nome: true}},
                },
              },
            },
          },
        },
      },
    },
  });
};

export const findLatestMatriculaByAlunoId = async ({alunoId}: {alunoId: string}) => {
  return prisma.matricula.findFirst({
    where: {alunoId},
    orderBy: {criadoEm: "desc"},
    select: {
      id: true,
      status: true,
      periodoAtual: true,
      semestreIngresso: true,
      aluno: {select: {ra: true}},
      curso: {
        select: {
          id: true,
          nome: true,
          modalidade: true,
          campus: {select: {nome: true, codigoPolo: true}},
        },
      },
      matrizCurricular: {
        select: {
          id: true,
          nome: true,
          anoVigencia: true,
          componentes: {
            select: {
              id: true,
              semestreIdeal: true,
              tipo: true,
              chTotal: true,
              disciplina: {select: {id: true, nome: true, codigo: true}},
            },
            orderBy: [{semestreIdeal: "asc"}, {disciplina: {nome: "asc"}}],
          },
        },
      },
    },
  });
};

export const listDiariosByMatriculaId = async ({matriculaId}: {matriculaId: string}) => {
  return prisma.diarioClasse.findMany({
    where: {matriculaId},
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
      turma: {
        select: {
          codigo: true,
          horario: true,
          salaOuLink: true,
          tipoEntrega: true,
          anoLetivo: true,
          semestreLetivo: true,
          disciplina: {select: {id: true, nome: true, codigo: true}},
          professor: {select: {user: {select: {nome: true}}}},
        },
      },
    },
    orderBy: {turma: {codigo: "asc"}},
  });
};

export const listFaturasByAlunoId = async ({alunoId}: {alunoId: string}) => {
  return prisma.fatura.findMany({
    where: {alunoId},
    select: {
      id: true,
      descricao: true,
      valor: true,
      dataVencimento: true,
      status: true,
      stripePaymentUrl: true,
      pagoEm: true,
    },
    orderBy: {dataVencimento: "desc"},
  });
};

export const listComunicadosForRole = async ({role}: {role: Role}) => {
  return prisma.comunicado.findMany({
    where: {publicoAlvo: {has: role}},
    select: {
      id: true,
      titulo: true,
      conteudo: true,
      publicoAlvo: true,
      criadoEm: true,
    },
    orderBy: {criadoEm: "desc"},
  });
};

export const listReclamacoesByUsuarioId = async ({usuarioId}: {usuarioId: string}) => {
  return prisma.reclamacao.findMany({
    where: {usuarioId},
    select: {
      id: true,
      assunto: true,
      tipo: true,
      descricao: true,
      resposta: true,
      status: true,
      criadoEm: true,
    },
    orderBy: {criadoEm: "desc"},
  });
};

export const insertPortalReclamacao = async ({
  usuarioId,
  data,
}: {
  usuarioId: string;
  data: ICreatePortalReclamacaoInput;
}) => {
  return prisma.reclamacao.create({
    data: {
      usuarioId,
      assunto: data.assunto,
      tipo: data.tipo,
      descricao: data.descricao,
    },
    select: {
      id: true,
      assunto: true,
      tipo: true,
      descricao: true,
      resposta: true,
      status: true,
      criadoEm: true,
    },
  });
};

export const chTotalDoComponente = ({
  componentes,
  disciplinaId,
}: {
  componentes: Array<{disciplinaId?: string; disciplina?: {id: string}; chTotal: number}>;
  disciplinaId: string;
}) => {
  const encontrado = componentes.find((componente) => {
    if (componente.disciplinaId !== undefined) {
      return componente.disciplinaId === disciplinaId;
    }

    return componente.disciplina?.id === disciplinaId;
  });

  return encontrado?.chTotal ?? 0;
};

export const somaChAprovada = (diarios: Array<{statusDisciplina: StatusDisciplina; chCumprida: number}>) => {
  return diarios
    .filter((diario) => diario.statusDisciplina === StatusDisciplina.APROVADO)
    .reduce((total, diario) => total + diario.chCumprida, 0);
};

export const decimalToNumber = (value: Prisma.Decimal | null) => {
  if (value === null) {
    return null;
  }

  return Number(value);
};
