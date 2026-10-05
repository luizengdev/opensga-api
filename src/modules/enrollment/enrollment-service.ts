import crypto from "node:crypto";

import bcrypt from "bcrypt";

import {Role, StatusMatricula} from "../../generated/prisma/enums.js";
import {dayjs} from "../../lib/dayjs.js";
import {sendCredentialsEmail} from "../../lib/mailer.js";
import {
  createPreMatricula,
  createStudentWithEnrollment,
  deleteEnrollmentById,
  findActiveMatrizByCursoId,
  findActiveMatrizById,
  findEnrollmentById,
  findMatriculaByAlunoAndCurso,
  findCandidateByCpfAndEmail,
  findUserByCpfOrEmail,
  listEnrollments,
  updateEnrollmentStatus,
} from "./enrollment-repository.js";
import type {ICreateEnrollmentInput, IListEnrollmentsQuery, IUpdateEnrollmentStatusInput} from "./enrollment-schemas.js";

export class EnrollmentError extends Error {
  readonly statusCode: 400 | 404;

  constructor(message: string, statusCode: 400 | 404) {
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
