import crypto from "node:crypto";

import bcrypt from "bcrypt";

import {ModalidadeCurso, Role, StatusDisciplina, StatusMatricula, TipoCampus} from "../../generated/prisma/enums.js";
import {dayjs} from "../../lib/dayjs.js";
import {sendCredentialsEmail} from "../../lib/mailer.js";
import {
  createPreMatricula,
  createStudentWithEnrollment,
  deleteEnrollmentById,
  findActiveMatrizByCursoId,
  findActiveMatrizById,
  findCursoDestinoForTransfer,
  findEnrollmentById,
  findEnrollmentForTransfer,
  findMatriculaByAlunoAndCurso,
  findOpenEnrollmentOnCurso,
  findCandidateByCpfAndEmail,
  findUserByCpfOrEmail,
  listEnrollments,
  persistInternalTransfer,
  updateEnrollmentStatus,
} from "./enrollment-repository.js";
import type {
  ICreateEnrollmentInput,
  IListEnrollmentsQuery,
  ITransferEnrollmentInput,
  IUpdateEnrollmentStatusInput,
} from "./enrollment-schemas.js";

export class EnrollmentError extends Error {
  readonly statusCode: 400 | 404 | 409;

  constructor(message: string, statusCode: 400 | 404 | 409) {
    super(message);
    this.name = "EnrollmentError";
    this.statusCode = statusCode;
  }
}

const createProvisionalPassword = async () => {
  const senhaProvisoria = crypto.randomBytes(4).toString("hex").toUpperCase();
  const senhaHash = await bcrypt.hash(senhaProvisoria, 10);
  return {senhaProvisoria, senhaHash};
};

const notifyCredentials = (input: {
  toEmail: string;
  nome: string;
  identificador: string;
  senhaProvisoria: string;
  identificadorLabel?: string;
  introducao?: string;
}) => {
  sendCredentialsEmail(input).catch((err: unknown) => {
    console.error("Erro ao enviar e-mail de acesso:", err);
  });
};

export const executeEnrollment = async (input: ICreateEnrollmentInput) => {
  const existingUser = await findUserByCpfOrEmail({
    cpf: input.cpf,
    email: input.email,
  });

  if (existingUser) {
    throw new EnrollmentError("CPF ou e-mail já cadastrado na instituição.", 400);
  }

  const validMatriz = await findActiveMatrizById({
    matrizCurricularId: input.matrizCurricularId,
    cursoId: input.cursoId,
  });

  if (!validMatriz) {
    throw new EnrollmentError("Matriz curricular não encontrada, inativa ou incompatível com o curso.", 404);
  }

  const guardian = await resolveGuardian(input);
  const studentPassword = await createProvisionalPassword();

  const enrollmentResult = await createStudentWithEnrollment({
    nome: input.nome,
    email: input.email,
    cpf: input.cpf,
    telefone: input.telefone,
    senhaHash: studentPassword.senhaHash,
    dataNascimento: dayjs(input.dataNascimento, "YYYY-MM-DD").toDate(),
    cursoId: input.cursoId,
    matrizCurricularId: input.matrizCurricularId,
    semestreIngresso: input.semestreIngresso,
    responsavelExistenteId: guardian.responsavelExistenteId,
    novoResponsavel: guardian.novoResponsavel,
  });

  notifyCredentials({
    toEmail: input.email,
    nome: input.nome,
    identificador: enrollmentResult.ra,
    senhaProvisoria: studentPassword.senhaProvisoria,
  });

  if (guardian.novoResponsavel) {
    notifyCredentials({
      toEmail: guardian.novoResponsavel.email,
      nome: guardian.novoResponsavel.nome,
      identificador: guardian.novoResponsavel.cpf,
      senhaProvisoria: guardian.senhaProvisoria,
      identificadorLabel: "CPF",
      introducao: "Seu acesso de responsável foi criado.",
    });
  }

  return enrollmentResult;
};

const currentSemestreIngresso = () => {
  const now = dayjs();
  const semestre = now.month() < 6 ? 1 : 2;
  return `${now.year()}.${semestre}`;
};

export const ensureCandidateForCheckout = async (input: {
  nome: string;
  email: string;
  cpf: string;
  telefone?: string;
  dataNascimento: string;
  cursoId: string;
}) => {
  const matriz = await findActiveMatrizByCursoId(input.cursoId);

  if (!matriz) {
    throw new EnrollmentError("Curso sem matriz curricular ativa para matrícula.", 404);
  }

  const semestreIngresso = currentSemestreIngresso();
  const email = input.email.trim().toLowerCase();
  const {userByEmail, userByCpf} = await findCandidateByCpfAndEmail({
    cpf: input.cpf,
    email,
  });

  if (userByEmail && userByCpf && userByEmail.id !== userByCpf.id) {
    throw new EnrollmentError("CPF e e-mail pertencem a cadastros diferentes.", 400);
  }

  const existingUser = userByEmail ?? userByCpf;

  if (existingUser) {
    if (existingUser.role !== Role.ALUNO || !existingUser.aluno) {
      throw new EnrollmentError("CPF ou e-mail já cadastrado na instituição.", 400);
    }

    const matricula = await findMatriculaByAlunoAndCurso({
      alunoId: existingUser.aluno.id,
      cursoId: input.cursoId,
    });

    if (!matricula) {
      await createPreMatricula({
        alunoId: existingUser.aluno.id,
        cursoId: input.cursoId,
        matrizCurricularId: matriz.id,
        semestreIngresso,
      });
    }

    return {
      alunoId: existingUser.aluno.id,
      ra: existingUser.aluno.ra,
      senhaProvisoria: null,
    };
  }

  const studentPassword = await createProvisionalPassword();
  const enrollmentResult = await createStudentWithEnrollment({
    nome: input.nome,
    email,
    cpf: input.cpf,
    telefone: input.telefone,
    senhaHash: studentPassword.senhaHash,
    dataNascimento: dayjs(input.dataNascimento, "YYYY-MM-DD").toDate(),
    cursoId: input.cursoId,
    matrizCurricularId: matriz.id,
    semestreIngresso,
    status: StatusMatricula.PRE_MATRICULADO,
  });

  notifyCredentials({
    toEmail: email,
    nome: input.nome,
    identificador: enrollmentResult.ra,
    senhaProvisoria: studentPassword.senhaProvisoria,
  });

  return {
    alunoId: enrollmentResult.alunoId,
    ra: enrollmentResult.ra,
    senhaProvisoria: studentPassword.senhaProvisoria,
  };
};

const resolveGuardian = async (input: ICreateEnrollmentInput) => {
  if (!input.responsavelCpf || !input.responsavelNome || !input.responsavelEmail || !input.parentesco) {
    return {};
  }

  if (input.responsavelCpf === input.cpf || input.responsavelEmail === input.email) {
    throw new EnrollmentError("O responsável precisa ter CPF e e-mail diferentes do estudante.", 400);
  }

  const existingGuardian = await findUserByCpfOrEmail({
    cpf: input.responsavelCpf,
    email: input.responsavelEmail,
  });

  if (existingGuardian && existingGuardian.role !== Role.RESPONSAVEL) {
    throw new EnrollmentError("CPF ou e-mail do responsável já pertence a outro perfil.", 400);
  }

  if (existingGuardian?.role === Role.RESPONSAVEL && !existingGuardian.responsavel) {
    throw new EnrollmentError("O usuário responsável não possui perfil vinculado.", 400);
  }

  if (existingGuardian?.responsavel) {
    return {responsavelExistenteId: existingGuardian.responsavel.id};
  }

  const guardianPassword = await createProvisionalPassword();

  return {
    senhaProvisoria: guardianPassword.senhaProvisoria,
    novoResponsavel: {
      nome: input.responsavelNome,
      email: input.responsavelEmail,
      cpf: input.responsavelCpf,
      senhaHash: guardianPassword.senhaHash,
      parentesco: input.parentesco,
    },
  };
};

export const fetchAllEnrollments = async (query: IListEnrollmentsQuery = {}) => {
  return listEnrollments(query.status);
};

export const fetchEnrollmentById = async (id: string) => {
  const matricula = await findEnrollmentById(id);

  if (!matricula) {
    throw new EnrollmentError("Matrícula não encontrada.", 404);
  }

  return matricula;
};

export const removeEnrollment = async (id: string) => {
  const deleted = await deleteEnrollmentById(id);

  if (!deleted) {
    throw new EnrollmentError("Matrícula não encontrada.", 404);
  }

  return deleted;
};

export const changeEnrollmentStatus = async ({
  matriculaId,
  status,
}: {
  matriculaId: string;
  status: IUpdateEnrollmentStatusInput["status"];
}) => {
  const matricula = await updateEnrollmentStatus({matriculaId, status});

  if (!matricula) {
    throw new EnrollmentError("Matrícula não encontrada.", 404);
  }

  return matricula;
};

const STATUS_ORIGEM_TRANSFERIVEL: StatusMatricula[] = [StatusMatricula.ATIVO, StatusMatricula.TRANCADO];

const normalizeCursoNome = (nome: string) => {
  return nome.trim().toLowerCase().replace(/\s+/g, " ");
};

interface IDiarioTransferencia {
  id: string;
  statusDisciplina: StatusDisciplina;
  turma: {
    disciplinaId: string;
    disciplina: {id: string; codigo: string; nome: string};
  };
}

interface ICursoTransferencia {
  id: string;
  nome: string;
  modalidade: ModalidadeCurso;
  campus: {
    id: string;
    nome: string;
    codigoPolo: string;
    tipo: TipoCampus;
  };
}

const mapDiarioTransferencia = (diario: IDiarioTransferencia) => {
  return {
    diarioId: diario.id,
    disciplinaId: diario.turma.disciplina.id,
    codigo: diario.turma.disciplina.codigo,
    nome: diario.turma.disciplina.nome,
    statusDisciplina: diario.statusDisciplina,
  };
};

const classifyHistorico = ({
  origemNome,
  destinoNome,
  diarios,
  disciplinaIdsDestino,
}: {
  origemNome: string;
  destinoNome: string;
  diarios: IDiarioTransferencia[];
  disciplinaIdsDestino: string[];
}) => {
  const mesmoCurso = normalizeCursoNome(origemNome) === normalizeCursoNome(destinoNome);

  if (mesmoCurso) {
    return {
      mesmoCurso: true,
      disciplinasTransferiveis: diarios.map(mapDiarioTransferencia),
      disciplinasNaoTransferiveis: [],
    };
  }

  const destSet = new Set(disciplinaIdsDestino);

  return {
    mesmoCurso: false,
    disciplinasTransferiveis: diarios
      .filter((diario) => destSet.has(diario.turma.disciplinaId))
      .map(mapDiarioTransferencia),
    disciplinasNaoTransferiveis: diarios
      .filter((diario) => !destSet.has(diario.turma.disciplinaId))
      .map(mapDiarioTransferencia),
  };
};

const resolveTransferPlan = async ({
  matriculaId,
  cursoId,
  matrizCurricularId,
}: {
  matriculaId: string;
  cursoId: string;
  matrizCurricularId: string;
}) => {
  const origem = await findEnrollmentForTransfer(matriculaId);

  if (!origem) {
    throw new EnrollmentError("Matrícula não encontrada.", 404);
  }

  if (!STATUS_ORIGEM_TRANSFERIVEL.includes(origem.status)) {
    throw new EnrollmentError("Só é possível transferir matrícula ativa ou trancada.", 400);
  }

  if (origem.curso.id === cursoId) {
    throw new EnrollmentError("O destino precisa ser outro curso ou polo/campus.", 400);
  }

  const destinoCurso = await findCursoDestinoForTransfer({cursoId, matrizCurricularId});
  const destinoMatriz = destinoCurso?.matrizes[0];

  if (!destinoCurso || !destinoMatriz) {
    throw new EnrollmentError("Curso de destino ou matriz curricular não encontrada, inativa ou incompatível.", 404);
  }

  const vinculoAberto = await findOpenEnrollmentOnCurso({
    alunoId: origem.alunoId,
    cursoId,
  });

  if (vinculoAberto) {
    throw new EnrollmentError("O aluno já possui matrícula em aberto no curso de destino.", 409);
  }

  const historico = classifyHistorico({
    origemNome: origem.curso.nome,
    destinoNome: destinoCurso.nome,
    diarios: origem.diarios,
    disciplinaIdsDestino: destinoMatriz.componentes.map((componente) => componente.disciplinaId),
  });

  return {
    origem,
    destinoCurso,
    destinoMatriz,
    ...historico,
  };
};

const toTransferenciaCurso = ({
  curso,
  matriz,
}: {
  curso: ICursoTransferencia;
  matriz: {id: string; nome: string; anoVigencia: number};
}) => {
  return {
    id: curso.id,
    nome: curso.nome,
    modalidade: curso.modalidade,
    campus: curso.campus,
    matriz,
  };
};

export const previewInternalTransfer = async ({
  matriculaId,
  cursoId,
  matrizCurricularId,
}: {
  matriculaId: string;
  cursoId: string;
  matrizCurricularId: string;
}) => {
  const plan = await resolveTransferPlan({matriculaId, cursoId, matrizCurricularId});

  return {
    matriculaOrigemId: plan.origem.id,
    aluno: {
      ra: plan.origem.aluno.ra,
      nome: plan.origem.aluno.user.nome,
    },
    origem: toTransferenciaCurso({
      curso: plan.origem.curso,
      matriz: plan.origem.matrizCurricular,
    }),
    destino: toTransferenciaCurso({
      curso: plan.destinoCurso,
      matriz: plan.destinoMatriz,
    }),
    mesmoCurso: plan.mesmoCurso,
    disciplinasTransferiveis: plan.disciplinasTransferiveis,
    disciplinasNaoTransferiveis: plan.disciplinasNaoTransferiveis,
  };
};

export const executeInternalTransfer = async ({
  matriculaId,
  input,
}: {
  matriculaId: string;
  input: ITransferEnrollmentInput;
}) => {
  const plan = await resolveTransferPlan({
    matriculaId,
    cursoId: input.cursoId,
    matrizCurricularId: input.matrizCurricularId,
  });

  const destino = await persistInternalTransfer({
    origemId: plan.origem.id,
    alunoId: plan.origem.alunoId,
    cursoId: plan.destinoCurso.id,
    matrizCurricularId: plan.destinoMatriz.id,
    periodoAtual: plan.origem.periodoAtual,
    semestreIngresso: plan.origem.semestreIngresso,
    diarioIds: plan.disciplinasTransferiveis.map((disciplina) => disciplina.diarioId),
  });

  return {
    matriculaOrigemId: plan.origem.id,
    matriculaDestinoId: destino.id,
    statusOrigem: StatusMatricula.TRANSFERIDO,
    statusDestino: StatusMatricula.ATIVO,
    aluno: {
      ra: plan.origem.aluno.ra,
      nome: plan.origem.aluno.user.nome,
    },
    origem: toTransferenciaCurso({
      curso: plan.origem.curso,
      matriz: plan.origem.matrizCurricular,
    }),
    destino: toTransferenciaCurso({
      curso: plan.destinoCurso,
      matriz: plan.destinoMatriz,
    }),
    mesmoCurso: plan.mesmoCurso,
    disciplinasTransferiveis: plan.disciplinasTransferiveis,
    disciplinasNaoTransferiveis: plan.disciplinasNaoTransferiveis,
  };
};
