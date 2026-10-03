import crypto from "node:crypto";

import {Prisma} from "../../generated/prisma/client.js";
import {Role, StatusMatricula} from "../../generated/prisma/enums.js";
import {dayjs} from "../../lib/dayjs.js";
import {prisma} from "../../lib/db.js";

export interface INovoResponsavelTx {
  nome: string;
  email: string;
  cpf: string;
  senhaHash: string;
  parentesco: string;
}

export interface ICreateStudentTxData {
  nome: string;
  email: string;
  cpf: string;
  telefone?: string;
  senhaHash: string;
  dataNascimento: Date;
  cursoId: string;
  matrizCurricularId: string;
  semestreIngresso: string;
  responsavelExistenteId?: string;
  novoResponsavel?: INovoResponsavelTx;
}

const generateAcademicRecord = () => {
  const currentYear = dayjs().year();
  const suffix = crypto.randomInt(100000, 1_000_000);
  return `${currentYear}${suffix}`;
};

const uniqueTargetIncludes = (error: Prisma.PrismaClientKnownRequestError, field: string) => {
  const target = error.meta?.target;

  if (Array.isArray(target)) {
    return target.includes(field);
  }

  return target === field;
};

const isKnownRequestError = (error: unknown): error is Prisma.PrismaClientKnownRequestError => {
  return error instanceof Prisma.PrismaClientKnownRequestError;
};

export const findUserByCpfOrEmail = async ({cpf, email}: {cpf: string; email: string}) => {
  return prisma.user.findFirst({
    where: {
      OR: [{cpf}, {email}],
    },
    select: {
      id: true,
      role: true,
      responsavel: {select: {id: true}},
    },
  });
};

export const findActiveMatrizById = async ({
  matrizCurricularId,
  cursoId,
}: {
  matrizCurricularId: string;
  cursoId: string;
}) => {
  return prisma.matrizCurricular.findFirst({
    where: {
      id: matrizCurricularId,
      cursoId,
      ativo: true,
    },
    select: {id: true},
  });
};

export const createStudentWithEnrollment = async (input: ICreateStudentTxData) => {
  return prisma.$transaction(async (tx) => {
    let responsavelId = input.responsavelExistenteId;

    if (input.novoResponsavel) {
      const responsavelUser = await tx.user.create({
        data: {
          nome: input.novoResponsavel.nome,
          email: input.novoResponsavel.email,
          cpf: input.novoResponsavel.cpf,
          senhaHash: input.novoResponsavel.senhaHash,
          role: Role.RESPONSAVEL,
        },
        select: {id: true},
      });

      const responsavel = await tx.responsavel.create({
        data: {
          userId: responsavelUser.id,
          parentesco: input.novoResponsavel.parentesco,
        },
        select: {id: true},
      });

      responsavelId = responsavel.id;
    }

    const user = await tx.user.create({
      data: {
        nome: input.nome,
        email: input.email,
        cpf: input.cpf,
        telefone: input.telefone,
        senhaHash: input.senhaHash,
        role: Role.ALUNO,
      },
      select: {id: true},
    });

    const aluno = await createAlunoWithUniqueRa(tx, {
      userId: user.id,
      dataNascimento: input.dataNascimento,
      responsavelId,
    });

    const matricula = await tx.matricula.create({
      data: {
        alunoId: aluno.id,
        cursoId: input.cursoId,
        matrizCurricularId: input.matrizCurricularId,
        semestreIngresso: input.semestreIngresso,
        status: StatusMatricula.ATIVO,
        periodoAtual: 1,
      },
      select: {
        id: true,
        matrizCurricular: {select: {nome: true}},
      },
    });

    return {
      ra: aluno.ra,
      matriculaId: matricula.id,
      matrizNome: matricula.matrizCurricular.nome,
    };
  });
};

const createAlunoWithUniqueRa = async (
  tx: Prisma.TransactionClient,
  {
    userId,
    dataNascimento,
    responsavelId,
  }: {
    userId: string;
    dataNascimento: Date;
    responsavelId?: string;
  },
) => {
  const maxAttempts = 5;

  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    try {
      return await tx.aluno.create({
        data: {
          userId,
          ra: generateAcademicRecord(),
          dataNascimento,
          responsavelId,
        },
        select: {id: true, ra: true},
      });
    } catch (error) {
      const raConflict = isKnownRequestError(error) && error.code === "P2002" && uniqueTargetIncludes(error, "ra");

      if (!raConflict || attempt === maxAttempts) {
        throw error;
      }
    }
  }

  throw new Error("Não foi possível gerar um RA único.");
};

const enrollmentSelect = {
  id: true,
  status: true,
  periodoAtual: true,
  semestreIngresso: true,
  curso: {select: {id: true, nome: true, modalidade: true}},
  matrizCurricular: {select: {id: true, nome: true, anoVigencia: true}},
  aluno: {
    select: {
      ra: true,
      user: {select: {id: true, nome: true, email: true, cpf: true, ativo: true}},
    },
  },
} as const;

export const listEnrollments = async (status?: StatusMatricula) => {
  return prisma.matricula.findMany({
    where: status ? {status} : undefined,
    select: enrollmentSelect,
    orderBy: {criadoEm: "desc"},
  });
};

export const findEnrollmentById = async (id: string) => {
  return prisma.matricula.findUnique({
    where: {id},
    select: enrollmentSelect,
  });
};

export const deleteEnrollmentById = async (id: string) => {
  try {
    return await prisma.matricula.delete({
      where: {id},
      select: {id: true},
    });
  } catch (error) {
    if (isKnownRequestError(error) && error.code === "P2025") {
      return null;
    }

    throw error;
  }
};

export const updateEnrollmentStatus = async ({
  matriculaId,
  status,
}: {
  matriculaId: string;
  status: StatusMatricula;
}) => {
  try {
    return await prisma.matricula.update({
      where: {id: matriculaId},
      data: {status},
      select: {id: true, status: true},
    });
  } catch (error) {
    if (isKnownRequestError(error) && error.code === "P2025") {
      return null;
    }

    throw error;
  }
};
