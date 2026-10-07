import {Role, StatusMatricula} from "../../generated/prisma/enums.js";
import {dayjs} from "../../lib/dayjs.js";
import {
  chTotalDoComponente,
  decimalToNumber,
  findLatestMatriculaByAlunoId,
  findPortalActor,
  insertPortalReclamacao,
  listComunicadosForRole,
  listDiariosByMatriculaId,
  listFaturasByAlunoId,
  listReclamacoesByUsuarioId,
  somaChAprovada,
} from "./portal-repository.js";
import type {
  ICreatePortalReclamacaoInput,
  IPortalContextoOutput,
  IPortalContextoQuery,
} from "./portal-schemas.js";

export class PortalError extends Error {
  readonly statusCode: 400 | 403 | 404;

  constructor(message: string, statusCode: 400 | 403 | 404) {
    super(message);
    this.name = "PortalError";
    this.statusCode = statusCode;
  }
}

const mapDependentes = (
  alunos: Array<{
    id: string;
    ra: string;
    user: {nome: string; avatarUrl: string | null};
    matriculas: Array<{
      status: StatusMatricula;
      periodoAtual: number;
      curso: {nome: string};
    }>;
  }>,
) => {
  return alunos.map((aluno) => {
    const matricula = aluno.matriculas[0];

    return {
      id: aluno.id,
      nome: aluno.user.nome,
      ra: aluno.ra,
      curso: matricula?.curso.nome ?? "",
      periodo: matricula?.periodoAtual ?? 0,
      statusMatricula: matricula?.status ?? StatusMatricula.PRE_MATRICULADO,
      avatarUrl: aluno.user.avatarUrl,
    };
  });
};

const mapProfile = (actor: NonNullable<Awaited<ReturnType<typeof findPortalActor>>>) => {
  return {
    id: actor.id,
    nome: actor.nome,
    email: actor.email,
    cpf: actor.cpf,
    role: actor.role,
    avatarUrl: actor.avatarUrl,
    ativo: actor.ativo,
    aluno: actor.aluno,
    professor: actor.professor,
    dependentes: mapDependentes(actor.responsavel?.alunos ?? []),
  };
};

const emptyContexto = ({
  profile,
  alunoId,
}: {
  profile: IPortalContextoOutput["profile"];
  alunoId: string | null;
}): IPortalContextoOutput => {
  return {
    profile,
    alunoId,
    matricula: null,
    disciplinas: [],
    matriz: [],
    faturas: [],
    comunicados: [],
    ouvidoria: [],
  };
};

const resolveAlvoAlunoId = ({
  actor,
  alunoId,
}: {
  actor: NonNullable<Awaited<ReturnType<typeof findPortalActor>>>;
  alunoId?: string;
}) => {
  if (actor.role === Role.ALUNO) {
    if (!actor.aluno) {
      return null;
    }

    if (alunoId !== undefined && alunoId !== actor.aluno.id) {
      throw new PortalError("Você só pode consultar o próprio vínculo acadêmico.", 403);
    }

    return actor.aluno.id;
  }

  const dependentes = actor.responsavel?.alunos ?? [];

  if (dependentes.length === 0) {
    return null;
  }

  if (alunoId === undefined) {
    return dependentes[0].id;
  }

  const autorizado = dependentes.some((dependente) => dependente.id === alunoId);

  if (!autorizado) {
    throw new PortalError("Este dependente não está vinculado à sua guarda.", 403);
  }

  return alunoId;
};

const loadContextoDoAluno = async ({
  actor,
  alunoId,
}: {
  actor: NonNullable<Awaited<ReturnType<typeof findPortalActor>>>;
  alunoId: string;
}): Promise<IPortalContextoOutput> => {
  const profile = mapProfile(actor);
  const [matricula, faturas, comunicados, ouvidoria] = await Promise.all([
    findLatestMatriculaByAlunoId({alunoId}),
    listFaturasByAlunoId({alunoId}),
    listComunicadosForRole({role: actor.role}),
    listReclamacoesByUsuarioId({usuarioId: actor.id}),
  ]);

  if (!matricula) {
    return {
      ...emptyContexto({profile, alunoId}),
      faturas: faturas.map((fatura) => ({
        id: fatura.id,
        descricao: fatura.descricao,
        valor: Number(fatura.valor),
        dataVencimento: dayjs(fatura.dataVencimento).toISOString(),
        status: fatura.status,
        stripePaymentUrl: fatura.stripePaymentUrl,
        pagoEm: fatura.pagoEm ? dayjs(fatura.pagoEm).toISOString() : null,
      })),
      comunicados: comunicados.map((comunicado) => ({
        ...comunicado,
        criadoEm: dayjs(comunicado.criadoEm).toISOString(),
      })),
      ouvidoria: ouvidoria.map((reclamacao) => ({
        ...reclamacao,
        criadoEm: dayjs(reclamacao.criadoEm).toISOString(),
      })),
    };
  }

  const diarios = await listDiariosByMatriculaId({matriculaId: matricula.id});
  const componentes = matricula.matrizCurricular.componentes;
  const chTotalCurso = componentes.reduce((total, componente) => total + componente.chTotal, 0);
  const chIntegralizada = somaChAprovada(diarios);

  const disciplinas = diarios.map((diario) => {
    return {
      id: diario.id,
      codigoTurma: diario.turma.codigo,
      codigoDisciplina: diario.turma.disciplina.codigo,
      nomeDisciplina: diario.turma.disciplina.nome,
      professorNome: diario.turma.professor.user.nome,
      horario: diario.turma.horario,
      salaOuLink: diario.turma.salaOuLink,
      tipoEntrega: diario.turma.tipoEntrega,
      anoLetivo: diario.turma.anoLetivo,
      semestreLetivo: diario.turma.semestreLetivo,
      chTotal: chTotalDoComponente({
        componentes: componentes.map((componente) => ({
          disciplinaId: componente.disciplina.id,
          chTotal: componente.chTotal,
        })),
        disciplinaId: diario.turma.disciplina.id,
      }),
      chCumprida: diario.chCumprida,
      totalFaltas: diario.totalFaltas,
      notaAv: decimalToNumber(diario.notaAv),
      notaAvs: decimalToNumber(diario.notaAvs),
      notaAv3: decimalToNumber(diario.notaAv3),
      notaSemestral: decimalToNumber(diario.notaSemestral),
      mediaFinal: decimalToNumber(diario.mediaFinal),
      habilitaAv3: diario.habilitaAv3,
      statusDisciplina: diario.statusDisciplina,
      semestreFechado: diario.semestreFechado,
    };
  });

  const diariosPorDisciplina = new Map(
    diarios.map((diario) => [diario.turma.disciplina.id, diario] as const),
  );

  const matriz = componentes.map((componente) => {
    const diario = diariosPorDisciplina.get(componente.disciplina.id);
    const notaFinal = diario
      ? decimalToNumber(diario.mediaFinal) ?? decimalToNumber(diario.notaSemestral)
      : null;

    return {
      id: componente.id,
      codigo: componente.disciplina.codigo,
      nome: componente.disciplina.nome,
      semestreIdeal: componente.semestreIdeal,
      tipo: componente.tipo,
      chTotal: componente.chTotal,
      statusDisciplina: diario?.statusDisciplina ?? null,
      notaFinal: diario?.semestreFechado ? notaFinal : null,
    };
  });

  return {
    profile,
    alunoId,
    matricula: {
      id: matricula.id,
      ra: matricula.aluno.ra,
      status: matricula.status,
      periodoAtual: matricula.periodoAtual,
      semestreIngresso: matricula.semestreIngresso,
      curso: matricula.curso,
      matrizCurricular: {
        id: matricula.matrizCurricular.id,
        nome: matricula.matrizCurricular.nome,
        anoVigencia: matricula.matrizCurricular.anoVigencia,
        chTotalCurso,
        chIntegralizada,
      },
    },
    disciplinas,
    matriz,
    faturas: faturas.map((fatura) => ({
      id: fatura.id,
      descricao: fatura.descricao,
      valor: Number(fatura.valor),
      dataVencimento: dayjs(fatura.dataVencimento).toISOString(),
      status: fatura.status,
      stripePaymentUrl: fatura.stripePaymentUrl,
      pagoEm: fatura.pagoEm ? dayjs(fatura.pagoEm).toISOString() : null,
    })),
    comunicados: comunicados.map((comunicado) => ({
      ...comunicado,
      criadoEm: dayjs(comunicado.criadoEm).toISOString(),
    })),
    ouvidoria: ouvidoria.map((reclamacao) => ({
      ...reclamacao,
      criadoEm: dayjs(reclamacao.criadoEm).toISOString(),
    })),
  };
};

export const fetchPortalContexto = async ({
  actorUserId,
  query,
}: {
  actorUserId: string;
  query: IPortalContextoQuery;
}): Promise<IPortalContextoOutput> => {
  const actor = await findPortalActor({userId: actorUserId});

  if (!actor) {
    throw new PortalError("Usuário não encontrado.", 404);
  }

  const profile = mapProfile(actor);
  const alunoId = resolveAlvoAlunoId({actor, alunoId: query.alunoId});

  if (!alunoId) {
    const [comunicados, ouvidoria] = await Promise.all([
      listComunicadosForRole({role: actor.role}),
      listReclamacoesByUsuarioId({usuarioId: actor.id}),
    ]);

    return {
      ...emptyContexto({profile, alunoId: null}),
      comunicados: comunicados.map((comunicado) => ({
        ...comunicado,
        criadoEm: dayjs(comunicado.criadoEm).toISOString(),
      })),
      ouvidoria: ouvidoria.map((reclamacao) => ({
        ...reclamacao,
        criadoEm: dayjs(reclamacao.criadoEm).toISOString(),
      })),
    };
  }

  return loadContextoDoAluno({actor, alunoId});
};

export const createPortalReclamacao = async ({
  actorUserId,
  data,
}: {
  actorUserId: string;
  data: ICreatePortalReclamacaoInput;
}) => {
  const actor = await findPortalActor({userId: actorUserId});

  if (!actor) {
    throw new PortalError("Usuário não encontrado.", 404);
  }

  const reclamacao = await insertPortalReclamacao({usuarioId: actor.id, data});

  return {
    ...reclamacao,
    criadoEm: dayjs(reclamacao.criadoEm).toISOString(),
  };
};
