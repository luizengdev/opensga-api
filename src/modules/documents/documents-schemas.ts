import {z} from "zod";

import {ModalidadeCurso, StatusDisciplina, TipoComponente, TipoDocumento, TipoEntrega} from "../../generated/prisma/enums.js";

export const errorResponseSchema = z.object({
  error: z.string(),
  message: z.string().optional(),
});

export const documentoIdParamsSchema = z.object({
  id: z.uuid(),
});

export const updateModeloDocumentoSchema = z.object({
  titulo: z.string().min(3).max(200).optional(),
  descricao: z.string().min(3).max(500).optional(),
  finalidade: z.string().min(3).max(500).optional(),
  corpo: z.string().min(10).max(8000).optional(),
  ativo: z.boolean().optional(),
});

export const modeloDocumentoSchema = z.object({
  id: z.uuid(),
  tipo: z.enum(TipoDocumento),
  titulo: z.string(),
  descricao: z.string(),
  finalidade: z.string(),
  corpo: z.string(),
  ativo: z.boolean(),
});

export const modeloDocumentoListSchema = z.array(modeloDocumentoSchema);

export const portalDocumentoCatalogoItemSchema = z.object({
  id: z.uuid(),
  tipo: z.enum(TipoDocumento),
  titulo: z.string(),
  descricao: z.string(),
  finalidade: z.string(),
});

export const portalDocumentoCatalogoSchema = z.array(portalDocumentoCatalogoItemSchema);

export const emitirDocumentoSchema = z.object({
  tipo: z.enum(TipoDocumento),
  alunoId: z.uuid().optional(),
});

export const documentoEmitidoSchema = z.object({
  tipo: z.enum(TipoDocumento),
  titulo: z.string(),
  corpo: z.string(),
  codigoAutenticacao: z.string(),
  emitidoEm: z.iso.datetime(),
  aluno: z.object({
    nome: z.string(),
    cpf: z.string(),
    ra: z.string(),
    avatarUrl: z.string().nullable(),
  }),
  curso: z.object({
    nome: z.string(),
    modalidade: z.enum(ModalidadeCurso),
    campusNome: z.string(),
    codigoPolo: z.string(),
  }),
  periodoAtual: z.number().int(),
  semestreIngresso: z.string(),
  chIntegralizada: z.number().int(),
  chTotalCurso: z.number().int(),
  disciplinas: z.array(
    z.object({
      codigo: z.string(),
      nome: z.string(),
      chTotal: z.number().int(),
      tipoEntrega: z.enum(TipoEntrega),
    }),
  ),
  matriz: z.array(
    z.object({
      semestreIdeal: z.number().int(),
      codigo: z.string(),
      nome: z.string(),
      tipo: z.enum(TipoComponente),
      chTotal: z.number().int(),
      notaFinal: z.number().nullable(),
      statusDisciplina: z.enum(StatusDisciplina).nullable(),
    }),
  ),
});

export type IUpdateModeloDocumentoInput = z.infer<typeof updateModeloDocumentoSchema>;
export type IEmitirDocumentoInput = z.infer<typeof emitirDocumentoSchema>;
