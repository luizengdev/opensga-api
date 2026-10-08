import {z} from "zod";

import {StatusTermoAbertura, TipoTermoAbertura} from "../../generated/prisma/enums.js";

export const idParamsSchema = z.object({
  id: z.uuid(),
});

export const errorResponseSchema = z.object({
  error: z.string(),
  message: z.string().optional(),
});

export const listTermosQuerySchema = z.object({
  status: z.enum(StatusTermoAbertura).optional(),
  tipo: z.enum(TipoTermoAbertura).optional(),
  professorId: z.uuid().optional(),
  criadoDe: z.iso.date().optional(),
  criadoAte: z.iso.date().optional(),
});

export const listTermosTurmasQuerySchema = z.object({
  anoLetivo: z.coerce.number().int().min(2020).optional(),
  semestreLetivo: z.coerce.number().int().min(1).max(2).optional(),
});

export const listTermosDiariosQuerySchema = z.object({
  q: z.string().trim().min(2).max(120),
});

export const createTermoTurmaSchema = z.object({
  turmaIds: z.array(z.uuid()).min(1),
});

export const createTermoIndividualSchema = z
  .object({
    diarioClasseId: z.uuid(),
    notaAv: z.number().min(0).max(10).optional(),
    notaAvs: z.number().min(0).max(10).optional(),
    notaAv3: z.number().min(0).max(10).optional(),
    totalFaltas: z.number().int().min(0).optional(),
  })
  .refine(
    (payload) =>
      payload.notaAv !== undefined ||
      payload.notaAvs !== undefined ||
      payload.notaAv3 !== undefined ||
      payload.totalFaltas !== undefined,
    {message: "Informe ao menos uma nota ou o total de faltas."},
  );

const professorResumoSchema = z.object({
  id: z.uuid(),
  matricula: z.string(),
  nome: z.string(),
});

const turmaResumoSchema = z.object({
  id: z.uuid(),
  codigo: z.string(),
  anoLetivo: z.number().int(),
  semestreLetivo: z.number().int(),
  curso: z.object({id: z.uuid(), nome: z.string()}),
  disciplina: z.object({id: z.uuid(), nome: z.string(), codigo: z.string()}),
});

const diarioResumoSchema = z.object({
  id: z.uuid(),
  notaAv: z.number().min(0).max(10).nullable(),
  notaAvs: z.number().min(0).max(10).nullable(),
  notaAv3: z.number().min(0).max(10).nullable(),
  notaSemestral: z.number().min(0).max(10).nullable(),
  mediaFinal: z.number().min(0).max(10).nullable(),
  totalFaltas: z.number().int(),
  semestreFechado: z.boolean(),
  aluno: z.object({ra: z.string(), nome: z.string()}),
  turma: turmaResumoSchema,
});

export const termoTurmaDisponivelSchema = z.object({
  id: z.uuid(),
  codigo: z.string(),
  anoLetivo: z.number().int(),
  semestreLetivo: z.number().int(),
  curso: z.object({id: z.uuid(), nome: z.string()}),
  disciplina: z.object({id: z.uuid(), nome: z.string(), codigo: z.string()}),
  diariosFechados: z.number().int(),
  diariosTotal: z.number().int(),
});

export const termoResponseSchema = z.object({
  id: z.uuid(),
  tipo: z.enum(TipoTermoAbertura),
  status: z.enum(StatusTermoAbertura),
  professor: professorResumoSchema,
  turma: turmaResumoSchema.nullable(),
  diario: diarioResumoSchema.nullable(),
  notaAv: z.number().min(0).max(10).nullable(),
  notaAvs: z.number().min(0).max(10).nullable(),
  notaAv3: z.number().min(0).max(10).nullable(),
  totalFaltas: z.number().int().nullable(),
  criadoEm: z.iso.datetime(),
  decididoEm: z.iso.datetime().nullable(),
  decididoPor: z
    .object({
      id: z.uuid(),
      nome: z.string(),
    })
    .nullable(),
});

export const termoListResponseSchema = z.array(termoResponseSchema);
export const termoTurmaListResponseSchema = z.array(termoTurmaDisponivelSchema);
export const termoDiarioListResponseSchema = z.array(diarioResumoSchema);

export type IListTermosQuery = z.infer<typeof listTermosQuerySchema>;
export type IListTermosTurmasQuery = z.infer<typeof listTermosTurmasQuerySchema>;
export type IListTermosDiariosQuery = z.infer<typeof listTermosDiariosQuerySchema>;
export type ICreateTermoTurmaInput = z.infer<typeof createTermoTurmaSchema>;
export type ICreateTermoIndividualInput = z.infer<typeof createTermoIndividualSchema>;
