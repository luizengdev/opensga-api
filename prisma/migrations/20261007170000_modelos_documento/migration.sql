CREATE TYPE "TipoDocumento" AS ENUM (
  'DECLARACAO_MATRICULA',
  'HISTORICO_PARCIAL',
  'QUITACAO_FINANCEIRA',
  'CARTEIRINHA_ESTUDANTIL'
);

CREATE TABLE "modelos_documento" (
  "id" UUID NOT NULL,
  "tipo" "TipoDocumento" NOT NULL,
  "titulo" VARCHAR(200) NOT NULL,
  "descricao" VARCHAR(500) NOT NULL,
  "finalidade" VARCHAR(500) NOT NULL,
  "corpo" TEXT NOT NULL,
  "ativo" BOOLEAN NOT NULL DEFAULT true,
  "criadoEm" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "atualizadoEm" TIMESTAMPTZ NOT NULL,

  CONSTRAINT "modelos_documento_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "modelos_documento_tipo_key" ON "modelos_documento"("tipo");

CREATE TABLE "emissoes_documento" (
  "id" UUID NOT NULL,
  "modeloId" UUID NOT NULL,
  "alunoId" UUID NOT NULL,
  "matriculaId" UUID NOT NULL,
  "codigo" VARCHAR(40) NOT NULL,
  "emitidoEm" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "emissoes_documento_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "emissoes_documento_codigo_key" ON "emissoes_documento"("codigo");

ALTER TABLE "emissoes_documento"
  ADD CONSTRAINT "emissoes_documento_modeloId_fkey"
  FOREIGN KEY ("modeloId") REFERENCES "modelos_documento"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "emissoes_documento"
  ADD CONSTRAINT "emissoes_documento_alunoId_fkey"
  FOREIGN KEY ("alunoId") REFERENCES "alunos"("id") ON DELETE CASCADE ON UPDATE CASCADE;
