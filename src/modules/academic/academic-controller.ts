import {FastifyReply, FastifyRequest} from "fastify";

import type {
  IAddComponenteMatrizInput,
  ICreateMatrizInput,
  ICreateTurmaInput,
  IListTurmasQuery,
} from "./academic-schemas.js";
import {
  AcademicError,
  addComponentToMatriz,
  auditMatrizForMecCompliance,
  createNewMatriz,
  createNewTurma,
  fetchTurmas,
} from "./academic-service.js";

const replyWithAcademicError = (error: unknown, reply: FastifyReply, fallback: string) => {
  if (error instanceof AcademicError) {
    return reply.status(error.statusCode).send({error: error.message});
  }

  const message = error instanceof Error ? error.message : fallback;
  return reply.status(400).send({error: message});
};

export const createMatrizHandler = async (request: FastifyRequest<{Body: ICreateMatrizInput}>, reply: FastifyReply) => {
  try {
    const matriz = await createNewMatriz(request.body);
    return reply.status(201).send(matriz);
  } catch (error) {
    return replyWithAcademicError(error, reply, "Erro ao criar matriz.");
  }
};

export const addComponenteHandler = async (
  request: FastifyRequest<{Body: IAddComponenteMatrizInput}>,
  reply: FastifyReply,
) => {
  try {
    const componente = await addComponentToMatriz(request.body);
    return reply.status(201).send(componente);
  } catch (error) {
    return replyWithAcademicError(error, reply, "Erro ao adicionar componente.");
  }
};

export const auditMatrizHandler = async (request: FastifyRequest<{Params: {id: string}}>, reply: FastifyReply) => {
  try {
    const auditoria = await auditMatrizForMecCompliance({matrizCurricularId: request.params.id});
    return reply.status(200).send(auditoria);
  } catch (error) {
    return replyWithAcademicError(error, reply, "Erro ao auditar matriz.");
  }
};

export const createTurmaHandler = async (request: FastifyRequest<{Body: ICreateTurmaInput}>, reply: FastifyReply) => {
  try {
    const turma = await createNewTurma(request.body);
    return reply.status(201).send(turma);
  } catch (error) {
    return replyWithAcademicError(error, reply, "Erro ao criar turma.");
  }
};

export const listTurmasHandler = async (
  request: FastifyRequest<{Querystring: IListTurmasQuery}>,
  reply: FastifyReply,
) => {
  const turmas = await fetchTurmas(request.query);
  return reply.status(200).send(turmas);
};
