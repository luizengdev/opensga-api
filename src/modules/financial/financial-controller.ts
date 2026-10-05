import {FastifyReply, FastifyRequest} from "fastify";
import Stripe from "stripe";

import {constructStripeWebhookEvent} from "../../lib/stripe.js";
import type {
  ICreateCheckoutInput,
  ICreateFaturaInput,
  ICreatePublicInscricaoInput,
  ICreatePrecoCursoInput,
  IListFaturasQuery,
  IListPrecosQuery,
  IUpdateFaturaStatusInput,
  IUpdatePrecoCursoInput,
} from "./financial-schemas.js";
import {
  changeFaturaStatus,
  changePrecoCurso,
  createEnrollmentCheckout,
  createPublicInscricaoCheckout,
  createNewFatura,
  fetchCatalogoCursos,
  createNewPrecoCurso,
  fetchFaturaById,
  fetchFaturas,
  fetchPrecoCursoById,
  fetchPrecosCurso,
  FinancialError,
  processStripeWebhookEvent,
  removeFatura,
  removePrecoCurso,
} from "./financial-service.js";

const replyWithFinancialError = (error: unknown, reply: FastifyReply, fallback: string) => {
  if (error instanceof FinancialError) {
    return reply.status(error.statusCode).send({error: error.message});
  }

  const message = error instanceof Error ? error.message : fallback;
  return reply.status(400).send({error: message});
};

export const listFaturasHandler = async (
  request: FastifyRequest<{Querystring: IListFaturasQuery}>,
  reply: FastifyReply,
) => {
  const faturas = await fetchFaturas(request.query);
  return reply.status(200).send(faturas);
};

export const getFaturaHandler = async (request: FastifyRequest<{Params: {id: string}}>, reply: FastifyReply) => {
  try {
    const fatura = await fetchFaturaById(request.params.id);
    return reply.status(200).send(fatura);
  } catch (error) {
    return replyWithFinancialError(error, reply, "Erro ao buscar fatura.");
  }
};

export const createFaturaHandler = async (request: FastifyRequest<{Body: ICreateFaturaInput}>, reply: FastifyReply) => {
  try {
    const fatura = await createNewFatura(request.body);
    return reply.status(201).send(fatura);
  } catch (error) {
    return replyWithFinancialError(error, reply, "Erro ao criar fatura.");
  }
};

export const updateFaturaStatusHandler = async (
  request: FastifyRequest<{Params: {id: string}; Body: IUpdateFaturaStatusInput}>,
  reply: FastifyReply,
) => {
  try {
    const fatura = await changeFaturaStatus({id: request.params.id, data: request.body});
    return reply.status(200).send(fatura);
  } catch (error) {
    return replyWithFinancialError(error, reply, "Erro ao atualizar status da fatura.");
  }
};

export const deleteFaturaHandler = async (request: FastifyRequest<{Params: {id: string}}>, reply: FastifyReply) => {
  try {
    const fatura = await removeFatura(request.params.id);
    return reply.status(200).send(fatura);
  } catch (error) {
    return replyWithFinancialError(error, reply, "Erro ao excluir fatura.");
  }
};

export const createCheckoutHandler = async (
  request: FastifyRequest<{Body: ICreateCheckoutInput}>,
  reply: FastifyReply,
) => {
  try {
    const checkout = await createEnrollmentCheckout(request.body);
    return reply.status(200).send(checkout);
  } catch (error) {
    return replyWithFinancialError(error, reply, "Erro ao criar sessão de checkout.");
  }
};

export const listCatalogoCursosHandler = async (_request: FastifyRequest, reply: FastifyReply) => {
  const catalogo = await fetchCatalogoCursos();
  return reply.status(200).send(catalogo);
};

export const createPublicInscricaoHandler = async (
  request: FastifyRequest<{Body: ICreatePublicInscricaoInput}>,
  reply: FastifyReply,
) => {
  try {
    const checkout = await createPublicInscricaoCheckout(request.body);
    return reply.status(200).send(checkout);
  } catch (error) {
    return replyWithFinancialError(error, reply, "Erro ao criar inscrição e checkout.");
  }
};

export const stripeWebhookHandler = async (request: FastifyRequest<{Body: Buffer}>, reply: FastifyReply) => {
  const signature = request.headers["stripe-signature"];

  if (typeof signature !== "string") {
    return reply.status(400).send({error: "Assinatura Stripe ausente."});
  }

  if (!Buffer.isBuffer(request.body)) {
    return reply.status(400).send({error: "Payload do webhook deve ser recebido em formato raw."});
  }

  try {
    const event = constructStripeWebhookEvent(request.body, signature);
    await processStripeWebhookEvent(event);
    return reply.status(200).send({received: true});
  } catch (error) {
    if (error instanceof Stripe.errors.StripeSignatureVerificationError) {
      return reply.status(400).send({error: "Assinatura do webhook inválida."});
    }

    request.log.error(error);
    return reply.status(500).send({error: "Erro ao processar webhook Stripe."});
  }
};
export const listPrecosCursoHandler = async (
  request: FastifyRequest<{Querystring: IListPrecosQuery}>,
  reply: FastifyReply,
) => {
  const precos = await fetchPrecosCurso(request.query);
  return reply.status(200).send(precos);
};

export const getPrecoCursoHandler = async (request: FastifyRequest<{Params: {id: string}}>, reply: FastifyReply) => {
  try {
    const preco = await fetchPrecoCursoById(request.params.id);
    return reply.status(200).send(preco);
  } catch (error) {
    return replyWithFinancialError(error, reply, "Erro ao buscar preço do curso.");
  }
};

export const createPrecoCursoHandler = async (
  request: FastifyRequest<{Body: ICreatePrecoCursoInput}>,
  reply: FastifyReply,
) => {
  try {
    const preco = await createNewPrecoCurso(request.body);
    return reply.status(201).send(preco);
  } catch (error) {
    return replyWithFinancialError(error, reply, "Erro ao cadastrar preço do curso.");
  }
};

export const updatePrecoCursoHandler = async (
  request: FastifyRequest<{Params: {id: string}; Body: IUpdatePrecoCursoInput}>,
  reply: FastifyReply,
) => {
  try {
    const preco = await changePrecoCurso({id: request.params.id, data: request.body});
    return reply.status(200).send(preco);
  } catch (error) {
    return replyWithFinancialError(error, reply, "Erro ao atualizar preço do curso.");
  }
};

export const deletePrecoCursoHandler = async (request: FastifyRequest<{Params: {id: string}}>, reply: FastifyReply) => {
  try {
    const preco = await removePrecoCurso(request.params.id);
    return reply.status(200).send(preco);
  } catch (error) {
    return replyWithFinancialError(error, reply, "Erro ao excluir preço do curso.");
  }
};
