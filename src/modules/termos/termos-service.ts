import {Prisma} from "../../generated/prisma/client.js";
import {Role, StatusTermoAbertura, TipoTermoAbertura} from "../../generated/prisma/enums.js";
import {dayjs} from "../../lib/dayjs.js";
import {applyApprovedIndividualLancamento, GradingError} from "../grading/grading-service.js";
import {
  countTermoPendenteDiario,
  countTermoPendenteTurma,
  decideTermo,
  findDiarioForTermo,
  findProfessorByUserId,
  findTermoById,
  findTurmaForTermo,
  insertTermoIndividual,
  insertTermosTurma,
  listTermos,
  listTurmasFechadasDoProfessor,
  reopenDiariosDaTurma,
  searchDiariosDoProfessor,
} from "./termos-repository.js";
import type {
  ICreateTermoIndividualInput,
  ICreateTermoTurmaInput,
  IListTermosDiariosQuery,
  IListTermosQuery,
  IListTermosTurmasQuery,
} from "./termos-schemas.js";

export class TermosError extends Error {
  readonly statusCode: 400 | 403 | 404 | 409;

  constructor(message: string, statusCode: 400 | 403 | 404 | 409) {
    super(message);
    this.name = "TermosError";
    this.statusCode = statusCode;
  }
}

const decimalToNumber = (value: Prisma.Decimal | null) => {
  if (value === null) {
    return null;
  }

  return Number(value);
};

const mapTurmaResumo = (turma: {
  id: string;
  codigo: string;
  anoLetivo: number;
  semestreLetivo: number;
  curso: {id: string; nome: string};
  disciplina: {id: string; nome: string; codigo: string};
}) => turma;

const mapDiarioResumo = (diario: {
  id: string;
  notaAv: Prisma.Decimal | null;
  notaAvs: Prisma.Decimal | null;
  notaAv3: Prisma.Decimal | null;
  notaSemestral: Prisma.Decimal | null;
  mediaFinal: Prisma.Decimal | null;
  totalFaltas: number;
  semestreFechado: boolean;
  turma: {
    id: string;
    codigo: string;
    anoLetivo: number;
    semestreLetivo: number;
    curso: {id: string; nome: string};
    disciplina: {id: string; nome: string; codigo: string};
  };
  matricula: {aluno: {ra: string; user: {nome: string}}};
}) => {
  return {
    id: diario.id,
    notaAv: decimalToNumber(diario.notaAv),
    notaAvs: decimalToNumber(diario.notaAvs),
    notaAv3: decimalToNumber(diario.notaAv3),
    notaSemestral: decimalToNumber(diario.notaSemestral),
    mediaFinal: decimalToNumber(diario.mediaFinal),
    totalFaltas: diario.totalFaltas,
    semestreFechado: diario.semestreFechado,
    aluno: {ra: diario.matricula.aluno.ra, nome: diario.matricula.aluno.user.nome},
    turma: mapTurmaResumo(diario.turma),
  };
};

const mapTermo = (termo: {
  id: string;
  tipo: TipoTermoAbertura;
  status: StatusTermoAbertura;
  notaAv: Prisma.Decimal | null;
  notaAvs: Prisma.Decimal | null;
  notaAv3: Prisma.Decimal | null;
  totalFaltas: number | null;
  criadoEm: Date;
  decididoEm: Date | null;
  professor: {id: string; matricula: string; user: {nome: string}};
  turma: {
    id: string;
    codigo: string;
    anoLetivo: number;
    semestreLetivo: number;
    curso: {id: string; nome: string};
    disciplina: {id: string; nome: string; codigo: string};
  } | null;
  diario: Parameters<typeof mapDiarioResumo>[0] | null;
  decididoPor: {id: string; nome: string} | null;
}) => {
  return {
    id: termo.id,
    tipo: termo.tipo,
    status: termo.status,
    professor: {
      id: termo.professor.id,
      matricula: termo.professor.matricula,
      nome: termo.professor.user.nome,
    },
    turma: termo.turma ? mapTurmaResumo(termo.turma) : null,
    diario: termo.diario ? mapDiarioResumo(termo.diario) : null,
    notaAv: decimalToNumber(termo.notaAv),
    notaAvs: decimalToNumber(termo.notaAvs),
    notaAv3: decimalToNumber(termo.notaAv3),
    totalFaltas: termo.totalFaltas,
    criadoEm: dayjs(termo.criadoEm).toISOString(),
    decididoEm: termo.decididoEm ? dayjs(termo.decididoEm).toISOString() : null,
    decididoPor: termo.decididoPor,
  };
};

const requireProfessor = async (actorUserId: string) => {
  const professor = await findProfessorByUserId(actorUserId);

  if (!professor) {
    throw new TermosError("Perfil de professor não encontrado.", 403);
  }

  return professor;
};

export const fetchTurmasParaTermo = async ({
  actorUserId,
  ...query
}: IListTermosTurmasQuery & {actorUserId: string}) => {
  const professor = await requireProfessor(actorUserId);
  const turmas = await listTurmasFechadasDoProfessor({
    professorId: professor.id,
    anoLetivo: query.anoLetivo,
    semestreLetivo: query.semestreLetivo,
  });

  return turmas.map((turma) => ({
    id: turma.id,
    codigo: turma.codigo,
    anoLetivo: turma.anoLetivo,
    semestreLetivo: turma.semestreLetivo,
    curso: turma.curso,
    disciplina: turma.disciplina,
    diariosFechados: turma.diarios.filter((diario) => diario.semestreFechado).length,
    diariosTotal: turma.diarios.length,
  }));
};

export const fetchDiariosParaTermo = async ({
  actorUserId,
  q,
}: IListTermosDiariosQuery & {actorUserId: string}) => {
  const professor = await requireProfessor(actorUserId);
  const diarios = await searchDiariosDoProfessor({professorId: professor.id, q});
  return diarios.map(mapDiarioResumo);
};

export const fetchTermos = async ({
  actorRole,
  actorUserId,
  query,
}: {
  actorRole: Role;
  actorUserId: string;
  query: IListTermosQuery;
}) => {
  const professor =
    actorRole === Role.PROFESSOR ? await requireProfessor(actorUserId) : null;
  const criadoDe = query.criadoDe ? dayjs(query.criadoDe).startOf("day").toDate() : undefined;
  const criadoAte = query.criadoAte ? dayjs(query.criadoAte).endOf("day").toDate() : undefined;
  const termos = await listTermos({
    status: query.status,
    tipo: query.tipo,
    professorId: professor?.id ?? query.professorId,
    criadoDe,
    criadoAte,
  });

  return termos.map(mapTermo);
};

export const createTermosTurma = async ({
  actorUserId,
  turmaIds,
}: ICreateTermoTurmaInput & {actorUserId: string}) => {
  const professor = await requireProfessor(actorUserId);
  const uniqueIds = [...new Set(turmaIds)];

  await uniqueIds.reduce(async (previous, turmaId) => {
    await previous;
    const turma = await findTurmaForTermo(turmaId);

    if (!turma) {
      throw new TermosError("Turma não encontrada.", 404);
    }

    if (turma.professorId !== professor.id) {
      throw new TermosError("Você não é o professor responsável por esta turma.", 403);
    }

    const fechados = turma.diarios.filter((diario) => diario.semestreFechado).length;

    if (fechados === 0) {
      throw new TermosError("Só é possível solicitar abertura de turma com semestre já fechado.", 409);
    }

    const pendente = await countTermoPendenteTurma(turmaId);

    if (pendente > 0) {
      throw new TermosError("Já existe um termo pendente para esta turma.", 409);
    }
  }, Promise.resolve());

  const criados = await insertTermosTurma({professorId: professor.id, turmaIds: uniqueIds});
  return criados.map(mapTermo);
};

export const createTermoIndividual = async ({
  actorUserId,
  ...input
}: ICreateTermoIndividualInput & {actorUserId: string}) => {
  const professor = await requireProfessor(actorUserId);
  const diario = await findDiarioForTermo(input.diarioClasseId);

  if (!diario) {
    throw new TermosError("Diário de classe não encontrado.", 404);
  }

  if (diario.turma.professorId !== professor.id) {
    throw new TermosError("Você não é o professor responsável por esta turma.", 403);
  }

  if (!diario.semestreFechado) {
    throw new TermosError(
      "A turma deste aluno ainda não foi encerrada. Faça a alteração no diário regular da turma.",
      409,
    );
  }

  const pendente = await countTermoPendenteDiario(input.diarioClasseId);

  if (pendente > 0) {
    throw new TermosError("Já existe um termo pendente para este aluno nesta turma.", 409);
  }

  const criado = await insertTermoIndividual({
    professorId: professor.id,
    diarioClasseId: input.diarioClasseId,
    notaAv: input.notaAv,
    notaAvs: input.notaAvs,
    notaAv3: input.notaAv3,
    totalFaltas: input.totalFaltas,
  });

  return mapTermo(criado);
};

export const aprovarTermo = async ({id, actorUserId}: {id: string; actorUserId: string}) => {
  const termo = await findTermoById(id);

  if (!termo) {
    throw new TermosError("Solicitação não encontrada.", 404);
  }

  if (termo.status !== StatusTermoAbertura.PENDENTE) {
    throw new TermosError("Esta solicitação já foi decidida.", 409);
  }

  if (termo.tipo === TipoTermoAbertura.TURMA) {
    if (!termo.turmaId) {
      throw new TermosError("A solicitação de turma está incompleta.", 400);
    }

    const reabertos = await reopenDiariosDaTurma(termo.turmaId);

    if (reabertos.count === 0) {
      throw new TermosError("Não há diários fechados para reabrir nesta turma.", 409);
    }
  }

  if (termo.tipo === TipoTermoAbertura.INDIVIDUAL) {
    if (!termo.diarioClasseId) {
      throw new TermosError("A solicitação individual está incompleta.", 400);
    }

    try {
      await applyApprovedIndividualLancamento({
        diarioClasseId: termo.diarioClasseId,
        ...(termo.notaAv !== null ? {notaAv: Number(termo.notaAv)} : {}),
        ...(termo.notaAvs !== null ? {notaAvs: Number(termo.notaAvs)} : {}),
        ...(termo.notaAv3 !== null ? {notaAv3: Number(termo.notaAv3)} : {}),
        ...(termo.totalFaltas !== null ? {totalFaltas: termo.totalFaltas} : {}),
      });
    } catch (error) {
      if (error instanceof GradingError) {
        throw new TermosError(error.message, error.statusCode);
      }

      throw error;
    }
  }

  const atualizado = await decideTermo({
    id,
    status: StatusTermoAbertura.APROVADO,
    decididoPorId: actorUserId,
    decididoEm: dayjs().toDate(),
  });

  return mapTermo(atualizado);
};

export const recusarTermo = async ({id, actorUserId}: {id: string; actorUserId: string}) => {
  const termo = await findTermoById(id);

  if (!termo) {
    throw new TermosError("Solicitação não encontrada.", 404);
  }

  if (termo.status !== StatusTermoAbertura.PENDENTE) {
    throw new TermosError("Esta solicitação já foi decidida.", 409);
  }

  const atualizado = await decideTermo({
    id,
    status: StatusTermoAbertura.RECUSADO,
    decididoPorId: actorUserId,
    decididoEm: dayjs().toDate(),
  });

  return mapTermo(atualizado);
};
