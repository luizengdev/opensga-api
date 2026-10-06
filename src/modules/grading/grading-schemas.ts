import {z} from "zod";

import {StatusDisciplina} from "../../generated/prisma/enums.js";

export const enrollInTurmaSchema = z.object({
  matriculaId: z.uuid(),
  turmaId: z.uuid(),
});

export const updateGradesSchema = z.object({
  diarioClasseId: z.uuid(),
  notaAv: z.number().min(0).max(10).optional(),
  notaAvs: z.number().min(0).max(10).optional(),
  notaAv3: z.number().min(0).max(10).optional(),
  totalFaltas: z.number().int().min(0).optional(),
});

export const fecharSemestreSchema = z.object({
  turmaId: z.uuid(),
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
  notaAv: notaSchema,
  notaAvs: notaSchema,
  notaAv3: notaSchema,
  notaSemestral: notaSchema,
  mediaFinal: notaSchema,
  habilitaAv3: z.boolean(),
  totalFaltas: z.number().int(),
  chCumprida: z.number().int(),
  statusDisciplina: z.enum(StatusDisciplina),
  semestreFechado: z.boolean(),
});

export const idParamsSchema = z.object({
  id: z.uuid(),
});

export const listDiariosQuerySchema = z.object({
  turmaId: z.uuid().optional(),
  matriculaId: z.uuid().optional(),
});

export const deleteResponseSchema = z.object({
  id: z.uuid(),
});

export const diarioResponseSchema = z.object({
  id: z.uuid(),
  matriculaId: z.uuid(),
  turmaId: z.uuid(),
  notaAv: notaSchema,
  notaAvs: notaSchema,
  notaAv3: notaSchema,
  notaSemestral: notaSchema,
  mediaFinal: notaSchema,
  habilitaAv3: z.boolean(),
  totalFaltas: z.number().int(),
  chCumprida: z.number().int(),
  statusDisciplina: z.enum(StatusDisciplina),
  semestreFechado: z.boolean(),
  turma: z.object({
    id: z.uuid(),
    codigo: z.string(),
    disciplina: z.object({
      id: z.uuid(),
      nome: z.string(),
      codigo: z.string(),
    }),
  }),
  aluno: z.object({
    ra: z.string(),
    nome: z.string(),
  }),
});

export const diarioListResponseSchema = z.array(diarioResponseSchema);

export const fecharSemestreResponseSchema = z.object({
  turmaId: z.uuid(),
  fechados: z.number().int(),
  diarios: z.array(avaliacaoResponseSchema),
});

export type IEnrollInTurmaInput = z.infer<typeof enrollInTurmaSchema>;
export type IUpdateGradesInput = z.infer<typeof updateGradesSchema>;
export type IFecharSemestreInput = z.infer<typeof fecharSemestreSchema>;
export type IAvaliacaoOutput = z.infer<typeof avaliacaoResponseSchema>;
export type IListDiariosQuery = z.infer<typeof listDiariosQuerySchema>;
export type IDiarioOutput = z.infer<typeof diarioResponseSchema>;
export type IFecharSemestreOutput = z.infer<typeof fecharSemestreResponseSchema>;
