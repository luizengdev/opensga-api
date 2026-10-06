import {Prisma} from "../../generated/prisma/client.js";
import {Role, StatusDisciplina, StatusMatricula} from "../../generated/prisma/enums.js";
import {evaluateFechamento, evaluateLancamento} from "./grading-engine.js";
import {
  closeDiariosAtomically,
  createDiarioEntry,
  deleteDiarioById,
  findDiarioById,
  findDiarioRecordById,
  findMatriculaForPlacement,
  findTurmaForFechamento,
  findTurmaForPlacement,
  listDiarios,
  listDiariosForFechamento,
  saveDiarioLancamento,
} from "./grading-repository.js";
import type {
  IAvaliacaoOutput,
  IDiarioOutput,
  IEnrollInTurmaInput,
  IFecharSemestreOutput,
  IListDiariosQuery,
  IUpdateGradesInput,
} from "./grading-schemas.js";

export class GradingError extends Error {
  readonly statusCode: 400 | 403 | 404 | 409;

  constructor(message: string, statusCode: 400 | 403 | 404 | 409) {
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

const mapAvaliacao = (diario: {
  id: string;
  notaAv: Prisma.Decimal | null;
  notaAvs: Prisma.Decimal | null;
  notaAv3: Prisma.Decimal | null;
  notaSemestral: Prisma.Decimal | null;
  mediaFinal: Prisma.Decimal | null;
  habilitaAv3: boolean;
  totalFaltas: number;
  chCumprida: number;
  statusDisciplina: StatusDisciplina;
  semestreFechado: boolean;
}): IAvaliacaoOutput => {
  return {
    id: diario.id,
    notaAv: decimalToNumber(diario.notaAv),
    notaAvs: decimalToNumber(diario.notaAvs),
    notaAv3: decimalToNumber(diario.notaAv3),
    notaSemestral: decimalToNumber(diario.notaSemestral),
    mediaFinal: decimalToNumber(diario.mediaFinal),
    habilitaAv3: diario.habilitaAv3,
    totalFaltas: diario.totalFaltas,
    chCumprida: diario.chCumprida,
    statusDisciplina: diario.statusDisciplina,
    semestreFechado: diario.semestreFechado,
  };
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
  notaAv: Prisma.Decimal | null;
  notaAvs: Prisma.Decimal | null;
  notaAv3: Prisma.Decimal | null;
  notaSemestral: Prisma.Decimal | null;
  mediaFinal: Prisma.Decimal | null;
  habilitaAv3: boolean;
  totalFaltas: number;
  chCumprida: number;
  statusDisciplina: StatusDisciplina;
  semestreFechado: boolean;
  turma: IDiarioOutput["turma"] & {professor?: {userId: string}};
  matricula: {aluno: {ra: string; user: {nome: string}}};
}): IDiarioOutput => {
  return {
    id: diario.id,
    matriculaId: diario.matriculaId,
    turmaId: diario.turmaId,
    notaAv: decimalToNumber(diario.notaAv),
    notaAvs: decimalToNumber(diario.notaAvs),
    notaAv3: decimalToNumber(diario.notaAv3),
    notaSemestral: decimalToNumber(diario.notaSemestral),
    mediaFinal: decimalToNumber(diario.mediaFinal),
    habilitaAv3: diario.habilitaAv3,
    totalFaltas: diario.totalFaltas,
    chCumprida: diario.chCumprida,
    statusDisciplina: diario.statusDisciplina,
    semestreFechado: diario.semestreFechado,
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

  if (diario.semestreFechado) {
    throw new GradingError("O semestre desta turma já foi fechado. Reabra o lançamento com a secretaria.", 409);
  }

  const componenteMatriz = diario.matricula.matrizCurricular.componentes.find(
    (componente) => componente.disciplinaId === diario.turma.disciplinaId,
  );

  if (!componenteMatriz) {
    throw new GradingError("A disciplina desta turma não compõe a matriz curricular vinculada à matrícula.", 400);
  }

  const notaAv = resolveNota(input.notaAv, diario.notaAv);
  const notaAvs = resolveNota(input.notaAvs, diario.notaAvs);
  const notaAv3 = resolveNota(input.notaAv3, diario.notaAv3);
  const faltas = input.totalFaltas !== undefined ? input.totalFaltas : diario.totalFaltas;
  const lancamento = evaluateLancamento({
    notaAv,
    notaAvs,
    notaAv3,
    totalFaltas: faltas,
    chTotal: componenteMatriz.chTotal,
  });

  if (input.notaAv3 !== undefined && notaAv3 !== null && !lancamento.habilitaAv3) {
    throw new GradingError("A AV3 só pode ser lançada quando a nota semestral for inferior a 6,0 e a frequência for regular.", 400);
  }

  const saved = await saveDiarioLancamento({
    id: input.diarioClasseId,
    notaAv,
    notaAvs,
    notaAv3: lancamento.habilitaAv3 ? notaAv3 : null,
    notaSemestral: lancamento.notaSemestral,
    habilitaAv3: lancamento.habilitaAv3,
    totalFaltas: faltas,
  });

  return mapAvaliacao(saved);
};

export const closeTurmaSemester = async ({
  turmaId,
  actorRole,
  actorUserId,
}: {
  turmaId: string;
  actorRole: Role;
  actorUserId: string;
}): Promise<IFecharSemestreOutput> => {
  const turma = await findTurmaForFechamento(turmaId);

  if (!turma) {
    throw new GradingError("Turma não encontrada.", 404);
  }

  if (actorRole === Role.PROFESSOR && turma.professor.userId !== actorUserId) {
    throw new GradingError("Você não é o professor responsável por esta turma.", 403);
  }

  const diarios = await listDiariosForFechamento(turmaId);

  if (diarios.length === 0) {
    throw new GradingError("A turma não possui diários para fechamento.", 400);
  }

  const pendencias = diarios.flatMap((diario) => {
    const componenteMatriz = diario.matricula.matrizCurricular.componentes.find(
      (componente) => componente.disciplinaId === diario.turma.disciplinaId,
    );

    if (!componenteMatriz) {
      return [`Diário ${diario.id}: disciplina fora da matriz.`];
    }

    const fechamento = evaluateFechamento({
      notaAv: decimalToNumber(diario.notaAv),
      notaAvs: decimalToNumber(diario.notaAvs),
      notaAv3: decimalToNumber(diario.notaAv3),
      totalFaltas: diario.totalFaltas,
      chTotal: componenteMatriz.chTotal,
    });

    if (fechamento.statusDisciplina === StatusDisciplina.EM_ABERTO) {
      if (fechamento.notaSemestral === null) {
        return [`Diário ${diario.id}: AV ou AVS ainda não lançadas.`];
      }

      return [`Diário ${diario.id}: AV3 obrigatória (nota semestral ${fechamento.notaSemestral}).`];
    }

    return [];
  });

  if (pendencias.length > 0) {
    throw new GradingError(`Fechamento bloqueado. ${pendencias.join(" ")}`, 409);
  }

  const updates = diarios.map((diario) => {
    const componenteMatriz = diario.matricula.matrizCurricular.componentes.find(
      (componente) => componente.disciplinaId === diario.turma.disciplinaId,
    );

    if (!componenteMatriz) {
      throw new GradingError("A disciplina desta turma não compõe a matriz curricular vinculada à matrícula.", 400);
    }

    const fechamento = evaluateFechamento({
      notaAv: decimalToNumber(diario.notaAv),
      notaAvs: decimalToNumber(diario.notaAvs),
      notaAv3: decimalToNumber(diario.notaAv3),
      totalFaltas: diario.totalFaltas,
      chTotal: componenteMatriz.chTotal,
    });

    return {
      id: diario.id,
      ...fechamento,
    };
  });

  const saved = await closeDiariosAtomically(updates);

  return {
    turmaId,
    fechados: saved.length,
    diarios: saved.map(mapAvaliacao),
  };
};
