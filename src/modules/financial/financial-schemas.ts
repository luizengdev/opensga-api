import {z} from "zod";

import {IntervaloCobranca, ModalidadeCurso, StatusFatura} from "../../generated/prisma/enums.js";

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
export const createCheckoutSchema = z.object({
  studentId: z.uuid(),
  email: z.email(),
  cursoModalidadeId: z.uuid(),
});

export const checkoutResponseSchema = z.object({
  url: z.url(),
  sessionId: z.string().min(1),
});

export const createPublicInscricaoSchema = z.object({
  nome: z.string().min(3).max(150),
  email: z.email().max(150),
  cpf: z.string().length(14),
  telefone: z.string().min(10).max(20).optional(),
  dataNascimento: z.iso.date(),
  cursoModalidadeId: z.uuid(),
});

export const tipoGraduacaoSchema = z.enum(["BACHARELADO", "LICENCIATURA", "TECNOLOGO"]);

export const catalogoCursoSchema = z.object({
  cursoId: z.uuid(),
  nome: z.string(),
  modalidade: z.enum(ModalidadeCurso),
  tipoGraduacao: tipoGraduacaoSchema,
  duracaoSemestres: z.number().int(),
  campus: z.object({
    nome: z.string(),
    cidade: z.string(),
    estado: z.string(),
  }),
  valor: z.number(),
  moeda: z.string(),
  intervalo: z.enum(IntervaloCobranca),
});

export const catalogoCursoListResponseSchema = z.array(catalogoCursoSchema);

export const webhookReceivedResponseSchema = z.object({
  received: z.literal(true),
});

export type IListFaturasQuery = z.infer<typeof listFaturasQuerySchema>;
export type ICreateFaturaInput = z.infer<typeof createFaturaSchema>;
export type IUpdateFaturaStatusInput = z.infer<typeof updateFaturaStatusSchema>;
export type IFaturaOutput = z.infer<typeof faturaResponseSchema>;
export type ICreateCheckoutInput = z.infer<typeof createCheckoutSchema>;
export type ICheckoutOutput = z.infer<typeof checkoutResponseSchema>;
export type ICreatePublicInscricaoInput = z.infer<typeof createPublicInscricaoSchema>;
export type ICatalogoCurso = z.infer<typeof catalogoCursoSchema>;

export const listPrecosQuerySchema = z.object({
  cursoId: z.uuid().optional(),
  ativo: z
    .union([z.boolean(), z.enum(["true", "false"])])
    .optional()
    .transform((value) => {
      if (value === undefined) {
        return undefined;
      }

      if (typeof value === "boolean") {
        return value;
      }

      return value === "true";
    }),
});

export const createPrecoCursoSchema = z.object({
  cursoId: z.uuid(),
  valor: z.number().positive(),
});

export const updatePrecoCursoSchema = z
  .object({
    valor: z.number().positive().optional(),
    ativo: z.boolean().optional(),
  })
  .refine((data) => data.valor !== undefined || data.ativo !== undefined, {
    message: "Informe valor e/ou ativo.",
  });

export const precoCursoResponseSchema = z.object({
  id: z.uuid(),
  cursoId: z.uuid(),
  valor: z.number(),
  moeda: z.string(),
  intervalo: z.enum(IntervaloCobranca),
  stripeProductId: z.string(),
  stripePriceId: z.string(),
  ativo: z.boolean(),
  criadoEm: z.iso.datetime(),
  atualizadoEm: z.iso.datetime(),
  curso: z.object({
    id: z.uuid(),
    nome: z.string(),
    modalidade: z.enum(ModalidadeCurso),
  }),
});

export const precoCursoListResponseSchema = z.array(precoCursoResponseSchema);

export type IListPrecosQuery = z.infer<typeof listPrecosQuerySchema>;
export type ICreatePrecoCursoInput = z.infer<typeof createPrecoCursoSchema>;
export type IUpdatePrecoCursoInput = z.infer<typeof updatePrecoCursoSchema>;
export type IPrecoCursoOutput = z.infer<typeof precoCursoResponseSchema>;
