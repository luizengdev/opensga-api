import crypto from "node:crypto";

import {Role, StatusDisciplina, StatusFatura, StatusMatricula, TipoDocumento} from "../../generated/prisma/enums.js";
import {dayjs} from "../../lib/dayjs.js";
import {findPortalActor} from "../portal/portal-repository.js";
import {
  findAlunoParaEmissao,
  findModeloDocumentoAtivoByTipo,
  findModeloDocumentoById,
  insertEmissaoDocumento,
  listModelosDocumento,
  listModelosDocumentoAtivos,
  updateModeloDocumentoById,
} from "./documents-repository.js";
import type {IEmitirDocumentoInput, IUpdateModeloDocumentoInput} from "./documents-schemas.js";

export class DocumentsError extends Error {
  readonly statusCode: 400 | 403 | 404 | 409;

  constructor(message: string, statusCode: 400 | 403 | 404 | 409) {
    super(message);
    this.name = "DocumentsError";
    this.statusCode = statusCode;
  }
}

const MESES = [
  "janeiro",
  "fevereiro",
  "março",
  "abril",
  "maio",
  "junho",
  "julho",
  "agosto",
  "setembro",
  "outubro",
  "novembro",
  "dezembro",
] as const;

const PLACEHOLDER = /\{\{\s*([a-zA-Z.]+)\s*\}\}/g;

const formatDataEmissao = (valor: ReturnType<typeof dayjs>) => {
  return `${valor.format("DD")} de ${MESES[valor.month()]} de ${valor.format("YYYY")}`;
};

const escaparHtml = (valor: string) => {
  return valor
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
};

const interpolateCorpo = (corpo: string, valores: Record<string, string>) => {
  const ehHtml = /<[a-z][\s\S]*>/i.test(corpo);

  return corpo.replace(PLACEHOLDER, (_match, chave: string) => {
    const valor = valores[chave] ?? "";
    return ehHtml ? escaparHtml(valor) : valor;
  });
};

const decimalToNumber = (value: unknown) => {
  if (value === null || value === undefined) {
    return null;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
};

export const fetchModelosDocumento = async () => {
  return listModelosDocumento();
};

export const fetchCatalogoPortalDocumentos = async () => {
  return listModelosDocumentoAtivos();
};

export const changeModeloDocumento = async ({
  id,
  data,
}: {
  id: string;
  data: IUpdateModeloDocumentoInput;
}) => {
  if (Object.keys(data).length === 0) {
    throw new DocumentsError("Informe ao menos um campo para atualizar.", 400);
  }

  const atual = await findModeloDocumentoById(id);

  if (!atual) {
    throw new DocumentsError("Modelo de documento não encontrado.", 404);
  }

  const atualizado = await updateModeloDocumentoById({id, data});

  if (!atualizado) {
    throw new DocumentsError("Modelo de documento não encontrado.", 404);
  }

  return atualizado;
};

const resolveAlvoAlunoId = ({
  actor,
  alunoId,
}: {
  actor: NonNullable<Awaited<ReturnType<typeof findPortalActor>>>;
  alunoId?: string;
}) => {
  if (actor.role === Role.ALUNO) {
    if (!actor.aluno) {
      return null;
    }

    if (alunoId !== undefined && alunoId !== actor.aluno.id) {
      throw new DocumentsError("Você só pode emitir documentos do próprio vínculo acadêmico.", 403);
    }

    return actor.aluno.id;
  }

  const dependentes = actor.responsavel?.alunos ?? [];

  if (dependentes.length === 0) {
    return null;
  }

  if (alunoId === undefined) {
    return dependentes[0].id;
  }

  const autorizado = dependentes.some((dependente) => dependente.id === alunoId);

  if (!autorizado) {
    throw new DocumentsError("Este dependente não está vinculado à sua guarda.", 403);
  }

  return alunoId;
};

const escolherMatricula = <T extends {status: StatusMatricula}>(matriculas: T[]) => {
  return matriculas.find((item) => item.status === StatusMatricula.ATIVO) ?? matriculas[0] ?? null;
};

export const emitirDocumentoPortal = async ({
  actorUserId,
  input,
}: {
  actorUserId: string;
  input: IEmitirDocumentoInput;
}) => {
  const actor = await findPortalActor({userId: actorUserId});

  if (!actor) {
    throw new DocumentsError("Usuário não encontrado.", 404);
  }

  const alunoId = resolveAlvoAlunoId({actor, alunoId: input.alunoId});

  if (!alunoId) {
    throw new DocumentsError("Não há aluno para emitir o documento.", 400);
  }

  const modelo = await findModeloDocumentoAtivoByTipo(input.tipo);

  if (!modelo) {
    throw new DocumentsError("Este documento não está disponível para emissão.", 404);
  }

  const aluno = await findAlunoParaEmissao(alunoId);

  if (!aluno) {
    throw new DocumentsError("Aluno não encontrado.", 404);
  }

  const matricula = escolherMatricula(aluno.matriculas);

  if (!matricula) {
    throw new DocumentsError("Não há matrícula apta para emitir este documento.", 400);
  }

  if (
    (input.tipo === TipoDocumento.DECLARACAO_MATRICULA || input.tipo === TipoDocumento.CARTEIRINHA_ESTUDANTIL) &&
    matricula.status !== StatusMatricula.ATIVO
  ) {
    throw new DocumentsError("A declaração e a carteirinha exigem matrícula ativa.", 400);
  }

  if (input.tipo === TipoDocumento.QUITACAO_FINANCEIRA) {
    const inadimplente = aluno.faturas.some((fatura) => fatura.status === StatusFatura.ATRASADA);

    if (inadimplente) {
      throw new DocumentsError("Regularize as faturas em atraso antes de emitir a quitação financeira.", 409);
    }
  }

  const componentes = matricula.matrizCurricular.componentes;
  const chTotalCurso = componentes.reduce((total, componente) => total + componente.chTotal, 0);
  const chIntegralizada = matricula.diarios
    .filter((diario) => diario.statusDisciplina === StatusDisciplina.APROVADO)
    .reduce((total, diario) => total + diario.chCumprida, 0);

  const agora = dayjs();
  const dataEmissao = formatDataEmissao(agora);
  const codigoAutenticacao = `AUT-${aluno.ra.replaceAll(/\D/g, "").slice(-8)}-${crypto.randomInt(100000, 1_000_000)}`;

  await insertEmissaoDocumento({
    modeloId: modelo.id,
    alunoId: aluno.id,
    matriculaId: matricula.id,
    codigo: codigoAutenticacao,
  });

  const valores = {
    "aluno.nome": aluno.user.nome,
    "aluno.cpf": aluno.user.cpf,
    "aluno.ra": aluno.ra,
    "curso.nome": matricula.curso.nome,
    "curso.modalidade": matricula.curso.modalidade,
    "campus.nome": matricula.curso.campus.nome,
    "campus.codigoPolo": matricula.curso.campus.codigoPolo,
    periodoAtual: String(matricula.periodoAtual),
    semestreIngresso: matricula.semestreIngresso,
    dataEmissao,
    codigoAutenticacao,
    chIntegralizada: String(chIntegralizada),
    chTotalCurso: String(chTotalCurso),
  };

  const diariosPorDisciplina = new Map(
    matricula.diarios.map((diario) => [diario.turma.disciplina.id, diario] as const),
  );

  return {
    tipo: modelo.tipo,
    titulo: modelo.titulo,
    corpo: interpolateCorpo(modelo.corpo, valores),
    codigoAutenticacao,
    emitidoEm: agora.toISOString(),
    aluno: {
      nome: aluno.user.nome,
      cpf: aluno.user.cpf,
      ra: aluno.ra,
      avatarUrl: aluno.user.avatarUrl,
    },
    curso: {
      nome: matricula.curso.nome,
      modalidade: matricula.curso.modalidade,
      campusNome: matricula.curso.campus.nome,
      codigoPolo: matricula.curso.campus.codigoPolo,
    },
    periodoAtual: matricula.periodoAtual,
    semestreIngresso: matricula.semestreIngresso,
    chIntegralizada,
    chTotalCurso,
    disciplinas: matricula.diarios.map((diario) => ({
      codigo: diario.turma.disciplina.codigo,
      nome: diario.turma.disciplina.nome,
      chTotal:
        componentes.find((componente) => componente.disciplina.id === diario.turma.disciplina.id)?.chTotal ?? 0,
      tipoEntrega: diario.turma.tipoEntrega,
    })),
    matriz: componentes.map((componente) => {
      const diario = diariosPorDisciplina.get(componente.disciplina.id);
      const notaFinal = diario ? decimalToNumber(diario.mediaFinal) ?? decimalToNumber(diario.notaSemestral) : null;

      return {
        semestreIdeal: componente.semestreIdeal,
        codigo: componente.disciplina.codigo,
        nome: componente.disciplina.nome,
        tipo: componente.tipo,
        chTotal: componente.chTotal,
        notaFinal: diario?.semestreFechado ? notaFinal : null,
        statusDisciplina: diario?.statusDisciplina ?? null,
      };
    }),
  };
};
