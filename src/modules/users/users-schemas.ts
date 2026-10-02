import {z} from "zod";

import {Role} from "../../generated/prisma/enums.js";

export const idParamsSchema = z.object({
  id: z.uuid(),
});

export const errorResponseSchema = z.object({
  error: z.string(),
  message: z.string().optional(),
});

export const deleteResponseSchema = z.object({
  id: z.uuid(),
});

export const listUsersQuerySchema = z.object({
  role: z.enum(Role).optional(),
});

const userBaseFields = {
  nome: z.string().min(3).max(150),
  email: z.email().max(150),
  cpf: z.string().length(14),
  telefone: z.string().min(10).max(20).optional(),
};

export const createAdminSchema = z.object({
  ...userBaseFields,
  senha: z.string().min(8).max(72),
});

export const updateUserSchema = z.object({
  nome: z.string().min(3).max(150).optional(),
  telefone: z.string().min(10).max(20).nullable().optional(),
  avatarUrl: z.string().max(500).nullable().optional(),
  ativo: z.boolean().optional(),
});

export const createProfessorSchema = z.object({
  ...userBaseFields,
  senha: z.string().min(8).max(72),
  matricula: z.string().min(3).max(30),
  titulacao: z.string().min(3).max(50),
  departamento: z.string().min(2).max(100),
});

export const updateProfessorSchema = z.object({
  nome: z.string().min(3).max(150).optional(),
  telefone: z.string().min(10).max(20).nullable().optional(),
  ativo: z.boolean().optional(),
  titulacao: z.string().min(3).max(50).optional(),
  departamento: z.string().min(2).max(100).optional(),
});

export const userResponseSchema = z.object({
  id: z.uuid(),
  nome: z.string(),
  email: z.email(),
  cpf: z.string(),
  telefone: z.string().nullable(),
  avatarUrl: z.string().nullable(),
  role: z.enum(Role),
  ativo: z.boolean(),
});

export const userListResponseSchema = z.array(userResponseSchema);

export const professorResponseSchema = z.object({
  id: z.uuid(),
  matricula: z.string(),
  titulacao: z.string(),
  departamento: z.string(),
  user: userResponseSchema,
});

export const professorListResponseSchema = z.array(professorResponseSchema);

export const alunoResponseSchema = z.object({
  id: z.uuid(),
  ra: z.string(),
  dataNascimento: z.iso.datetime(),
  responsavelId: z.uuid().nullable(),
  user: userResponseSchema,
});

export const alunoListResponseSchema = z.array(alunoResponseSchema);

export const responsavelResponseSchema = z.object({
  id: z.uuid(),
  parentesco: z.string(),
  user: userResponseSchema,
});

export const responsavelListResponseSchema = z.array(responsavelResponseSchema);

export type IListUsersQuery = z.infer<typeof listUsersQuerySchema>;
export type ICreateAdminInput = z.infer<typeof createAdminSchema>;
export type IUpdateUserInput = z.infer<typeof updateUserSchema>;
export type ICreateProfessorInput = z.infer<typeof createProfessorSchema>;
export type IUpdateProfessorInput = z.infer<typeof updateProfessorSchema>;
