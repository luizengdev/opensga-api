import {z} from "zod";

import {TipoComponente, TipoEntrega} from "../../generated/prisma/enums.js";

export const createMatrizSchema = z.object({
  cursoId: z.uuid(),
  nome: z.string().min(3).max(100),
  anoVigencia: z.number().int().min(2020).max(2040),
});

export const addComponenteMatrizSchema = z.object({
  matrizCurricularId: z.uuid(),
  disciplinaId: z.uuid(),
  semestreIdeal: z.number().int().min(1).max(16),
  tipo: z.enum(TipoComponente),
  tipoEntrega: z.enum(TipoEntrega),
  chTotal: z.number().int().min(10),
  chPresencial: z.number().int().min(0).default(0),
  chSincrona: z.number().int().min(0).default(0),
  chAssincrona: z.number().int().min(0).default(0),
  chExtensao: z.number().int().min(0).default(0),
});

export const createTurmaSchema = z.object({
  campusId: z.uuid(),
  disciplinaId: z.uuid(),
  professorId: z.uuid(),
  codigo: z.string().min(3).max(50),
  anoLetivo: z.number().int().min(2020),
  semestreLetivo: z.number().int().min(1).max(2),
  capacidade: z.number().int().min(1).default(60),
  horario: z.string().min(3).max(100),
  salaOuLink: z.string().max(255).optional(),
  tipoEntrega: z.enum(TipoEntrega),
});

export const matrizIdParamsSchema = z.object({
  id: z.uuid(),
});

export const listTurmasQuerySchema = z.object({
  campusId: z.uuid(),
  anoLetivo: z.coerce.number().int().min(2020),
  semestreLetivo: z.coerce.number().int().min(1).max(2),
});

export const errorResponseSchema = z.object({
  error: z.string(),
  message: z.string().optional(),
});

const disciplinaResumoSchema = z.object({
  id: z.uuid(),
  nome: z.string(),
  codigo: z.string(),
});

export const matrizResponseSchema = z.object({
  id: z.uuid(),
  cursoId: z.uuid(),
  nome: z.string(),
  anoVigencia: z.number().int(),
  ativo: z.boolean(),
});

export const componenteResponseSchema = z.object({
  id: z.uuid(),
  matrizCurricularId: z.uuid(),
  disciplinaId: z.uuid(),
  semestreIdeal: z.number().int(),
  tipo: z.enum(TipoComponente),
  tipoEntrega: z.enum(TipoEntrega),
  chTotal: z.number().int(),
  chPresencial: z.number().int(),
  chSincrona: z.number().int(),
  chAssincrona: z.number().int(),
  chExtensao: z.number().int(),
  disciplina: disciplinaResumoSchema,
});

export const auditoriaMecResponseSchema = z.object({
  matrizId: z.uuid(),
  matrizNome: z.string(),
  cursoNome: z.string(),
  campusId: z.uuid(),
  campusNome: z.string(),
  codigoPolo: z.string(),
  chTotalGeral: z.number().int(),
  chExtensaoTotal: z.number().int(),
  percentualExtensao: z.number(),
  cumpreRegra10PorcentoExtensao: z.boolean(),
  chPresencialTotal: z.number().int(),
  percentualPresencial: z.number(),
  chSincronaTotal: z.number().int(),
  percentualSincrono: z.number(),
  percentualPresencialESincrono: z.number(),
  quantidadeComponentes: z.number().int(),
});

const professorResumoSchema = z.object({
  id: z.uuid(),
  matricula: z.string(),
  titulacao: z.string(),
  user: z.object({
    id: z.uuid(),
    nome: z.string(),
    email: z.email(),
  }),
});

export const turmaResponseSchema = z.object({
  id: z.uuid(),
  campusId: z.uuid(),
  disciplinaId: z.uuid(),
  professorId: z.uuid(),
  codigo: z.string(),
  anoLetivo: z.number().int(),
  semestreLetivo: z.number().int(),
  capacidade: z.number().int(),
  horario: z.string(),
  salaOuLink: z.string().nullable(),
  tipoEntrega: z.enum(TipoEntrega),
  disciplina: disciplinaResumoSchema,
  professor: professorResumoSchema,
});

export const turmaListItemSchema = turmaResponseSchema.extend({
  quantidadeDiarios: z.number().int(),
});

export const turmaListResponseSchema = z.array(turmaListItemSchema);

export type ICreateMatrizInput = z.infer<typeof createMatrizSchema>;
export type IAddComponenteMatrizInput = z.infer<typeof addComponenteMatrizSchema>;
export type ICreateTurmaInput = z.infer<typeof createTurmaSchema>;
export type IListTurmasQuery = z.infer<typeof listTurmasQuerySchema>;
export type IAuditoriaMecOutput = z.infer<typeof auditoriaMecResponseSchema>;
