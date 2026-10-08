import {z} from "zod";

export const errorResponseSchema = z.object({
  error: z.string(),
  message: z.string().optional(),
});

const cnpjSchema = z
  .string()
  .max(18)
  .refine((valor) => valor.length === 0 || /^\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2}$/.test(valor), {
    message: "Informe o CNPJ no formato 00.000.000/0000-00 ou deixe em branco.",
  });

export const updateParametrizacoesSchema = z
  .object({
    nomeIes: z.string().min(3).max(120).optional(),
    siglaIes: z.string().min(2).max(20).optional(),
    mantenedora: z.string().max(200).optional(),
    cnpj: cnpjSchema.optional(),
    anoLetivo: z.number().int().min(2020).max(2100).optional(),
    semestreLetivo: z.number().int().min(1).max(2).optional(),
    periodoAutomatico: z.boolean().optional(),
    corteAprovacaoDireta: z.number().min(0).max(10).optional(),
    corteMediaFinal: z.number().min(0).max(10).optional(),
    limiteFaltasPercentual: z.number().min(1).max(50).optional(),
    percentualMinimoExtensao: z.number().min(10).max(50).optional(),
  })
  .refine((payload) => Object.keys(payload).length > 0, {
    message: "Informe ao menos um campo para atualizar.",
  });

export const parametrizacoesSchema = z.object({
  id: z.uuid(),
  nomeIes: z.string(),
  siglaIes: z.string(),
  mantenedora: z.string(),
  cnpj: z.string(),
  anoLetivo: z.number().int(),
  semestreLetivo: z.number().int(),
  periodoAutomatico: z.boolean(),
  corteAprovacaoDireta: z.number(),
  corteMediaFinal: z.number(),
  limiteFaltasPercentual: z.number(),
  percentualMinimoExtensao: z.number(),
  atualizadoEm: z.iso.datetime(),
});

export type IUpdateParametrizacoesInput = z.infer<typeof updateParametrizacoesSchema>;
export type IParametrizacoesOutput = z.infer<typeof parametrizacoesSchema>;
