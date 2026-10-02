import {z} from "zod";

import {Role, StatusReclamacao, TipoReclamacao} from "../../generated/prisma/enums.js";

export const idParamsSchema = z.object({
  id: z.uuid(),
});

export const errorResponseSchema = z.object({
  error: z.string(),
  message: z.string().optional(),
});

export const deleteResponseSchema = z.object({
  id: z.uuid(),
});

export const listComunicadosQuerySchema = z.object({
  publicoAlvo: z.enum(Role).optional(),
});

export const createComunicadoSchema = z.object({
  titulo: z.string().min(3).max(200),
  conteudo: z.string().min(3),
  publicoAlvo: z.array(z.enum(Role)).min(1),
});

export const updateComunicadoSchema = createComunicadoSchema.partial();

export const comunicadoResponseSchema = z.object({
  id: z.uuid(),
  titulo: z.string(),
  conteudo: z.string(),
  publicoAlvo: z.array(z.enum(Role)),
  criadoEm: z.iso.datetime(),
});

export const comunicadoListResponseSchema = z.array(comunicadoResponseSchema);

export const listReclamacoesQuerySchema = z.object({
  status: z.enum(StatusReclamacao).optional(),
  tipo: z.enum(TipoReclamacao).optional(),
});

export const createReclamacaoSchema = z.object({
  usuarioId: z.uuid(),
  assunto: z.string().min(3).max(200),
  tipo: z.enum(TipoReclamacao),
  descricao: z.string().min(3),
});

export const responderReclamacaoSchema = z.object({
  resposta: z.string().min(3),
});

export const reclamacaoResponseSchema = z.object({
  id: z.uuid(),
  usuarioId: z.uuid(),
  assunto: z.string(),
  tipo: z.enum(TipoReclamacao),
  descricao: z.string(),
  resposta: z.string().nullable(),
  status: z.enum(StatusReclamacao),
  criadoEm: z.iso.datetime(),
  usuario: z.object({
    id: z.uuid(),
    nome: z.string(),
    email: z.email(),
    role: z.enum(Role),
  }),
});

export const reclamacaoListResponseSchema = z.array(reclamacaoResponseSchema);

export type IListComunicadosQuery = z.infer<typeof listComunicadosQuerySchema>;
export type ICreateComunicadoInput = z.infer<typeof createComunicadoSchema>;
export type IUpdateComunicadoInput = z.infer<typeof updateComunicadoSchema>;
export type IListReclamacoesQuery = z.infer<typeof listReclamacoesQuerySchema>;
export type ICreateReclamacaoInput = z.infer<typeof createReclamacaoSchema>;
export type IResponderReclamacaoInput = z.infer<typeof responderReclamacaoSchema>;
