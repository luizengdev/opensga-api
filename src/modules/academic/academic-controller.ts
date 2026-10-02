import {FastifyReply, FastifyRequest} from "fastify";

import type {
  IAddComponenteMatrizInput,
  ICreateCampusInput,
  ICreateCursoInput,
  ICreateDisciplinaInput,
  ICreateMatrizInput,
  ICreateTurmaInput,
  IListCursosQuery,
  IListMatrizesQuery,
  IListTurmasQuery,
  IUpdateCampusInput,
  IUpdateComponenteMatrizInput,
  IUpdateCursoInput,
  IUpdateDisciplinaInput,
  IUpdateMatrizInput,
  IUpdateTurmaInput,
} from "./academic-schemas.js";
import {
  AcademicError,
  addComponentToMatriz,
  auditMatrizForMecCompliance,
  changeCampus,
  changeComponente,
  changeCurso,
  changeDisciplina,
  changeMatriz,
  changeTurma,
  createNewCampus,
  createNewCurso,
  createNewDisciplina,
  createNewMatriz,
  createNewTurma,
  fetchCampi,
  fetchCampusById,
  fetchComponenteById,
  fetchComponentesByMatriz,
  fetchCursoById,
  fetchCursos,
  fetchDisciplinaById,
  fetchDisciplinas,
  fetchMatrizById,
  fetchMatrizes,
  fetchTurmaById,
  fetchTurmas,
  removeCampus,
  removeComponente,
  removeCurso,
  removeDisciplina,
  removeMatriz,
  removeTurma,
} from "./academic-service.js";

const replyWithAcademicError = (error: unknown, reply: FastifyReply, fallback: string) => {
  if (error instanceof AcademicError) {
    return reply.status(error.statusCode).send({error: error.message});
  }

  const message = error instanceof Error ? error.message : fallback;
  return reply.status(400).send({error: message});
};

export const listCampiHandler = async (_request: FastifyRequest, reply: FastifyReply) => {
  const campi = await fetchCampi();
  return reply.status(200).send(campi);
};

export const getCampusHandler = async (request: FastifyRequest<{Params: {id: string}}>, reply: FastifyReply) => {
  try {
    const campus = await fetchCampusById(request.params.id);
    return reply.status(200).send(campus);
  } catch (error) {
    return replyWithAcademicError(error, reply, "Erro ao buscar campus.");
  }
};

export const createCampusHandler = async (request: FastifyRequest<{Body: ICreateCampusInput}>, reply: FastifyReply) => {
  try {
    const campus = await createNewCampus(request.body);
    return reply.status(201).send(campus);
  } catch (error) {
    return replyWithAcademicError(error, reply, "Erro ao criar campus.");
  }
};

export const updateCampusHandler = async (
  request: FastifyRequest<{Params: {id: string}; Body: IUpdateCampusInput}>,
  reply: FastifyReply,
) => {
  try {
    const campus = await changeCampus({id: request.params.id, data: request.body});
    return reply.status(200).send(campus);
  } catch (error) {
    return replyWithAcademicError(error, reply, "Erro ao atualizar campus.");
  }
};

export const deleteCampusHandler = async (request: FastifyRequest<{Params: {id: string}}>, reply: FastifyReply) => {
  try {
    const campus = await removeCampus(request.params.id);
    return reply.status(200).send(campus);
  } catch (error) {
    return replyWithAcademicError(error, reply, "Erro ao excluir campus.");
  }
};

export const listCursosHandler = async (
  request: FastifyRequest<{Querystring: IListCursosQuery}>,
  reply: FastifyReply,
) => {
  const cursos = await fetchCursos(request.query);
  return reply.status(200).send(cursos);
};

export const getCursoHandler = async (request: FastifyRequest<{Params: {id: string}}>, reply: FastifyReply) => {
  try {
    const curso = await fetchCursoById(request.params.id);
    return reply.status(200).send(curso);
  } catch (error) {
    return replyWithAcademicError(error, reply, "Erro ao buscar curso.");
  }
};

export const createCursoHandler = async (request: FastifyRequest<{Body: ICreateCursoInput}>, reply: FastifyReply) => {
  try {
    const curso = await createNewCurso(request.body);
    return reply.status(201).send(curso);
  } catch (error) {
    return replyWithAcademicError(error, reply, "Erro ao criar curso.");
  }
};

export const updateCursoHandler = async (
  request: FastifyRequest<{Params: {id: string}; Body: IUpdateCursoInput}>,
  reply: FastifyReply,
) => {
  try {
    const curso = await changeCurso({id: request.params.id, data: request.body});
    return reply.status(200).send(curso);
  } catch (error) {
    return replyWithAcademicError(error, reply, "Erro ao atualizar curso.");
  }
};

export const deleteCursoHandler = async (request: FastifyRequest<{Params: {id: string}}>, reply: FastifyReply) => {
  try {
    const curso = await removeCurso(request.params.id);
    return reply.status(200).send(curso);
  } catch (error) {
    return replyWithAcademicError(error, reply, "Erro ao excluir curso.");
  }
};

export const listDisciplinasHandler = async (_request: FastifyRequest, reply: FastifyReply) => {
  const disciplinas = await fetchDisciplinas();
  return reply.status(200).send(disciplinas);
};

export const getDisciplinaHandler = async (request: FastifyRequest<{Params: {id: string}}>, reply: FastifyReply) => {
  try {
    const disciplina = await fetchDisciplinaById(request.params.id);
    return reply.status(200).send(disciplina);
  } catch (error) {
    return replyWithAcademicError(error, reply, "Erro ao buscar disciplina.");
  }
};

export const createDisciplinaHandler = async (
  request: FastifyRequest<{Body: ICreateDisciplinaInput}>,
  reply: FastifyReply,
) => {
  try {
    const disciplina = await createNewDisciplina(request.body);
    return reply.status(201).send(disciplina);
  } catch (error) {
    return replyWithAcademicError(error, reply, "Erro ao criar disciplina.");
  }
};

export const updateDisciplinaHandler = async (
  request: FastifyRequest<{Params: {id: string}; Body: IUpdateDisciplinaInput}>,
  reply: FastifyReply,
) => {
  try {
    const disciplina = await changeDisciplina({id: request.params.id, data: request.body});
    return reply.status(200).send(disciplina);
  } catch (error) {
    return replyWithAcademicError(error, reply, "Erro ao atualizar disciplina.");
  }
};

export const deleteDisciplinaHandler = async (request: FastifyRequest<{Params: {id: string}}>, reply: FastifyReply) => {
  try {
    const disciplina = await removeDisciplina(request.params.id);
    return reply.status(200).send(disciplina);
  } catch (error) {
    return replyWithAcademicError(error, reply, "Erro ao excluir disciplina.");
  }
};

export const createMatrizHandler = async (request: FastifyRequest<{Body: ICreateMatrizInput}>, reply: FastifyReply) => {
  try {
    const matriz = await createNewMatriz(request.body);
    return reply.status(201).send(matriz);
  } catch (error) {
    return replyWithAcademicError(error, reply, "Erro ao criar matriz.");
  }
};

export const listMatrizesHandler = async (
  request: FastifyRequest<{Querystring: IListMatrizesQuery}>,
  reply: FastifyReply,
) => {
  const matrizes = await fetchMatrizes(request.query);
  return reply.status(200).send(matrizes);
};

export const getMatrizHandler = async (request: FastifyRequest<{Params: {id: string}}>, reply: FastifyReply) => {
  try {
    const matriz = await fetchMatrizById(request.params.id);
    return reply.status(200).send(matriz);
  } catch (error) {
    return replyWithAcademicError(error, reply, "Erro ao buscar matriz.");
  }
};

export const updateMatrizHandler = async (
  request: FastifyRequest<{Params: {id: string}; Body: IUpdateMatrizInput}>,
  reply: FastifyReply,
) => {
  try {
    const matriz = await changeMatriz({id: request.params.id, data: request.body});
    return reply.status(200).send(matriz);
  } catch (error) {
    return replyWithAcademicError(error, reply, "Erro ao atualizar matriz.");
  }
};

export const deleteMatrizHandler = async (request: FastifyRequest<{Params: {id: string}}>, reply: FastifyReply) => {
  try {
    const matriz = await removeMatriz(request.params.id);
    return reply.status(200).send(matriz);
  } catch (error) {
    return replyWithAcademicError(error, reply, "Erro ao excluir matriz.");
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

export const listComponentesHandler = async (request: FastifyRequest<{Params: {id: string}}>, reply: FastifyReply) => {
  try {
    const componentes = await fetchComponentesByMatriz(request.params.id);
    return reply.status(200).send(componentes);
  } catch (error) {
    return replyWithAcademicError(error, reply, "Erro ao listar componentes.");
  }
};

export const getComponenteHandler = async (request: FastifyRequest<{Params: {id: string}}>, reply: FastifyReply) => {
  try {
    const componente = await fetchComponenteById(request.params.id);
    return reply.status(200).send(componente);
  } catch (error) {
    return replyWithAcademicError(error, reply, "Erro ao buscar componente.");
  }
};

export const updateComponenteHandler = async (
  request: FastifyRequest<{Params: {id: string}; Body: IUpdateComponenteMatrizInput}>,
  reply: FastifyReply,
) => {
  try {
    const componente = await changeComponente({id: request.params.id, data: request.body});
    return reply.status(200).send(componente);
  } catch (error) {
    return replyWithAcademicError(error, reply, "Erro ao atualizar componente.");
  }
};

export const deleteComponenteHandler = async (request: FastifyRequest<{Params: {id: string}}>, reply: FastifyReply) => {
  try {
    const componente = await removeComponente(request.params.id);
    return reply.status(200).send(componente);
  } catch (error) {
    return replyWithAcademicError(error, reply, "Erro ao excluir componente.");
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
  const turmas = await fetchTurmas({
    ...request.query,
    actorRole: request.user.role,
    actorUserId: request.user.sub,
  });
  return reply.status(200).send(turmas);
};

export const getTurmaHandler = async (request: FastifyRequest<{Params: {id: string}}>, reply: FastifyReply) => {
  try {
    const turma = await fetchTurmaById({
      id: request.params.id,
      actorRole: request.user.role,
      actorUserId: request.user.sub,
    });
    return reply.status(200).send(turma);
  } catch (error) {
    return replyWithAcademicError(error, reply, "Erro ao buscar turma.");
  }
};

export const updateTurmaHandler = async (
  request: FastifyRequest<{Params: {id: string}; Body: IUpdateTurmaInput}>,
  reply: FastifyReply,
) => {
  try {
    const turma = await changeTurma({id: request.params.id, data: request.body});
    return reply.status(200).send(turma);
  } catch (error) {
    return replyWithAcademicError(error, reply, "Erro ao atualizar turma.");
  }
};

export const deleteTurmaHandler = async (request: FastifyRequest<{Params: {id: string}}>, reply: FastifyReply) => {
  try {
    const turma = await removeTurma(request.params.id);
    return reply.status(200).send(turma);
  } catch (error) {
    return replyWithAcademicError(error, reply, "Erro ao excluir turma.");
  }
};
