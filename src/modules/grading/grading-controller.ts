import {FastifyReply, FastifyRequest} from "fastify";

import type {IEnrollInTurmaInput, IUpdateGradesInput} from "./grading-schemas.js";
import {calculateAndSaveGrades, enrollStudentInClass, GradingError} from "./grading-service.js";

const replyWithGradingError = (error: unknown, reply: FastifyReply, fallback: string) => {
  if (error instanceof GradingError) {
    return reply.status(error.statusCode).send({error: error.message});
  }

  const message = error instanceof Error ? error.message : fallback;
  return reply.status(400).send({error: message});
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
