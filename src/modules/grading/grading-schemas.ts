import {z} from "zod";

export const enrollInTurmaSchema = z.object({
  matriculaId: z.uuid(),
  turmaId: z.uuid(),
});

export const updateGradesSchema = z.object({
  diarioClasseId: z.uuid(),
  notaA1: z.number().min(0).max(10).optional(),
  notaA2: z.number().min(0).max(10).optional(),
  notaAF: z.number().min(0).max(10).optional(),
  totalFaltas: z.number().int().min(0).optional(),
});

const notaSchema = z.number().min(0).max(10).nullable();

export const errorResponseSchema = z.object({
  error: z.string(),
  message: z.string().optional(),
});

export const enturmacaoResponseSchema = z.object({
  id: z.uuid(),
  matriculaId: z.uuid(),
  turmaId: z.uuid(),
  disciplina: z.object({
    id: z.uuid(),
    nome: z.string(),
    codigo: z.string(),
  }),
  aluno: z.object({
    ra: z.string(),
    nome: z.string(),
  }),
});

export const avaliacaoResponseSchema = z.object({
  id: z.uuid(),
  notaA1: notaSchema,
  notaA2: notaSchema,
  notaAF: notaSchema,
  notaFinal: notaSchema,
  totalFaltas: z.number().int(),
  chCumprida: z.number().int(),
  aprovado: z.boolean().nullable(),
});

export type IEnrollInTurmaInput = z.infer<typeof enrollInTurmaSchema>;
export type IUpdateGradesInput = z.infer<typeof updateGradesSchema>;
export type IAvaliacaoOutput = z.infer<typeof avaliacaoResponseSchema>;
