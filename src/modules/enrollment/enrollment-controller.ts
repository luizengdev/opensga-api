import {FastifyReply, FastifyRequest} from "fastify";

import type {ICreateEnrollmentInput, IListEnrollmentsQuery, IUpdateEnrollmentStatusInput} from "./enrollment-schemas.js";
import {
  changeEnrollmentStatus,
  EnrollmentError,
  executeEnrollment,
  fetchAllEnrollments,
  fetchEnrollmentById,
  removeEnrollment,
} from "./enrollment-service.js";

const replyWithEnrollmentError = (error: unknown, reply: FastifyReply, fallback: string) => {
  if (error instanceof EnrollmentError) {
    return reply.status(error.statusCode).send({error: error.message});
  }

  const message = error instanceof Error ? error.message : fallback;
  return reply.status(400).send({error: message});
};

export const createEnrollmentHandler = async (
  request: FastifyRequest<{Body: ICreateEnrollmentInput}>,
  reply: FastifyReply,
) => {
  try {
    const result = await executeEnrollment(request.body);
    return reply.status(201).send({
      message: "Matrícula realizada com sucesso.",
      ra: result.ra,
      matriculaId: result.matriculaId,
      matrizNome: result.matrizNome,
    });
  } catch (error) {
    return replyWithEnrollmentError(error, reply, "Erro desconhecido ao matricular.");
  }
};

export const listEnrollmentsHandler = async (
  request: FastifyRequest<{Querystring: IListEnrollmentsQuery}>,
  reply: FastifyReply,
) => {
  const enrollments = await fetchAllEnrollments(request.query);
  return reply.status(200).send(enrollments);
};

export const getEnrollmentHandler = async (request: FastifyRequest<{Params: {id: string}}>, reply: FastifyReply) => {
  try {
    const enrollment = await fetchEnrollmentById(request.params.id);
    return reply.status(200).send(enrollment);
  } catch (error) {
    return replyWithEnrollmentError(error, reply, "Erro ao buscar matrícula.");
  }
};

export const deleteEnrollmentHandler = async (request: FastifyRequest<{Params: {id: string}}>, reply: FastifyReply) => {
  try {
    const enrollment = await removeEnrollment(request.params.id);
    return reply.status(200).send(enrollment);
  } catch (error) {
    return replyWithEnrollmentError(error, reply, "Erro ao excluir matrícula.");
  }
};

export const updateEnrollmentStatusHandler = async (
  request: FastifyRequest<{Params: {id: string}; Body: IUpdateEnrollmentStatusInput}>,
  reply: FastifyReply,
) => {
  try {
    const matricula = await changeEnrollmentStatus({
      matriculaId: request.params.id,
      status: request.body.status,
    });
    return reply.status(200).send(matricula);
  } catch (error) {
    return replyWithEnrollmentError(error, reply, "Erro ao atualizar o status da matrícula.");
  }
};
