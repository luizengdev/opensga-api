import {Prisma} from "../../generated/prisma/client.js";
import {Role, StatusMatricula} from "../../generated/prisma/enums.js";
import {
  createDiarioEntry,
  deleteDiarioById,
  findDiarioById,
  findDiarioRecordById,
  findMatriculaForPlacement,
  findTurmaForPlacement,
  listDiarios,
  saveDiarioGrades,
} from "./grading-repository.js";
import type {
  IAvaliacaoOutput,
  IDiarioOutput,
  IEnrollInTurmaInput,
  IListDiariosQuery,
  IUpdateGradesInput,
} from "./grading-schemas.js";

export class GradingError extends Error {
  readonly statusCode: 400 | 403 | 404;

  constructor(message: string, statusCode: 400 | 403 | 404) {
    super(message);
    this.name = "GradingError";
    this.statusCode = statusCode;
  }
}

const decimalToNumber = (value: Prisma.Decimal | null) => {
  if (value === null) {
    return null;
  }

  return Number(value);
};

const resolveNota = (inputNota: number | undefined, storedNota: Prisma.Decimal | null) => {
  if (inputNota !== undefined) {
    return inputNota;
  }

  return decimalToNumber(storedNota);
};

export const enrollStudentInClass = async (input: IEnrollInTurmaInput) => {
  const matricula = await findMatriculaForPlacement(input.matriculaId);

  if (!matricula) {
    throw new GradingError("Matrícula não encontrada.", 404);
  }

  if (matricula.status !== StatusMatricula.ATIVO) {
    throw new GradingError("A matrícula não está ativa.", 400);
  }

  const turma = await findTurmaForPlacement(input.turmaId);

  if (!turma) {
    throw new GradingError("Turma não encontrada.", 404);
  }

  const disciplinaNaMatriz = matricula.matrizCurricular.componentes.some(
    (componente) => componente.disciplinaId === turma.disciplinaId,
  );

  if (!disciplinaNaMatriz) {
    throw new GradingError("A disciplina desta turma não compõe a matriz curricular vinculada à matrícula.", 400);
  }

  const jaEnturmadoNaDisciplina = matricula.diarios.some((diario) => diario.turma.disciplinaId === turma.disciplinaId);

  if (jaEnturmadoNaDisciplina) {
    throw new GradingError("O aluno já está enturmado nesta disciplina.", 400);
  }

  const diario = await createDiarioEntry({matriculaId: input.matriculaId, turmaId: input.turmaId});

  if (!diario) {
    throw new GradingError("O aluno já está enturmado nesta turma.", 400);
  }

  return {
    id: diario.id,
    matriculaId: diario.matriculaId,
    turmaId: diario.turmaId,
    disciplina: turma.disciplina,
    aluno: {
      ra: matricula.aluno.ra,
      nome: matricula.aluno.user.nome,
    },
  };
};

const mapDiario = (diario: {
  id: string;
  matriculaId: string;
  turmaId: string;
  notaA1: Prisma.Decimal | null;
  notaA2: Prisma.Decimal | null;
  notaAF: Prisma.Decimal | null;
  notaFinal: Prisma.Decimal | null;
  totalFaltas: number;
  chCumprida: number;
  aprovado: boolean | null;
  turma: IDiarioOutput["turma"] & {professor?: {userId: string}};
  matricula: {aluno: {ra: string; user: {nome: string}}};
}): IDiarioOutput => {
  return {
    id: diario.id,
    matriculaId: diario.matriculaId,
    turmaId: diario.turmaId,
    notaA1: decimalToNumber(diario.notaA1),
    notaA2: decimalToNumber(diario.notaA2),
    notaAF: decimalToNumber(diario.notaAF),
    notaFinal: decimalToNumber(diario.notaFinal),
    totalFaltas: diario.totalFaltas,
    chCumprida: diario.chCumprida,
    aprovado: diario.aprovado,
    turma: {
      id: diario.turma.id,
      codigo: diario.turma.codigo,
      disciplina: diario.turma.disciplina,
    },
    aluno: {
      ra: diario.matricula.aluno.ra,
      nome: diario.matricula.aluno.user.nome,
    },
  };
};

export const fetchDiarios = async ({
  actorRole,
  actorUserId,
  ...query
}: IListDiariosQuery & {actorRole: Role; actorUserId: string}) => {
  const diarios = await listDiarios({
    ...query,
    professorUserId: actorRole === Role.PROFESSOR ? actorUserId : undefined,
  });
  return diarios.map(mapDiario);
};

export const fetchDiarioById = async ({
  id,
  actorRole,
  actorUserId,
}: {
  id: string;
  actorRole: Role;
  actorUserId: string;
}) => {
  const diario = await findDiarioRecordById(id);

  if (!diario) {
    throw new GradingError("Registro de diário de classe não encontrado.", 404);
  }

  if (actorRole === Role.PROFESSOR && diario.turma.professor.userId !== actorUserId) {
    throw new GradingError("Você não é o professor responsável por esta turma.", 403);
  }

  return mapDiario(diario);
};

export const unenrollStudentFromClass = async (id: string) => {
  const deleted = await deleteDiarioById(id);

  if (!deleted) {
    throw new GradingError("Registro de diário de classe não encontrado.", 404);
  }

  return deleted;
};

export const calculateAndSaveGrades = async ({
  actorUserId,
  actorRole,
  ...input
}: IUpdateGradesInput & {actorUserId: string; actorRole: Role}): Promise<IAvaliacaoOutput> => {
  const diario = await findDiarioById(input.diarioClasseId);

  if (!diario) {
    throw new GradingError("Registro de diário de classe não encontrado.", 404);
  }

  if (actorRole === Role.PROFESSOR && diario.turma.professor.userId !== actorUserId) {
    throw new GradingError("Você não é o professor responsável por esta turma.", 403);
  }

  const componenteMatriz = diario.matricula.matrizCurricular.componentes.find(
    (componente) => componente.disciplinaId === diario.turma.disciplinaId,
  );

  if (!componenteMatriz) {
    throw new GradingError("A disciplina desta turma não compõe a matriz curricular vinculada à matrícula.", 400);
  }

  const a1 = resolveNota(input.notaA1, diario.notaA1);
  const a2 = resolveNota(input.notaA2, diario.notaA2);
  const af = resolveNota(input.notaAF, diario.notaAF);
  const faltas = input.totalFaltas !== undefined ? input.totalFaltas : diario.totalFaltas;
  const chTotalDisciplina = componenteMatriz.chTotal;
  const limiteMaximoFaltas = Math.floor(chTotalDisciplina * 0.25);
  const reprovadoPorFalta = faltas > limiteMaximoFaltas;

  let notaFinal: number | null = null;
  let aprovado: boolean | null = null;

  if (a1 !== null && a2 !== null) {
    const mediaSemestral = Number((a1 * 0.4 + a2 * 0.6).toFixed(2));

    if (reprovadoPorFalta) {
      aprovado = false;
      notaFinal = mediaSemestral;
    } else if (mediaSemestral >= 6) {
      aprovado = true;
      notaFinal = mediaSemestral;
    } else if (af !== null) {
      notaFinal = Number(((mediaSemestral + af) / 2).toFixed(2));
      aprovado = notaFinal >= 5;
    } else {
      notaFinal = mediaSemestral;
      aprovado = null;
    }
  }

  const saved = await saveDiarioGrades({
    id: input.diarioClasseId,
    notaA1: a1,
    notaA2: a2,
    notaAF: af,
    notaFinal,
    totalFaltas: faltas,
    chCumprida: aprovado === true ? chTotalDisciplina : 0,
    aprovado,
  });

  return {
    id: saved.id,
    notaA1: decimalToNumber(saved.notaA1),
    notaA2: decimalToNumber(saved.notaA2),
    notaAF: decimalToNumber(saved.notaAF),
    notaFinal: decimalToNumber(saved.notaFinal),
    totalFaltas: saved.totalFaltas,
    chCumprida: saved.chCumprida,
    aprovado: saved.aprovado,
  };
};
