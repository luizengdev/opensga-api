import {z} from "zod";

import {StatusFatura} from "../../generated/prisma/enums.js";

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

export const listFaturasQuerySchema = z.object({
  alunoId: z.uuid().optional(),
  status: z.enum(StatusFatura).optional(),
});

export const createFaturaSchema = z.object({
  alunoId: z.uuid(),
  descricao: z.string().min(3).max(255),
  valor: z.number().positive(),
  dataVencimento: z.iso.date(),
  stripeInvoiceId: z.string().max(100).optional(),
  stripePaymentUrl: z.string().max(500).optional(),
});

export const updateFaturaStatusSchema = z.object({
  status: z.enum(StatusFatura),
  pagoEm: z.iso.datetime().optional(),
});

export const faturaResponseSchema = z.object({
  id: z.uuid(),
  alunoId: z.uuid(),
  descricao: z.string(),
  valor: z.number(),
  dataVencimento: z.iso.datetime(),
  status: z.enum(StatusFatura),
  stripeInvoiceId: z.string().nullable(),
  stripePaymentUrl: z.string().nullable(),
  pagoEm: z.iso.datetime().nullable(),
  aluno: z.object({
    ra: z.string(),
    user: z.object({
      id: z.uuid(),
      nome: z.string(),
      email: z.email(),
    }),
  }),
});

export const faturaListResponseSchema = z.array(faturaResponseSchema);

export type IListFaturasQuery = z.infer<typeof listFaturasQuerySchema>;
export type ICreateFaturaInput = z.infer<typeof createFaturaSchema>;
export type IUpdateFaturaStatusInput = z.infer<typeof updateFaturaStatusSchema>;
export type IFaturaOutput = z.infer<typeof faturaResponseSchema>;
