import {Role} from "../../generated/prisma/enums.js";
import {
  countMatriculasByCampus,
  countMatriculasByCurso,
  countMatriculasByMatriz,
  countTurmasByDisciplina,
  deleteCampusById,
  deleteComponenteById,
  deleteCursoById,
  deleteDisciplinaById,
  deleteMatrizById,
  deleteTurmaById,
  findCampusById,
  findComponenteById,
  findCursoById,
  findDisciplinaById,
  findMatrizById,
  findMatrizWithComponentes,
  findProfessorById,
  findTurmaById,
  insertCampus,
  insertCurso,
  insertDisciplina,
  insertMatriz,
  insertMatrizComponente,
  insertTurma,
  listCampi,
  listComponentesByMatriz,
  listCursos,
  listDisciplinas,
  listMatrizes,
  listTurmas,
  updateCampusById,
  updateComponenteById,
  updateCursoById,
  updateDisciplinaById,
  updateMatrizById,
  updateTurmaById,
} from "./academic-repository.js";
import type {
  IAddComponenteMatrizInput,
  IAuditoriaMecOutput,
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

export class AcademicError extends Error {
  readonly statusCode: 400 | 403 | 404 | 409;

  constructor(message: string, statusCode: 400 | 403 | 404 | 409) {
    super(message);
    this.name = "AcademicError";
    this.statusCode = statusCode;
  }
}

const percentualDe = (parte: number, total: number) => {
  if (total <= 0) {
    return 0;
  }

  return Number(((parte / total) * 100).toFixed(2));
};

const assertCargaHoraria = ({
  chTotal,
  chPresencial,
  chSincrona,
  chAssincrona,
}: {
  chTotal: number;
  chPresencial: number;
  chSincrona: number;
  chAssincrona: number;
}) => {
  const somaCargas = chPresencial + chSincrona + chAssincrona;

  if (somaCargas !== chTotal) {
    throw new AcademicError(
      `A soma das cargas (Presencial: ${chPresencial}h + Síncrona: ${chSincrona}h + Assíncrona: ${chAssincrona}h = ${somaCargas}h) deve ser idêntica à CH Total (${chTotal}h).`,
      400,
    );
  }
};

export const fetchCampi = async () => {
  return listCampi();
};

export const fetchCampusById = async (id: string) => {
  const campus = await findCampusById(id);

  if (!campus) {
    throw new AcademicError("Campus não encontrado.", 404);
  }

  return campus;
};

export const createNewCampus = async (input: ICreateCampusInput) => {
  return insertCampus(input);
};

export const changeCampus = async ({id, data}: {id: string; data: IUpdateCampusInput}) => {
  const campus = await updateCampusById({id, data});

  if (!campus) {
    throw new AcademicError("Campus não encontrado.", 404);
  }

  return campus;
};

export const removeCampus = async (id: string) => {
  const campus = await findCampusById(id);

  if (!campus) {
    throw new AcademicError("Campus não encontrado.", 404);
  }

  const matriculas = await countMatriculasByCampus(id);

  if (matriculas > 0) {
    throw new AcademicError("Não é possível excluir o campus enquanto houver matrículas vinculadas aos cursos.", 409);
  }

  const deleted = await deleteCampusById(id);

  if (!deleted) {
    throw new AcademicError("Campus não encontrado.", 404);
  }

  return deleted;
};

export const fetchCursos = async (query: IListCursosQuery) => {
  return listCursos(query);
};

export const fetchCursoById = async (id: string) => {
  const curso = await findCursoById(id);

  if (!curso) {
    throw new AcademicError("Curso não encontrado.", 404);
  }

  return curso;
};

export const createNewCurso = async (input: ICreateCursoInput) => {
  const campus = await findCampusById(input.campusId);

  if (!campus) {
    throw new AcademicError("Campus informado não existe.", 404);
  }

  return insertCurso(input);
};

export const changeCurso = async ({id, data}: {id: string; data: IUpdateCursoInput}) => {
  if (data.campusId) {
    const campus = await findCampusById(data.campusId);

    if (!campus) {
      throw new AcademicError("Campus informado não existe.", 404);
    }
  }

  const curso = await updateCursoById({id, data});

  if (!curso) {
    throw new AcademicError("Curso não encontrado.", 404);
  }

  return curso;
};

export const removeCurso = async (id: string) => {
  const curso = await findCursoById(id);

  if (!curso) {
    throw new AcademicError("Curso não encontrado.", 404);
  }

  const matriculas = await countMatriculasByCurso(id);

  if (matriculas > 0) {
    throw new AcademicError("Não é possível excluir o curso enquanto houver matrículas vinculadas.", 409);
  }

  const deleted = await deleteCursoById(id);

  if (!deleted) {
    throw new AcademicError("Curso não encontrado.", 404);
  }

  return deleted;
};

export const fetchDisciplinas = async () => {
  return listDisciplinas();
};

export const fetchDisciplinaById = async (id: string) => {
  const disciplina = await findDisciplinaById(id);

  if (!disciplina) {
    throw new AcademicError("Disciplina não encontrada.", 404);
  }

  return disciplina;
};

export const createNewDisciplina = async (input: ICreateDisciplinaInput) => {
  return insertDisciplina(input);
};

export const changeDisciplina = async ({id, data}: {id: string; data: IUpdateDisciplinaInput}) => {
  const disciplina = await updateDisciplinaById({id, data});

  if (!disciplina) {
    throw new AcademicError("Disciplina não encontrada.", 404);
  }

  return disciplina;
};

export const removeDisciplina = async (id: string) => {
  const disciplina = await findDisciplinaById(id);

  if (!disciplina) {
    throw new AcademicError("Disciplina não encontrada.", 404);
  }

  const turmas = await countTurmasByDisciplina(id);

  if (turmas > 0) {
    throw new AcademicError("Não é possível excluir a disciplina enquanto houver turmas ofertadas.", 409);
  }

  const deleted = await deleteDisciplinaById(id);

  if (!deleted) {
    throw new AcademicError("Disciplina não encontrada.", 404);
  }

  return deleted;
};

export const createNewMatriz = async (input: ICreateMatrizInput) => {
  const curso = await findCursoById(input.cursoId);

  if (!curso) {
    throw new AcademicError("Curso informado não existe.", 404);
  }

  return insertMatriz(input);
};

export const fetchMatrizes = async (query: IListMatrizesQuery) => {
  return listMatrizes(query);
};

export const fetchMatrizById = async (id: string) => {
  const matriz = await findMatrizById(id);

  if (!matriz) {
    throw new AcademicError("Matriz curricular não encontrada.", 404);
  }

  return matriz;
};

export const changeMatriz = async ({id, data}: {id: string; data: IUpdateMatrizInput}) => {
  const matriz = await updateMatrizById({id, data});

  if (!matriz) {
    throw new AcademicError("Matriz curricular não encontrada.", 404);
  }

  return matriz;
};

export const removeMatriz = async (id: string) => {
  const matriz = await findMatrizById(id);

  if (!matriz) {
    throw new AcademicError("Matriz curricular não encontrada.", 404);
  }

  const matriculas = await countMatriculasByMatriz(id);

  if (matriculas > 0) {
    throw new AcademicError("Não é possível excluir a matriz enquanto houver matrículas vinculadas.", 409);
  }

  const deleted = await deleteMatrizById(id);

  if (!deleted) {
    throw new AcademicError("Matriz curricular não encontrada.", 404);
  }

  return deleted;
};

export const addComponentToMatriz = async (input: IAddComponenteMatrizInput) => {
  assertCargaHoraria(input);

  const matriz = await findMatrizById(input.matrizCurricularId);

  if (!matriz) {
    throw new AcademicError("Matriz curricular não encontrada.", 404);
  }

  const disciplina = await findDisciplinaById(input.disciplinaId);

  if (!disciplina) {
    throw new AcademicError("Disciplina informada não existe.", 404);
  }

  return insertMatrizComponente(input);
};

export const fetchComponentesByMatriz = async (matrizCurricularId: string) => {
  const matriz = await findMatrizById(matrizCurricularId);

  if (!matriz) {
    throw new AcademicError("Matriz curricular não encontrada.", 404);
  }

  return listComponentesByMatriz(matrizCurricularId);
};

export const fetchComponenteById = async (id: string) => {
  const componente = await findComponenteById(id);

  if (!componente) {
    throw new AcademicError("Componente curricular não encontrado.", 404);
  }

  return componente;
};

export const changeComponente = async ({id, data}: {id: string; data: IUpdateComponenteMatrizInput}) => {
  const current = await findComponenteById(id);

  if (!current) {
    throw new AcademicError("Componente curricular não encontrado.", 404);
  }

  const cargaInformada =
    data.chTotal !== undefined ||
    data.chPresencial !== undefined ||
    data.chSincrona !== undefined ||
    data.chAssincrona !== undefined;

  if (cargaInformada) {
    assertCargaHoraria({
      chTotal: data.chTotal ?? current.chTotal,
      chPresencial: data.chPresencial ?? current.chPresencial,
      chSincrona: data.chSincrona ?? current.chSincrona,
      chAssincrona: data.chAssincrona ?? current.chAssincrona,
    });
  }

  const componente = await updateComponenteById({id, data});

  if (!componente) {
    throw new AcademicError("Componente curricular não encontrado.", 404);
  }

  return componente;
};

export const removeComponente = async (id: string) => {
  const deleted = await deleteComponenteById(id);

  if (!deleted) {
    throw new AcademicError("Componente curricular não encontrado.", 404);
  }

  return deleted;
};

export const auditMatrizForMecCompliance = async ({
  matrizCurricularId,
}: {
  matrizCurricularId: string;
}): Promise<IAuditoriaMecOutput> => {
  const matriz = await findMatrizWithComponentes({matrizCurricularId});

  if (!matriz) {
    throw new AcademicError("Matriz curricular não encontrada no sistema.", 404);
  }

  if (matriz.componentes.length === 0) {
    throw new AcademicError("A matriz curricular informada não possui componentes vinculados.", 400);
  }

  const totais = matriz.componentes.reduce(
    (acc, componente) => ({
      chTotal: acc.chTotal + componente.chTotal,
      chExtensao: acc.chExtensao + componente.chExtensao,
      chPresencial: acc.chPresencial + componente.chPresencial,
      chSincrona: acc.chSincrona + componente.chSincrona,
    }),
    {chTotal: 0, chExtensao: 0, chPresencial: 0, chSincrona: 0},
  );

  const razaoExtensao = totais.chTotal > 0 ? (totais.chExtensao / totais.chTotal) * 100 : 0;

  return {
    matrizId: matriz.id,
    matrizNome: matriz.nome,
    cursoNome: matriz.curso.nome,
    campusId: matriz.curso.campus.id,
    campusNome: matriz.curso.campus.nome,
    codigoPolo: matriz.curso.campus.codigoPolo,
    chTotalGeral: totais.chTotal,
    chExtensaoTotal: totais.chExtensao,
    percentualExtensao: Number(razaoExtensao.toFixed(2)),
    cumpreRegra10PorcentoExtensao: razaoExtensao >= 10,
    chPresencialTotal: totais.chPresencial,
    percentualPresencial: percentualDe(totais.chPresencial, totais.chTotal),
    chSincronaTotal: totais.chSincrona,
    percentualSincrono: percentualDe(totais.chSincrona, totais.chTotal),
    percentualPresencialESincrono: percentualDe(totais.chPresencial + totais.chSincrona, totais.chTotal),
    quantidadeComponentes: matriz.componentes.length,
  };
};

export const createNewTurma = async (input: ICreateTurmaInput) => {
  const campus = await findCampusById(input.campusId);

  if (!campus) {
    throw new AcademicError("Campus informado não existe.", 404);
  }

  const disciplina = await findDisciplinaById(input.disciplinaId);

  if (!disciplina) {
    throw new AcademicError("Disciplina informada não existe.", 404);
  }

  const professor = await findProfessorById(input.professorId);

  if (!professor) {
    throw new AcademicError("Professor informado não existe.", 404);
  }

  return insertTurma(input);
};

export const fetchTurmas = async ({
  actorRole,
  actorUserId,
  ...params
}: IListTurmasQuery & {actorRole: Role; actorUserId: string}) => {
  const turmas = await listTurmas({
    ...params,
    professorUserId: actorRole === Role.PROFESSOR ? actorUserId : undefined,
  });

  return turmas.map(({_count, ...turma}) => ({
    ...turma,
    quantidadeDiarios: _count.diarios,
  }));
};

export const fetchTurmaById = async ({
  id,
  actorRole,
  actorUserId,
}: {
  id: string;
  actorRole: Role;
  actorUserId: string;
}) => {
  const turma = await findTurmaById(id);

  if (!turma) {
    throw new AcademicError("Turma não encontrada.", 404);
  }

  if (actorRole === Role.PROFESSOR && turma.professor.user.id !== actorUserId) {
    throw new AcademicError("Você não é o professor responsável por esta turma.", 403);
  }

  return turma;
};

export const changeTurma = async ({id, data}: {id: string; data: IUpdateTurmaInput}) => {
  if (data.professorId) {
    const professor = await findProfessorById(data.professorId);

    if (!professor) {
      throw new AcademicError("Professor informado não existe.", 404);
    }
  }

  const turma = await updateTurmaById({id, data});

  if (!turma) {
    throw new AcademicError("Turma não encontrada.", 404);
  }

  return turma;
};

export const removeTurma = async (id: string) => {
  const deleted = await deleteTurmaById(id);

  if (!deleted) {
    throw new AcademicError("Turma não encontrada.", 404);
  }

  return deleted;
};
