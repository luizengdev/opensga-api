import {z} from "zod";

import {StatusMatricula} from "../../generated/prisma/enums.js";

export const dashboardPeriodQuerySchema = z.object({
  anoLetivo: z.coerce.number().int().min(2020).optional(),
  semestreLetivo: z.coerce.number().int().min(1).max(2).optional(),
});

export const errorResponseSchema = z.object({
  error: z.string(),
  message: z.string().optional(),
});

const matriculaStatusCountSchema = z.object({
  status: z.enum(StatusMatricula),
  quantidade: z.number().int(),
});

const turmaOcupacaoSchema = z.object({
  id: z.uuid(),
  codigo: z.string(),
  capacidade: z.number().int(),
  quantidadeDiarios: z.number().int(),
});

export const adminDashboardResponseSchema = z.object({
  anoLetivo: z.number().int(),
  semestreLetivo: z.number().int(),
  matriculasPorStatus: z.array(matriculaStatusCountSchema),
  turmasNoPeriodo: z.number().int(),
  ocupacaoMedia: z.number(),
  faturasPendentes: z.number().int(),
  reclamacoesAbertas: z.number().int(),
});

export const professorDashboardResponseSchema = z.object({
  anoLetivo: z.number().int(),
  semestreLetivo: z.number().int(),
  turmas: z.array(turmaOcupacaoSchema),
  lancamentosPendentes: z.number().int(),
});

export type IDashboardPeriodQuery = z.infer<typeof dashboardPeriodQuerySchema>;
export type IAdminDashboardOutput = z.infer<typeof adminDashboardResponseSchema>;
export type IProfessorDashboardOutput = z.infer<typeof professorDashboardResponseSchema>;
