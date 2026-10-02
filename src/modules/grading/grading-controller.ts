import {FastifyReply, FastifyRequest} from "fastify";

import type {IEnrollInTurmaInput, IListDiariosQuery, IUpdateGradesInput} from "./grading-schemas.js";
import {
  calculateAndSaveGrades,
  enrollStudentInClass,
  fetchDiarioById,
  fetchDiarios,
  GradingError,
  unenrollStudentFromClass,
} from "./grading-service.js";

const replyWithGradingError = (error: unknown, reply: FastifyReply, fallback: string) => {
  if (error instanceof GradingError) {
    return reply.status(error.statusCode).send({error: error.message});
  }

  const message = error instanceof Error ? error.message : fallback;
  return reply.status(400).send({error: message});
};

export const listDiariosHandler = async (
  request: FastifyRequest<{Querystring: IListDiariosQuery}>,
  reply: FastifyReply,
) => {
  const diarios = await fetchDiarios(request.query);
  return reply.status(200).send(diarios);
};

export const getDiarioHandler = async (request: FastifyRequest<{Params: {id: string}}>, reply: FastifyReply) => {
  try {
    const diario = await fetchDiarioById(request.params.id);
    return reply.status(200).send(diario);
  } catch (error) {
    return replyWithGradingError(error, reply, "Erro ao buscar diário.");
  }
};

export const deleteDiarioHandler = async (request: FastifyRequest<{Params: {id: string}}>, reply: FastifyReply) => {
  try {
    const diario = await unenrollStudentFromClass(request.params.id);
    return reply.status(200).send(diario);
  } catch (error) {
    return replyWithGradingError(error, reply, "Erro ao desenturmar aluno.");
  }
};

export const enrollInTurmaHandler = async (
  request: FastifyRequest<{Body: IEnrollInTurmaInput}>,
  reply: FastifyReply,
) => {
  try {
    const diario = await enrollStudentInClass(request.body);
    return reply.status(201).send(diario);
  } catch (error) {
    return replyWithGradingError(error, reply, "Erro ao enturmar aluno.");
  }
};

export const updateGradesHandler = async (request: FastifyRequest<{Body: IUpdateGradesInput}>, reply: FastifyReply) => {
  try {
    const diarioAtualizado = await calculateAndSaveGrades({
      ...request.body,
      actorUserId: request.user.sub,
      actorRole: request.user.role,
    });
    return reply.status(200).send(diarioAtualizado);
  } catch (error) {
    return replyWithGradingError(error, reply, "Erro ao lançar avaliações.");
  }
};
