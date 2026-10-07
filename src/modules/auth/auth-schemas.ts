import {z} from "zod";

import {Role, StatusMatricula} from "../../generated/prisma/enums.js";

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

export const changePasswordSchema = z.object({
  senhaAtual: z.string().min(6),
  senhaNova: z.string().min(8).max(72),
});

export const meResponseSchema = z.object({
  id: z.uuid(),
  nome: z.string(),
  email: z.email(),
  cpf: z.string(),
  role: z.enum(Role),
  avatarUrl: z.string().nullable(),
  ativo: z.boolean(),
  aluno: z
    .object({
      id: z.uuid(),
      ra: z.string(),
    })
    .nullable(),
  professor: z
    .object({
      id: z.uuid(),
      matricula: z.string(),
      titulacao: z.string(),
    })
    .nullable(),
  dependentes: z.array(
    z.object({
      id: z.uuid(),
      nome: z.string(),
      ra: z.string(),
      curso: z.string(),
      periodo: z.number().int(),
      statusMatricula: z.enum(StatusMatricula),
      avatarUrl: z.string().nullable(),
    }),
  ),
});

export const errorResponseSchema = z.object({
  error: z.string(),
  message: z.string().optional(),
});

export const messageResponseSchema = z.object({
  message: z.string(),
});

export const renewSessionResponseSchema = z.object({
  token: z.string(),
});

export type ILoginInput = z.infer<typeof loginSchema>;
export type ILoginResponse = z.infer<typeof loginResponseSchema>;
export type IChangePasswordInput = z.infer<typeof changePasswordSchema>;
export type IMeResponse = z.infer<typeof meResponseSchema>;
export type IRenewSessionResponse = z.infer<typeof renewSessionResponseSchema>;
export type IErrorResponse = z.infer<typeof errorResponseSchema>;
