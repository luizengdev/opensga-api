import {FastifyInstance} from "fastify";
import {ZodTypeProvider} from "fastify-type-provider-zod";

import {Role} from "../../generated/prisma/enums.js";
import {
  addComponenteHandler,
  auditMatrizHandler,
  createCampusHandler,
  createCursoHandler,
  createDisciplinaHandler,
  createMatrizHandler,
  createTurmaHandler,
  deleteCampusHandler,
  deleteComponenteHandler,
  deleteCursoHandler,
  deleteDisciplinaHandler,
  deleteMatrizHandler,
  deleteTurmaHandler,
  getCampusHandler,
  getComponenteHandler,
  getCursoHandler,
  getDisciplinaHandler,
  getMatrizHandler,
  getTurmaHandler,
  listCampiHandler,
  listComponentesHandler,
  listCursosHandler,
  listDisciplinasHandler,
  listMatrizesHandler,
  listTurmasHandler,
  updateCampusHandler,
  updateComponenteHandler,
  updateCursoHandler,
  updateDisciplinaHandler,
  updateMatrizHandler,
  updateTurmaHandler,
} from "./academic-controller.js";
import {
  addComponenteMatrizSchema,
  auditoriaMecResponseSchema,
  campusListResponseSchema,
  campusResponseSchema,
  componenteListResponseSchema,
  componenteResponseSchema,
  createCampusSchema,
  createCursoSchema,
  createDisciplinaSchema,
  createMatrizSchema,
  createTurmaSchema,
  cursoListResponseSchema,
  cursoResponseSchema,
  deleteResponseSchema,
  disciplinaListResponseSchema,
  disciplinaResponseSchema,
  errorResponseSchema,
  idParamsSchema,
  listCursosQuerySchema,
  listMatrizesQuerySchema,
  listTurmasQuerySchema,
  matrizDetailResponseSchema,
  matrizIdParamsSchema,
  matrizListResponseSchema,
  matrizResponseSchema,
  turmaListResponseSchema,
  turmaResponseSchema,
  updateCampusSchema,
  updateComponenteMatrizSchema,
  updateCursoSchema,
  updateDisciplinaSchema,
  updateMatrizSchema,
  updateTurmaSchema,
} from "./academic-schemas.js";

export const academicRoutes = async (app: FastifyInstance): Promise<void> => {
  const typedApp = app.withTypeProvider<ZodTypeProvider>();
  const acessoAdmin = {
    onRequest: [app.authenticate],
    preHandler: [app.authorize([Role.ADMIN])],
  };

  typedApp.get(
    "/academic/campi",
    {
      ...acessoAdmin,
      schema: {
        tags: ["Acadêmico - Campi"],
        summary: "Listar campi e polos da instituição",
        security: [{bearerAuth: []}],
        response: {
          200: campusListResponseSchema,
          401: errorResponseSchema,
          403: errorResponseSchema,
        },
      },
    },
    listCampiHandler,
  );

  typedApp.get(
    "/academic/campi/:id",
    {
      ...acessoAdmin,
      schema: {
        tags: ["Acadêmico - Campi"],
        summary: "Buscar campus por id",
        security: [{bearerAuth: []}],
        params: idParamsSchema,
        response: {
          200: campusResponseSchema,
          401: errorResponseSchema,
          403: errorResponseSchema,
          404: errorResponseSchema,
        },
      },
    },
    getCampusHandler,
  );

  typedApp.post(
    "/academic/campi",
    {
      ...acessoAdmin,
      schema: {
        tags: ["Acadêmico - Campi"],
        summary: "Cadastrar campus ou polo MEC",
        security: [{bearerAuth: []}],
        body: createCampusSchema,
        response: {
          201: campusResponseSchema,
          400: errorResponseSchema,
          401: errorResponseSchema,
          403: errorResponseSchema,
        },
      },
    },
    createCampusHandler,
  );

  typedApp.patch(
    "/academic/campi/:id",
    {
      ...acessoAdmin,
      schema: {
        tags: ["Acadêmico - Campi"],
        summary: "Atualizar dados do campus",
        security: [{bearerAuth: []}],
        params: idParamsSchema,
        body: updateCampusSchema,
        response: {
          200: campusResponseSchema,
          400: errorResponseSchema,
          401: errorResponseSchema,
          403: errorResponseSchema,
          404: errorResponseSchema,
        },
      },
    },
    updateCampusHandler,
  );

  typedApp.delete(
    "/academic/campi/:id",
    {
      ...acessoAdmin,
      schema: {
        tags: ["Acadêmico - Campi"],
        summary: "Excluir campus sem matrículas vinculadas",
        security: [{bearerAuth: []}],
        params: idParamsSchema,
        response: {
          200: deleteResponseSchema,
          401: errorResponseSchema,
          403: errorResponseSchema,
          404: errorResponseSchema,
          409: errorResponseSchema,
        },
      },
    },
    deleteCampusHandler,
  );

  typedApp.get(
    "/academic/cursos",
    {
      ...acessoAdmin,
      schema: {
        tags: ["Acadêmico - Cursos"],
        summary: "Listar cursos, com filtro opcional por campus",
        security: [{bearerAuth: []}],
        querystring: listCursosQuerySchema,
        response: {
          200: cursoListResponseSchema,
          401: errorResponseSchema,
          403: errorResponseSchema,
        },
      },
    },
    listCursosHandler,
  );

  typedApp.get(
    "/academic/cursos/:id",
    {
      ...acessoAdmin,
      schema: {
        tags: ["Acadêmico - Cursos"],
        summary: "Buscar curso por id",
        security: [{bearerAuth: []}],
        params: idParamsSchema,
        response: {
          200: cursoResponseSchema,
          401: errorResponseSchema,
          403: errorResponseSchema,
          404: errorResponseSchema,
        },
      },
    },
    getCursoHandler,
  );

  typedApp.post(
    "/academic/cursos",
    {
      ...acessoAdmin,
      schema: {
        tags: ["Acadêmico - Cursos"],
        summary: "Cadastrar curso em um campus",
        security: [{bearerAuth: []}],
        body: createCursoSchema,
        response: {
          201: cursoResponseSchema,
          400: errorResponseSchema,
          401: errorResponseSchema,
          403: errorResponseSchema,
          404: errorResponseSchema,
        },
      },
    },
    createCursoHandler,
  );

  typedApp.patch(
    "/academic/cursos/:id",
    {
      ...acessoAdmin,
      schema: {
        tags: ["Acadêmico - Cursos"],
        summary: "Atualizar curso",
        security: [{bearerAuth: []}],
        params: idParamsSchema,
        body: updateCursoSchema,
        response: {
          200: cursoResponseSchema,
          400: errorResponseSchema,
          401: errorResponseSchema,
          403: errorResponseSchema,
          404: errorResponseSchema,
        },
      },
    },
    updateCursoHandler,
  );

  typedApp.delete(
    "/academic/cursos/:id",
    {
      ...acessoAdmin,
      schema: {
        tags: ["Acadêmico - Cursos"],
        summary: "Excluir curso sem matrículas vinculadas",
        security: [{bearerAuth: []}],
        params: idParamsSchema,
        response: {
          200: deleteResponseSchema,
          401: errorResponseSchema,
          403: errorResponseSchema,
          404: errorResponseSchema,
          409: errorResponseSchema,
        },
      },
    },
    deleteCursoHandler,
  );

  typedApp.get(
    "/academic/disciplinas",
    {
      ...acessoAdmin,
      schema: {
        tags: ["Acadêmico - Disciplinas"],
        summary: "Listar catálogo global de disciplinas",
        security: [{bearerAuth: []}],
        response: {
          200: disciplinaListResponseSchema,
          401: errorResponseSchema,
          403: errorResponseSchema,
        },
      },
    },
    listDisciplinasHandler,
  );

  typedApp.get(
    "/academic/disciplinas/:id",
    {
      ...acessoAdmin,
      schema: {
        tags: ["Acadêmico - Disciplinas"],
        summary: "Buscar disciplina por id",
        security: [{bearerAuth: []}],
        params: idParamsSchema,
        response: {
          200: disciplinaResponseSchema,
          401: errorResponseSchema,
          403: errorResponseSchema,
          404: errorResponseSchema,
        },
      },
    },
    getDisciplinaHandler,
  );

  typedApp.post(
    "/academic/disciplinas",
    {
      ...acessoAdmin,
      schema: {
        tags: ["Acadêmico - Disciplinas"],
        summary: "Cadastrar disciplina global",
        security: [{bearerAuth: []}],
        body: createDisciplinaSchema,
        response: {
          201: disciplinaResponseSchema,
          400: errorResponseSchema,
          401: errorResponseSchema,
          403: errorResponseSchema,
        },
      },
    },
    createDisciplinaHandler,
  );

  typedApp.patch(
    "/academic/disciplinas/:id",
    {
      ...acessoAdmin,
      schema: {
        tags: ["Acadêmico - Disciplinas"],
        summary: "Atualizar disciplina global",
        security: [{bearerAuth: []}],
        params: idParamsSchema,
        body: updateDisciplinaSchema,
        response: {
          200: disciplinaResponseSchema,
          400: errorResponseSchema,
          401: errorResponseSchema,
          403: errorResponseSchema,
          404: errorResponseSchema,
        },
      },
    },
    updateDisciplinaHandler,
  );

  typedApp.delete(
    "/academic/disciplinas/:id",
    {
      ...acessoAdmin,
      schema: {
        tags: ["Acadêmico - Disciplinas"],
        summary: "Excluir disciplina sem turmas ofertadas",
        security: [{bearerAuth: []}],
        params: idParamsSchema,
        response: {
          200: deleteResponseSchema,
          401: errorResponseSchema,
          403: errorResponseSchema,
          404: errorResponseSchema,
          409: errorResponseSchema,
        },
      },
    },
    deleteDisciplinaHandler,
  );

  typedApp.get(
    "/academic/matrizes",
    {
      ...acessoAdmin,
      schema: {
        tags: ["Acadêmico - Matrizes"],
        summary: "Listar matrizes curriculares, com filtro opcional por curso",
        security: [{bearerAuth: []}],
        querystring: listMatrizesQuerySchema,
        response: {
          200: matrizListResponseSchema,
          401: errorResponseSchema,
          403: errorResponseSchema,
        },
      },
    },
    listMatrizesHandler,
  );

  typedApp.post(
    "/academic/matrizes",
    {
      ...acessoAdmin,
      schema: {
        tags: ["Acadêmico - Matrizes"],
        summary: "Criar versão de matriz curricular",
        security: [{bearerAuth: []}],
        body: createMatrizSchema,
        response: {
          201: matrizResponseSchema,
          400: errorResponseSchema,
          401: errorResponseSchema,
          403: errorResponseSchema,
          404: errorResponseSchema,
        },
      },
    },
    createMatrizHandler,
  );

  typedApp.post(
    "/academic/matrizes/componentes",
    {
      ...acessoAdmin,
      schema: {
        tags: ["Acadêmico - Matrizes"],
        summary: "Adicionar componente curricular com distribuição de CH",
        security: [{bearerAuth: []}],
        body: addComponenteMatrizSchema,
        response: {
          201: componenteResponseSchema,
          400: errorResponseSchema,
          401: errorResponseSchema,
          403: errorResponseSchema,
          404: errorResponseSchema,
        },
      },
    },
    addComponenteHandler,
  );

  typedApp.get(
    "/academic/matrizes/:id/auditoria-mec",
    {
      ...acessoAdmin,
      schema: {
        tags: ["Acadêmico - Regulatório"],
        summary: "Auditar extensão curricular e percentual presencial e síncrono do campus",
        security: [{bearerAuth: []}],
        params: matrizIdParamsSchema,
        response: {
          200: auditoriaMecResponseSchema,
          400: errorResponseSchema,
          401: errorResponseSchema,
          403: errorResponseSchema,
          404: errorResponseSchema,
        },
      },
    },
    auditMatrizHandler,
  );

  typedApp.get(
    "/academic/matrizes/:id/componentes",
    {
      ...acessoAdmin,
      schema: {
        tags: ["Acadêmico - Matrizes"],
        summary: "Listar componentes de uma matriz curricular",
        security: [{bearerAuth: []}],
        params: matrizIdParamsSchema,
        response: {
          200: componenteListResponseSchema,
          401: errorResponseSchema,
          403: errorResponseSchema,
          404: errorResponseSchema,
        },
      },
    },
    listComponentesHandler,
  );

  typedApp.get(
    "/academic/matrizes/:id",
    {
      ...acessoAdmin,
      schema: {
        tags: ["Acadêmico - Matrizes"],
        summary: "Buscar matriz curricular com componentes",
        security: [{bearerAuth: []}],
        params: matrizIdParamsSchema,
        response: {
          200: matrizDetailResponseSchema,
          401: errorResponseSchema,
          403: errorResponseSchema,
          404: errorResponseSchema,
        },
      },
    },
    getMatrizHandler,
  );

  typedApp.patch(
    "/academic/matrizes/:id",
    {
      ...acessoAdmin,
      schema: {
        tags: ["Acadêmico - Matrizes"],
        summary: "Atualizar nome, ano de vigência ou status da matriz",
        security: [{bearerAuth: []}],
        params: matrizIdParamsSchema,
        body: updateMatrizSchema,
        response: {
          200: matrizResponseSchema,
          400: errorResponseSchema,
          401: errorResponseSchema,
          403: errorResponseSchema,
          404: errorResponseSchema,
        },
      },
    },
    updateMatrizHandler,
  );

  typedApp.delete(
    "/academic/matrizes/:id",
    {
      ...acessoAdmin,
      schema: {
        tags: ["Acadêmico - Matrizes"],
        summary: "Excluir matriz sem matrículas vinculadas",
        security: [{bearerAuth: []}],
        params: matrizIdParamsSchema,
        response: {
          200: deleteResponseSchema,
          401: errorResponseSchema,
          403: errorResponseSchema,
          404: errorResponseSchema,
          409: errorResponseSchema,
        },
      },
    },
    deleteMatrizHandler,
  );

  typedApp.get(
    "/academic/componentes/:id",
    {
      ...acessoAdmin,
      schema: {
        tags: ["Acadêmico - Matrizes"],
        summary: "Buscar componente curricular por id",
        security: [{bearerAuth: []}],
        params: idParamsSchema,
        response: {
          200: componenteResponseSchema,
          401: errorResponseSchema,
          403: errorResponseSchema,
          404: errorResponseSchema,
        },
      },
    },
    getComponenteHandler,
  );

  typedApp.patch(
    "/academic/componentes/:id",
    {
      ...acessoAdmin,
      schema: {
        tags: ["Acadêmico - Matrizes"],
        summary: "Atualizar CH, tipo ou semestre do componente",
        security: [{bearerAuth: []}],
        params: idParamsSchema,
        body: updateComponenteMatrizSchema,
        response: {
          200: componenteResponseSchema,
          400: errorResponseSchema,
          401: errorResponseSchema,
          403: errorResponseSchema,
          404: errorResponseSchema,
        },
      },
    },
    updateComponenteHandler,
  );

  typedApp.delete(
    "/academic/componentes/:id",
    {
      ...acessoAdmin,
      schema: {
        tags: ["Acadêmico - Matrizes"],
        summary: "Remover componente da matriz",
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
    deleteComponenteHandler,
  );

  typedApp.post(
    "/academic/turmas",
    {
      ...acessoAdmin,
      schema: {
        tags: ["Acadêmico - Turmas"],
        summary: "Ofertar turma de disciplina global no semestre",
        security: [{bearerAuth: []}],
        body: createTurmaSchema,
        response: {
          201: turmaResponseSchema,
          400: errorResponseSchema,
          401: errorResponseSchema,
          403: errorResponseSchema,
          404: errorResponseSchema,
        },
      },
    },
    createTurmaHandler,
  );

  typedApp.get(
    "/academic/turmas",
    {
      ...acessoAdmin,
      schema: {
        tags: ["Acadêmico - Turmas"],
        summary: "Listar turmas com filtros opcionais de campus e período letivo",
        security: [{bearerAuth: []}],
        querystring: listTurmasQuerySchema,
        response: {
          200: turmaListResponseSchema,
          401: errorResponseSchema,
          403: errorResponseSchema,
        },
      },
    },
    listTurmasHandler,
  );

  typedApp.get(
    "/academic/turmas/:id",
    {
      ...acessoAdmin,
      schema: {
        tags: ["Acadêmico - Turmas"],
        summary: "Buscar turma por id",
        security: [{bearerAuth: []}],
        params: idParamsSchema,
        response: {
          200: turmaResponseSchema,
          401: errorResponseSchema,
          403: errorResponseSchema,
          404: errorResponseSchema,
        },
      },
    },
    getTurmaHandler,
  );

  typedApp.patch(
    "/academic/turmas/:id",
    {
      ...acessoAdmin,
      schema: {
        tags: ["Acadêmico - Turmas"],
        summary: "Atualizar horário, capacidade ou professor da turma",
        security: [{bearerAuth: []}],
        params: idParamsSchema,
        body: updateTurmaSchema,
        response: {
          200: turmaResponseSchema,
          400: errorResponseSchema,
          401: errorResponseSchema,
          403: errorResponseSchema,
          404: errorResponseSchema,
        },
      },
    },
    updateTurmaHandler,
  );

  typedApp.delete(
    "/academic/turmas/:id",
    {
      ...acessoAdmin,
      schema: {
        tags: ["Acadêmico - Turmas"],
        summary: "Excluir turma e diários vinculados",
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
    deleteTurmaHandler,
  );
};
