import {FastifyInstance} from "fastify";
import {ZodTypeProvider} from "fastify-type-provider-zod";

import {Role} from "../../generated/prisma/enums.js";
import {
  createCheckoutHandler,
  createFaturaHandler,
  createPublicInscricaoHandler,
  listCatalogoCursosHandler,
  createPrecoCursoHandler,
  deleteFaturaHandler,
  deletePrecoCursoHandler,
  getFaturaHandler,
  getPrecoCursoHandler,
  listFaturasHandler,
  listPrecosCursoHandler,
  updateFaturaStatusHandler,
  updatePrecoCursoHandler,
} from "./financial-controller.js";
import {
  catalogoCursoListResponseSchema,
  checkoutResponseSchema,
  createCheckoutSchema,
  createPublicInscricaoSchema,
  createFaturaSchema,
  createPrecoCursoSchema,
  deleteResponseSchema,
  errorResponseSchema,
  faturaListResponseSchema,
  faturaResponseSchema,
  idParamsSchema,
  listFaturasQuerySchema,
  listPrecosQuerySchema,
  precoCursoListResponseSchema,
  precoCursoResponseSchema,
  updateFaturaStatusSchema,
  updatePrecoCursoSchema,
} from "./financial-schemas.js";

export const checkoutRoutes = async (app: FastifyInstance): Promise<void> => {
  const typedApp = app.withTypeProvider<ZodTypeProvider>();

  typedApp.get(
    "/catalogo",
    {
      schema: {
        tags: ["Financeiro"],
        summary: "Listar cursos com precificação ativa para inscrição pública",
        response: {
          200: catalogoCursoListResponseSchema,
        },
      },
    },
    listCatalogoCursosHandler,
  );

  typedApp.post(
    "/inscricao",
    {
      schema: {
        tags: ["Financeiro"],
        summary: "Pré-matricular candidato e criar Checkout Stripe de matrícula",
        body: createPublicInscricaoSchema,
        response: {
          200: checkoutResponseSchema,
          400: errorResponseSchema,
          404: errorResponseSchema,
        },
      },
    },
    createPublicInscricaoHandler,
  );

  typedApp.post(
    "/checkout",
    {
      schema: {
        tags: ["Financeiro"],
        summary: "Criar Checkout Stripe de matrícula com cupom de isenção na primeira parcela",
        body: createCheckoutSchema,
        response: {
          200: checkoutResponseSchema,
          400: errorResponseSchema,
          404: errorResponseSchema,
        },
      },
    },
    createCheckoutHandler,
  );
};

export const financialRoutes = async (app: FastifyInstance): Promise<void> => {
  const typedApp = app.withTypeProvider<ZodTypeProvider>();
  const acessoAdmin = {
    onRequest: [app.authenticate],
    preHandler: [app.authorize([Role.ADMIN])],
  };

  await checkoutRoutes(app);

  typedApp.get(
    "/financeiro/precos",
    {
      ...acessoAdmin,
      schema: {
        tags: ["Financeiro"],
        summary: "Listar precificação por curso/modalidade",
        security: [{bearerAuth: []}],
        querystring: listPrecosQuerySchema,
        response: {
          200: precoCursoListResponseSchema,
          401: errorResponseSchema,
          403: errorResponseSchema,
        },
      },
    },
    listPrecosCursoHandler,
  );

  typedApp.post(
    "/financeiro/precos",
    {
      ...acessoAdmin,
      schema: {
        tags: ["Financeiro"],
        summary: "Cadastrar mensalidade de um curso e sincronizar Product/Price no Stripe",
        security: [{bearerAuth: []}],
        body: createPrecoCursoSchema,
        response: {
          201: precoCursoResponseSchema,
          400: errorResponseSchema,
          401: errorResponseSchema,
          403: errorResponseSchema,
          404: errorResponseSchema,
          409: errorResponseSchema,
        },
      },
    },
    createPrecoCursoHandler,
  );

  typedApp.get(
    "/financeiro/precos/:id",
    {
      ...acessoAdmin,
      schema: {
        tags: ["Financeiro"],
        summary: "Buscar precificação por id",
        security: [{bearerAuth: []}],
        params: idParamsSchema,
        response: {
          200: precoCursoResponseSchema,
          401: errorResponseSchema,
          403: errorResponseSchema,
          404: errorResponseSchema,
        },
      },
    },
    getPrecoCursoHandler,
  );

  typedApp.patch(
    "/financeiro/precos/:id",
    {
      ...acessoAdmin,
      schema: {
        tags: ["Financeiro"],
        summary: "Atualizar valor ou status da precificação (novo Price no Stripe se o valor mudar)",
        security: [{bearerAuth: []}],
        params: idParamsSchema,
        body: updatePrecoCursoSchema,
        response: {
          200: precoCursoResponseSchema,
          400: errorResponseSchema,
          401: errorResponseSchema,
          403: errorResponseSchema,
          404: errorResponseSchema,
        },
      },
    },
    updatePrecoCursoHandler,
  );

  typedApp.delete(
    "/financeiro/precos/:id",
    {
      ...acessoAdmin,
      schema: {
        tags: ["Financeiro"],
        summary: "Arquivar catálogo no Stripe e excluir precificação",
        security: [{bearerAuth: []}],
        params: idParamsSchema,
        response: {
          200: deleteResponseSchema,
          401: errorResponseSchema,
          403: errorResponseSchema,
          404: errorResponseSchema,
        },
      },
    },
    deletePrecoCursoHandler,
  );

  typedApp.get(
    "/financeiro/faturas",
    {
      ...acessoAdmin,
      schema: {
        tags: ["Financeiro"],
        summary: "Listar faturas, com filtro opcional por aluno e status",
        security: [{bearerAuth: []}],
        querystring: listFaturasQuerySchema,
        response: {
          200: faturaListResponseSchema,
          401: errorResponseSchema,
          403: errorResponseSchema,
        },
      },
    },
    listFaturasHandler,
  );

  typedApp.post(
    "/financeiro/faturas",
    {
      ...acessoAdmin,
      schema: {
        tags: ["Financeiro"],
        summary: "Emitir fatura acadêmica para um aluno",
        security: [{bearerAuth: []}],
        body: createFaturaSchema,
        response: {
          201: faturaResponseSchema,
          400: errorResponseSchema,
          401: errorResponseSchema,
          403: errorResponseSchema,
          404: errorResponseSchema,
        },
      },
    },
    createFaturaHandler,
  );

  typedApp.get(
    "/financeiro/faturas/:id",
    {
      ...acessoAdmin,
      schema: {
        tags: ["Financeiro"],
        summary: "Buscar fatura por id",
        security: [{bearerAuth: []}],
        params: idParamsSchema,
        response: {
          200: faturaResponseSchema,
          401: errorResponseSchema,
          403: errorResponseSchema,
          404: errorResponseSchema,
        },
      },
    },
    getFaturaHandler,
  );

  typedApp.patch(
    "/financeiro/faturas/:id/status",
    {
      ...acessoAdmin,
      schema: {
        tags: ["Financeiro"],
        summary: "Atualizar status financeiro da fatura",
        security: [{bearerAuth: []}],
        params: idParamsSchema,
        body: updateFaturaStatusSchema,
        response: {
          200: faturaResponseSchema,
          400: errorResponseSchema,
          401: errorResponseSchema,
          403: errorResponseSchema,
          404: errorResponseSchema,
        },
      },
    },
    updateFaturaStatusHandler,
  );

  typedApp.delete(
    "/financeiro/faturas/:id",
    {
      ...acessoAdmin,
      schema: {
        tags: ["Financeiro"],
        summary: "Excluir fatura",
        security: [{bearerAuth: []}],
        params: idParamsSchema,
        response: {
          200: deleteResponseSchema,
          401: errorResponseSchema,
          403: errorResponseSchema,
          404: errorResponseSchema,
        },
      },
    },
    deleteFaturaHandler,
  );
};
