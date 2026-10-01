import crypto from "node:crypto";

import bcrypt from "bcrypt";

import {Role} from "../../generated/prisma/enums.js";
import {sendCredentialsEmail} from "../../lib/mailer.js";
import {
  createStudentWithEnrollment,
  findActiveMatrizById,
  findUserByCpfOrEmail,
  listEnrollments,
  updateEnrollmentStatus,
} from "./enrollment-repository.js";
import type {ICreateEnrollmentInput, IUpdateEnrollmentStatusInput} from "./enrollment-schemas.js";

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
    dataNascimento: new Date(input.dataNascimento),
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

export const fetchAllEnrollments = async () => {
  return listEnrollments();
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
