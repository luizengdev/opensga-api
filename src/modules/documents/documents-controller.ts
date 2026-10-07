import {FastifyReply, FastifyRequest} from "fastify";

import type {IEmitirDocumentoInput, IUpdateModeloDocumentoInput} from "./documents-schemas.js";
import {
  changeModeloDocumento,
  DocumentsError,
  emitirDocumentoPortal,
  fetchCatalogoPortalDocumentos,
  fetchModelosDocumento,
} from "./documents-service.js";

const replyWithDocumentsError = (error: unknown, reply: FastifyReply, fallback: string) => {
  if (error instanceof DocumentsError) {
    return reply.status(error.statusCode).send({error: error.message});
  }

  const message = error instanceof Error ? error.message : fallback;
  return reply.status(400).send({error: message});
};

export const listModelosDocumentoHandler = async (_request: FastifyRequest, reply: FastifyReply) => {
  const modelos = await fetchModelosDocumento();
  return reply.status(200).send(modelos);
};

export const updateModeloDocumentoHandler = async (
  request: FastifyRequest<{Params: {id: string}; Body: IUpdateModeloDocumentoInput}>,
  reply: FastifyReply,
) => {
  try {
    const modelo = await changeModeloDocumento({id: request.params.id, data: request.body});
    return reply.status(200).send(modelo);
  } catch (error) {
    return replyWithDocumentsError(error, reply, "Erro ao atualizar o modelo de documento.");
  }
};

export const listPortalDocumentosHandler = async (_request: FastifyRequest, reply: FastifyReply) => {
  const catalogo = await fetchCatalogoPortalDocumentos();
  return reply.status(200).send(catalogo);
};

export const emitirPortalDocumentoHandler = async (
  request: FastifyRequest<{Body: IEmitirDocumentoInput}>,
  reply: FastifyReply,
) => {
  try {
    const emissao = await emitirDocumentoPortal({
      actorUserId: request.user.sub,
      input: request.body,
    });
    return reply.status(200).send(emissao);
  } catch (error) {
    return replyWithDocumentsError(error, reply, "Erro ao emitir o documento.");
  }
};
