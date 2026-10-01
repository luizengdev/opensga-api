import {z} from "zod";

import {Role} from "../../generated/prisma/client.js";

export const loginSchema = z.object({
  identificador: z.string().min(3, "Informe seu e-mail, CPF ou RA."),
  senha: z.string().min(6, "A senha deve ter no mínimo 6 caracteres."),
});

export const loginResponseSchema = z.object({
  token: z.string(),
  user: z.object({
    id: z.uuid(),
    nome: z.string(),
    email: z.email(),
    cpf: z.string(),
    role: z.enum(Role),
    avatarUrl: z.string().nullable(),
  }),
});

export const meResponseSchema = z.object({
  id: z.uuid(),
  nome: z.string(),
  email: z.email(),
  cpf: z.string(),
  role: z.enum(Role),
  avatarUrl: z.string().nullable(),
  aluno: z
    .object({
      ra: z.string(),
    })
    .nullable(),
  professor: z
    .object({
      matricula: z.string(),
      titulacao: z.string(),
    })
    .nullable(),
});

export const errorResponseSchema = z.object({
  error: z.string(),
  message: z.string().optional(),
});

export const messageResponseSchema = z.object({
  message: z.string(),
});

export type ILoginInput = z.infer<typeof loginSchema>;
export type ILoginResponse = z.infer<typeof loginResponseSchema>;
export type IMeResponse = z.infer<typeof meResponseSchema>;
export type IErrorResponse = z.infer<typeof errorResponseSchema>;
