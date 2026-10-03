import {Role, StatusReclamacao, TipoReclamacao} from "../../generated/prisma/enums.js";
import {dayjs} from "../../lib/dayjs.js";
import {
  deleteComunicadoById,
  deleteReclamacaoById,
  findComunicadoById,
  findReclamacaoById,
  findUserById,
  insertComunicado,
  insertReclamacao,
  listComunicados,
  listReclamacoes,
  updateComunicadoById,
  updateReclamacaoById,
} from "./communications-repository.js";
import type {
  ICreateComunicadoInput,
  ICreateReclamacaoInput,
  IListComunicadosQuery,
  IListReclamacoesQuery,
  IResponderReclamacaoInput,
  IUpdateComunicadoInput,
} from "./communications-schemas.js";

export class CommunicationsError extends Error {
  readonly statusCode: 400 | 404;

  constructor(message: string, statusCode: 400 | 404) {
    super(message);
    this.name = "CommunicationsError";
    this.statusCode = statusCode;
  }
}

const mapComunicado = (comunicado: {
  id: string;
  titulo: string;
  conteudo: string;
  publicoAlvo: Role[];
  criadoEm: Date;
}) => {
  return {
    ...comunicado,
    criadoEm: dayjs(comunicado.criadoEm).toISOString(),
  };
};

const mapReclamacao = (reclamacao: {
  id: string;
  usuarioId: string;
  assunto: string;
  tipo: TipoReclamacao;
  descricao: string;
  resposta: string | null;
  status: StatusReclamacao;
  criadoEm: Date;
  usuario: {id: string; nome: string; email: string; role: Role};
}) => {
  return {
    ...reclamacao,
    criadoEm: dayjs(reclamacao.criadoEm).toISOString(),
  };
};

export const fetchComunicados = async (query: IListComunicadosQuery) => {
  const comunicados = await listComunicados(query);
  return comunicados.map(mapComunicado);
};

export const fetchComunicadoById = async (id: string) => {
  const comunicado = await findComunicadoById(id);

  if (!comunicado) {
    throw new CommunicationsError("Comunicado não encontrado.", 404);
  }

  return mapComunicado(comunicado);
};

export const createNewComunicado = async (input: ICreateComunicadoInput) => {
  const comunicado = await insertComunicado(input);
  return mapComunicado(comunicado);
};

export const changeComunicado = async ({id, data}: {id: string; data: IUpdateComunicadoInput}) => {
  const comunicado = await updateComunicadoById({id, data});

  if (!comunicado) {
    throw new CommunicationsError("Comunicado não encontrado.", 404);
  }

  return mapComunicado(comunicado);
};

export const removeComunicado = async (id: string) => {
  const deleted = await deleteComunicadoById(id);

  if (!deleted) {
    throw new CommunicationsError("Comunicado não encontrado.", 404);
  }

  return deleted;
};

export const fetchReclamacoes = async (query: IListReclamacoesQuery) => {
  const reclamacoes = await listReclamacoes(query);
  return reclamacoes.map(mapReclamacao);
};

export const fetchReclamacaoById = async (id: string) => {
  const reclamacao = await findReclamacaoById(id);

  if (!reclamacao) {
    throw new CommunicationsError("Reclamação não encontrada.", 404);
  }

  return mapReclamacao(reclamacao);
};

export const createNewReclamacao = async (input: ICreateReclamacaoInput) => {
  const usuario = await findUserById(input.usuarioId);

  if (!usuario) {
    throw new CommunicationsError("Usuário informado não existe.", 404);
  }

  const reclamacao = await insertReclamacao(input);
  return mapReclamacao(reclamacao);
};

export const respondToReclamacao = async ({id, data}: {id: string; data: IResponderReclamacaoInput}) => {
  const reclamacao = await updateReclamacaoById({
    id,
    resposta: data.resposta,
    status: StatusReclamacao.RESPONDIDO,
  });

  if (!reclamacao) {
    throw new CommunicationsError("Reclamação não encontrada.", 404);
  }

  return mapReclamacao(reclamacao);
};

export const closeReclamacao = async (id: string) => {
  const current = await findReclamacaoById(id);

  if (!current) {
    throw new CommunicationsError("Reclamação não encontrada.", 404);
  }

  const reclamacao = await updateReclamacaoById({
    id,
    status: StatusReclamacao.FECHADO,
  });

  if (!reclamacao) {
    throw new CommunicationsError("Reclamação não encontrada.", 404);
  }

  return mapReclamacao(reclamacao);
};

export const removeReclamacao = async (id: string) => {
  const deleted = await deleteReclamacaoById(id);

  if (!deleted) {
    throw new CommunicationsError("Reclamação não encontrada.", 404);
  }

  return deleted;
};
