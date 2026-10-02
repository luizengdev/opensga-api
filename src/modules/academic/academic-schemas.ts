import {z} from "zod";

import {ModalidadeCurso, TipoComponente, TipoEntrega} from "../../generated/prisma/enums.js";

export const idParamsSchema = z.object({
  id: z.uuid(),
});

export const matrizIdParamsSchema = idParamsSchema;

export const errorResponseSchema = z.object({
  error: z.string(),
  message: z.string().optional(),
});

export const deleteResponseSchema = z.object({
  id: z.uuid(),
});

export const createCampusSchema = z.object({
  nome: z.string().min(3).max(120),
  codigoPolo: z.string().min(2).max(20),
  cidade: z.string().min(2).max(100),
  estado: z.string().length(2),
  endereco: z.string().min(5).max(255),
});

export const updateCampusSchema = createCampusSchema.partial();

export const campusResponseSchema = z.object({
  id: z.uuid(),
  nome: z.string(),
  codigoPolo: z.string(),
  cidade: z.string(),
  estado: z.string(),
  endereco: z.string(),
});

export const campusListResponseSchema = z.array(campusResponseSchema);

export const createCursoSchema = z.object({
  campusId: z.uuid(),
  nome: z.string().min(3).max(150),
  codigoMec: z.string().max(50).optional(),
  modalidade: z.enum(ModalidadeCurso),
  duracaoSemestres: z.number().int().min(1).max(20).default(8),
});

export const updateCursoSchema = createCursoSchema.omit({campusId: true}).partial().extend({
  campusId: z.uuid().optional(),
});

export const listCursosQuerySchema = z.object({
  campusId: z.uuid().optional(),
});

export const cursoResponseSchema = z.object({
  id: z.uuid(),
  campusId: z.uuid(),
  nome: z.string(),
  codigoMec: z.string().nullable(),
  modalidade: z.enum(ModalidadeCurso),
  duracaoSemestres: z.number().int(),
});

export const cursoListResponseSchema = z.array(cursoResponseSchema);

export const createDisciplinaSchema = z.object({
  nome: z.string().min(3).max(150),
  codigo: z.string().min(2).max(20),
});

export const updateDisciplinaSchema = createDisciplinaSchema.partial();

export const disciplinaResponseSchema = z.object({
  id: z.uuid(),
  nome: z.string(),
  codigo: z.string(),
});

export const disciplinaListResponseSchema = z.array(disciplinaResponseSchema);

export const createMatrizSchema = z.object({
  cursoId: z.uuid(),
  nome: z.string().min(3).max(100),
  anoVigencia: z.number().int().min(2020).max(2040),
});

export const updateMatrizSchema = z.object({
  nome: z.string().min(3).max(100).optional(),
  anoVigencia: z.number().int().min(2020).max(2040).optional(),
  ativo: z.boolean().optional(),
});

export const listMatrizesQuerySchema = z.object({
  cursoId: z.uuid().optional(),
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

export const updateComponenteMatrizSchema = z.object({
  semestreIdeal: z.number().int().min(1).max(16).optional(),
  tipo: z.enum(TipoComponente).optional(),
  tipoEntrega: z.enum(TipoEntrega).optional(),
  chTotal: z.number().int().min(10).optional(),
  chPresencial: z.number().int().min(0).optional(),
  chSincrona: z.number().int().min(0).optional(),
  chAssincrona: z.number().int().min(0).optional(),
  chExtensao: z.number().int().min(0).optional(),
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

export const updateTurmaSchema = z.object({
  professorId: z.uuid().optional(),
  capacidade: z.number().int().min(1).optional(),
  horario: z.string().min(3).max(100).optional(),
  salaOuLink: z.string().max(255).nullable().optional(),
  tipoEntrega: z.enum(TipoEntrega).optional(),
});

export const listTurmasQuerySchema = z.object({
  campusId: z.uuid().optional(),
  anoLetivo: z.coerce.number().int().min(2020).optional(),
  semestreLetivo: z.coerce.number().int().min(1).max(2).optional(),
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

export const matrizDetailResponseSchema = matrizResponseSchema.extend({
  curso: z.object({
    id: z.uuid(),
    nome: z.string(),
    modalidade: z.enum(ModalidadeCurso),
  }),
  componentes: z.array(
    z.object({
      id: z.uuid(),
      disciplinaId: z.uuid(),
      semestreIdeal: z.number().int(),
      tipo: z.enum(TipoComponente),
      tipoEntrega: z.enum(TipoEntrega),
      chTotal: z.number().int(),
      disciplina: disciplinaResumoSchema,
    }),
  ),
});

export const matrizListResponseSchema = z.array(matrizResponseSchema);

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

export const componenteListResponseSchema = z.array(componenteResponseSchema);

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

export type ICreateCampusInput = z.infer<typeof createCampusSchema>;
export type IUpdateCampusInput = z.infer<typeof updateCampusSchema>;
export type ICreateCursoInput = z.infer<typeof createCursoSchema>;
export type IUpdateCursoInput = z.infer<typeof updateCursoSchema>;
export type IListCursosQuery = z.infer<typeof listCursosQuerySchema>;
export type ICreateDisciplinaInput = z.infer<typeof createDisciplinaSchema>;
export type IUpdateDisciplinaInput = z.infer<typeof updateDisciplinaSchema>;
export type ICreateMatrizInput = z.infer<typeof createMatrizSchema>;
export type IUpdateMatrizInput = z.infer<typeof updateMatrizSchema>;
export type IListMatrizesQuery = z.infer<typeof listMatrizesQuerySchema>;
export type IAddComponenteMatrizInput = z.infer<typeof addComponenteMatrizSchema>;
export type IUpdateComponenteMatrizInput = z.infer<typeof updateComponenteMatrizSchema>;
export type ICreateTurmaInput = z.infer<typeof createTurmaSchema>;
export type IUpdateTurmaInput = z.infer<typeof updateTurmaSchema>;
export type IListTurmasQuery = z.infer<typeof listTurmasQuerySchema>;
export type IAuditoriaMecOutput = z.infer<typeof auditoriaMecResponseSchema>;
