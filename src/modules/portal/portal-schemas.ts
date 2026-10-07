import {z} from "zod";

import {
  ModalidadeCurso,
  Role,
  StatusDisciplina,
  StatusFatura,
  StatusMatricula,
  StatusReclamacao,
  TipoComponente,
  TipoEntrega,
  TipoReclamacao,
} from "../../generated/prisma/enums.js";

export const portalContextoQuerySchema = z.object({
  alunoId: z.uuid().optional(),
});

export const errorResponseSchema = z.object({
  error: z.string(),
  message: z.string().optional(),
});

export const portalDependenteSchema = z.object({
  id: z.uuid(),
  nome: z.string(),
  ra: z.string(),
  curso: z.string(),
  periodo: z.number().int(),
  statusMatricula: z.enum(StatusMatricula),
  avatarUrl: z.string().nullable(),
});

export const portalProfileSchema = z.object({
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
  dependentes: z.array(portalDependenteSchema),
});

export const portalMatriculaSchema = z
  .object({
    id: z.uuid(),
    ra: z.string(),
    status: z.enum(StatusMatricula),
    periodoAtual: z.number().int(),
    semestreIngresso: z.string(),
    curso: z.object({
      id: z.uuid(),
      nome: z.string(),
      modalidade: z.enum(ModalidadeCurso),
      campus: z.object({
        nome: z.string(),
        codigoPolo: z.string(),
      }),
    }),
    matrizCurricular: z.object({
      id: z.uuid(),
      nome: z.string(),
      anoVigencia: z.number().int(),
      chTotalCurso: z.number().int(),
      chIntegralizada: z.number().int(),
    }),
  })
  .nullable();

export const portalDisciplinaSchema = z.object({
  id: z.uuid(),
  codigoTurma: z.string(),
  codigoDisciplina: z.string(),
  nomeDisciplina: z.string(),
  professorNome: z.string(),
  horario: z.string(),
  salaOuLink: z.string().nullable(),
  tipoEntrega: z.enum(TipoEntrega),
  anoLetivo: z.number().int(),
  semestreLetivo: z.number().int(),
  chTotal: z.number().int(),
  chCumprida: z.number().int(),
  totalFaltas: z.number().int(),
  notaAv: z.number().nullable(),
  notaAvs: z.number().nullable(),
  notaAv3: z.number().nullable(),
  notaSemestral: z.number().nullable(),
  mediaFinal: z.number().nullable(),
  habilitaAv3: z.boolean(),
  statusDisciplina: z.enum(StatusDisciplina),
  semestreFechado: z.boolean(),
});

export const portalComponenteSchema = z.object({
  id: z.uuid(),
  codigo: z.string(),
  nome: z.string(),
  semestreIdeal: z.number().int(),
  tipo: z.enum(TipoComponente),
  chTotal: z.number().int(),
  statusDisciplina: z.enum(StatusDisciplina).nullable(),
  notaFinal: z.number().nullable(),
});

export const portalFaturaSchema = z.object({
  id: z.uuid(),
  descricao: z.string(),
  valor: z.number(),
  dataVencimento: z.iso.datetime(),
  status: z.enum(StatusFatura),
  stripePaymentUrl: z.string().nullable(),
  pagoEm: z.iso.datetime().nullable(),
});

export const portalComunicadoSchema = z.object({
  id: z.uuid(),
  titulo: z.string(),
  conteudo: z.string(),
  publicoAlvo: z.array(z.enum(Role)),
  criadoEm: z.iso.datetime(),
});

export const portalReclamacaoSchema = z.object({
  id: z.uuid(),
  assunto: z.string(),
  tipo: z.enum(TipoReclamacao),
  descricao: z.string(),
  resposta: z.string().nullable(),
  status: z.enum(StatusReclamacao),
  criadoEm: z.iso.datetime(),
});

export const portalContextoResponseSchema = z.object({
  profile: portalProfileSchema,
  alunoId: z.uuid().nullable(),
  matricula: portalMatriculaSchema,
  disciplinas: z.array(portalDisciplinaSchema),
  matriz: z.array(portalComponenteSchema),
  faturas: z.array(portalFaturaSchema),
  comunicados: z.array(portalComunicadoSchema),
  ouvidoria: z.array(portalReclamacaoSchema),
});

export const createPortalReclamacaoSchema = z.object({
  assunto: z.string().min(3).max(200),
  tipo: z.enum(TipoReclamacao),
  descricao: z.string().min(3),
});

export type IPortalContextoQuery = z.infer<typeof portalContextoQuerySchema>;
export type IPortalContextoOutput = z.infer<typeof portalContextoResponseSchema>;
export type ICreatePortalReclamacaoInput = z.infer<typeof createPortalReclamacaoSchema>;
export type IPortalReclamacaoOutput = z.infer<typeof portalReclamacaoSchema>;
