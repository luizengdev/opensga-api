import {ModalidadeCurso, Role, TipoCampus} from "../../generated/prisma/enums.js";
import {
  countMatriculasByCampus,
  countMatriculasByCurso,
  countMatriculasByMatriz,
  countComponentesByCursoDisciplina,
  countComponentesByMatriz,
  countTurmasByCurso,
  countDiariosByDisciplinaCampus,
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
  findChTotalByDisciplinaCampus,
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
import {collectViolacoesMatriz} from "./mec-2026.js";
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

const assertModalidadeCompativelComCampus = ({
  tipoCampus,
  modalidade,
}: {
  tipoCampus: TipoCampus;
  modalidade: ModalidadeCurso;
}) => {
  if (tipoCampus === TipoCampus.POLO && modalidade !== ModalidadeCurso.EAD) {
    throw new AcademicError("Polo EAD só pode ofertar cursos na modalidade EAD.", 400);
  }

  if (tipoCampus === TipoCampus.CAMPI && modalidade === ModalidadeCurso.EAD) {
    throw new AcademicError("Campus presencial não oferta cursos EAD. Cadastre o curso em um polo.", 400);
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

  assertModalidadeCompativelComCampus({
    tipoCampus: campus.tipo,
    modalidade: input.modalidade,
  });

  return insertCurso(input);
};

export const changeCurso = async ({id, data}: {id: string; data: IUpdateCursoInput}) => {
  const current = await findCursoById(id);

  if (!current) {
    throw new AcademicError("Curso não encontrado.", 404);
  }

  const campusId = data.campusId ?? current.campusId;
  const campus = await findCampusById(campusId);

  if (!campus) {
    throw new AcademicError("Campus informado não existe.", 404);
  }

  assertModalidadeCompativelComCampus({
    tipoCampus: campus.tipo,
    modalidade: data.modalidade ?? current.modalidade,
  });

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

  const turmas = await countTurmasByCurso(id);

  if (turmas > 0) {
    throw new AcademicError("Não é possível excluir o curso enquanto houver turmas ofertadas.", 409);
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
  assertCargaHoraria(input);
  return insertDisciplina(input);
};

export const changeDisciplina = async ({id, data}: {id: string; data: IUpdateDisciplinaInput}) => {
  const current = await findDisciplinaById(id);

  if (!current) {
    throw new AcademicError("Disciplina não encontrada.", 404);
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

  const componentes = await countComponentesByMatriz(id);

  if (componentes > 0) {
    throw new AcademicError("Remova os componentes antes de excluir a matriz.", 409);
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
  const componente = await findComponenteById(id);

  if (!componente) {
    throw new AcademicError("Componente curricular não encontrado.", 404);
  }

  const matriz = await findMatrizById(componente.matrizCurricularId);

  if (!matriz) {
    throw new AcademicError("Matriz curricular não encontrada.", 404);
  }

  const curso = await findCursoById(matriz.cursoId);

  if (!curso) {
    throw new AcademicError("Curso informado não existe.", 404);
  }

  const alunosEnturmados = await countDiariosByDisciplinaCampus({
    campusId: curso.campusId,
    disciplinaId: componente.disciplinaId,
  });

  if (alunosEnturmados > 0) {
    throw new AcademicError(
      `Não é possível remover o componente ${componente.disciplina.codigo} enquanto houver ${alunosEnturmados} aluno(s) enturmado(s) nesta disciplina. A exclusão do componente não é em cascata e não apaga turmas nem alunos.`,
      409,
    );
  }

  const deleted = await deleteComponenteById(id);

  if (!deleted) {
    throw new AcademicError("Componente curricular não encontrado.", 404);
  }

  return deleted;
};

export class RegulatoryConflictError extends AcademicError {
  readonly auditoria: IAuditoriaMecOutput;

  constructor(auditoria: IAuditoriaMecOutput) {
    super(
      "Conflito regulatório: a matriz não cumpre o Decreto nº 12.456/2026 e/ou a curricularização da extensão (CNE/CES 7/2018).",
      409,
    );
    this.name = "RegulatoryConflictError";
    this.auditoria = auditoria;
  }
}

export const auditMatrizForMecCompliance = async ({
  matrizCurricularId,
}: {
  matrizCurricularId: string;
}): Promise<IAuditoriaMecOutput> => {
  const matriz = await findMatrizWithComponentes({matrizCurricularId});

  if (!matriz) {
    throw new AcademicError("Matriz curricular não encontrada no sistema.", 404);
  }

  const totais = matriz.componentes.reduce(
    (acc, componente) => ({
      chTotal: acc.chTotal + componente.chTotal,
      chExtensao: acc.chExtensao + componente.chExtensao,
      chPresencial: acc.chPresencial + componente.chPresencial,
      chSincrona: acc.chSincrona + componente.chSincrona,
      chAssincrona: acc.chAssincrona + componente.chAssincrona,
    }),
    {chTotal: 0, chExtensao: 0, chPresencial: 0, chSincrona: 0, chAssincrona: 0},
  );

  const {violacoes, chExtensaoPorTipo, percentualExtensao} = collectViolacoesMatriz({
    modalidade: matriz.curso.modalidade,
    componentes: matriz.componentes,
  });

  return {
    matrizId: matriz.id,
    matrizNome: matriz.nome,
    cursoNome: matriz.curso.nome,
    modalidadeCurso: matriz.curso.modalidade,
    campusId: matriz.curso.campus.id,
    campusNome: matriz.curso.campus.nome,
    codigoPolo: matriz.curso.campus.codigoPolo,
    chTotalGeral: totais.chTotal,
    chExtensaoTotal: totais.chExtensao,
    chExtensaoPorTipo,
    percentualExtensao,
    cumpreRegra10PorcentoExtensao: percentualExtensao >= 10,
    chPresencialTotal: totais.chPresencial,
    percentualPresencial: percentualDe(totais.chPresencial, totais.chTotal),
    chSincronaTotal: totais.chSincrona,
    percentualSincrono: percentualDe(totais.chSincrona, totais.chTotal),
    chAssincronaTotal: totais.chAssincrona,
    percentualAssincrono: percentualDe(totais.chAssincrona, totais.chTotal),
    percentualPresencialESincrono: percentualDe(totais.chPresencial + totais.chSincrona, totais.chTotal),
    quantidadeComponentes: matriz.componentes.length,
    conformeDecreto12456: violacoes.length === 0,
    violacoes,
  };
};

export const auditMatrizOrThrowConflict = async ({matrizCurricularId}: {matrizCurricularId: string}) => {
  const auditoria = await auditMatrizForMecCompliance({matrizCurricularId});

  if (!auditoria.conformeDecreto12456) {
    throw new RegulatoryConflictError(auditoria);
  }

  return auditoria;
};

export const createNewTurma = async (input: ICreateTurmaInput) => {
  const curso = await findCursoById(input.cursoId);

  if (!curso) {
    throw new AcademicError("Curso informado não existe.", 404);
  }

  const campus = await findCampusById(input.campusId);

  if (!campus) {
    throw new AcademicError("Campus informado não existe.", 404);
  }

  if (curso.campusId !== input.campusId) {
    throw new AcademicError("A turma deve ser ofertada no campus do curso.", 400);
  }

  const disciplina = await findDisciplinaById(input.disciplinaId);

  if (!disciplina) {
    throw new AcademicError("Disciplina informada não existe.", 404);
  }

  const naMatriz = await countComponentesByCursoDisciplina({
    cursoId: input.cursoId,
    disciplinaId: input.disciplinaId,
  });

  if (naMatriz === 0) {
    throw new AcademicError("A disciplina não pertence à matriz do curso informado.", 400);
  }

  const professor = await findProfessorById(input.professorId);

  if (!professor) {
    throw new AcademicError("Professor informado não existe.", 404);
  }

  const turma = await insertTurma(input);
  return attachChTotalToTurma(turma);
};

const chaveCargaHoraria = ({disciplinaId, campusId}: {disciplinaId: string; campusId: string}) => {
  return `${disciplinaId}:${campusId}`;
};

const attachChTotalToTurma = async <T extends {disciplinaId: string; campusId: string}>(turma: T) => {
  const cargas = await findChTotalByDisciplinaCampus([
    {disciplinaId: turma.disciplinaId, campusId: turma.campusId},
  ]);

  return {
    ...turma,
    chTotal: cargas.get(chaveCargaHoraria(turma)) ?? null,
  };
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

  const cargas = await findChTotalByDisciplinaCampus(
    turmas.map((turma) => ({disciplinaId: turma.disciplinaId, campusId: turma.campusId})),
  );

  return turmas.map(({_count, ...turma}) => ({
    ...turma,
    quantidadeDiarios: _count.diarios,
    chTotal: cargas.get(chaveCargaHoraria(turma)) ?? null,
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

  return attachChTotalToTurma(turma);
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

  return attachChTotalToTurma(turma);
};

export const removeTurma = async (id: string) => {
  const deleted = await deleteTurmaById(id);

  if (!deleted) {
    throw new AcademicError("Turma não encontrada.", 404);
  }

  return deleted;
};
