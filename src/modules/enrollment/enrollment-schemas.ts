import {z} from "zod";

import {
  ModalidadeCurso,
  StatusDisciplina,
  StatusMatricula,
  TipoCampus,
} from "../../generated/prisma/enums.js";

const responsavelFields = ["responsavelCpf", "responsavelNome", "responsavelEmail", "parentesco"] as const;

export const createEnrollmentSchema = z
  .object({
    nome: z.string().min(3).max(150),
    email: z.email().max(150),
    cpf: z.string().length(14),
    telefone: z.string().min(10).max(20).optional(),
    dataNascimento: z.iso.date(),
    cursoId: z.uuid(),
    matrizCurricularId: z.uuid(),
    semestreIngresso: z.string().regex(/^\d{4}\.[12]$/, "Formato deve ser AAAA.S (ex: 2026.1)"),
    responsavelCpf: z.string().length(14).optional(),
    responsavelNome: z.string().min(3).max(150).optional(),
    responsavelEmail: z.email().max(150).optional(),
    parentesco: z.string().min(1).max(50).optional(),
  })
  .superRefine((data, ctx) => {
    const informed = responsavelFields.filter((field) => data[field] !== undefined);

    if (informed.length === 0 || informed.length === responsavelFields.length) {
      return;
    }

    ctx.addIssue({
      code: "custom",
      message: "Informe CPF, nome, e-mail e parentesco do responsável juntos.",
      path: ["responsavelCpf"],
    });
  });

export const updateEnrollmentStatusSchema = z.object({
  status: z.enum(StatusMatricula),
});

export const enrollmentIdParamsSchema = z.object({
  id: z.uuid(),
});

export const listEnrollmentsQuerySchema = z.object({
  status: z.enum(StatusMatricula).optional(),
});

export const deleteResponseSchema = z.object({
  id: z.uuid(),
});

export const errorResponseSchema = z.object({
  error: z.string(),
  message: z.string().optional(),
});

export const createEnrollmentResponseSchema = z.object({
  message: z.string(),
  ra: z.string(),
  matriculaId: z.uuid(),
  matrizNome: z.string(),
});

export const enrollmentStatusResponseSchema = z.object({
  id: z.uuid(),
  status: z.enum(StatusMatricula),
});

export const enrollmentItemSchema = z.object({
  id: z.uuid(),
  status: z.enum(StatusMatricula),
  periodoAtual: z.number().int(),
  semestreIngresso: z.string(),
  curso: z.object({
    id: z.uuid(),
    nome: z.string(),
    modalidade: z.enum(ModalidadeCurso),
  }),
  matrizCurricular: z.object({
    id: z.uuid(),
    nome: z.string(),
    anoVigencia: z.number().int(),
  }),
  aluno: z.object({
    ra: z.string(),
    user: z.object({
      id: z.uuid(),
      nome: z.string(),
      email: z.email(),
      cpf: z.string(),
      ativo: z.boolean(),
    }),
  }),
});

export const enrollmentListResponseSchema = z.array(enrollmentItemSchema);

export const transferEnrollmentSchema = z.object({
  cursoId: z.uuid(),
  matrizCurricularId: z.uuid(),
});

export const transferPreviewQuerySchema = z.object({
  cursoId: z.uuid(),
  matrizCurricularId: z.uuid(),
});

const transferenciaCampusSchema = z.object({
  id: z.uuid(),
  nome: z.string(),
  codigoPolo: z.string(),
  tipo: z.enum(TipoCampus),
});

const transferenciaDisciplinaSchema = z.object({
  diarioId: z.uuid(),
  disciplinaId: z.uuid(),
  codigo: z.string(),
  nome: z.string(),
  statusDisciplina: z.enum(StatusDisciplina),
});

const transferenciaCursoSchema = z.object({
  id: z.uuid(),
  nome: z.string(),
  modalidade: z.enum(ModalidadeCurso),
  campus: transferenciaCampusSchema,
  matriz: z.object({
    id: z.uuid(),
    nome: z.string(),
    anoVigencia: z.number().int(),
  }),
});

export const transferPreviewResponseSchema = z.object({
  matriculaOrigemId: z.uuid(),
  aluno: z.object({
    ra: z.string(),
    nome: z.string(),
  }),
  origem: transferenciaCursoSchema,
  destino: transferenciaCursoSchema,
  mesmoCurso: z.boolean(),
  disciplinasTransferiveis: z.array(transferenciaDisciplinaSchema),
  disciplinasNaoTransferiveis: z.array(transferenciaDisciplinaSchema),
});

export const transferEnrollmentResponseSchema = transferPreviewResponseSchema.extend({
  matriculaDestinoId: z.uuid(),
  statusOrigem: z.literal(StatusMatricula.TRANSFERIDO),
  statusDestino: z.literal(StatusMatricula.ATIVO),
});

export type ICreateEnrollmentInput = z.infer<typeof createEnrollmentSchema>;
export type IUpdateEnrollmentStatusInput = z.infer<typeof updateEnrollmentStatusSchema>;
export type IListEnrollmentsQuery = z.infer<typeof listEnrollmentsQuerySchema>;
export type ITransferEnrollmentInput = z.infer<typeof transferEnrollmentSchema>;
export type ITransferPreviewQuery = z.infer<typeof transferPreviewQuerySchema>;
