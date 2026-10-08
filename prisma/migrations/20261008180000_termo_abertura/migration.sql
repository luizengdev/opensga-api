CREATE TYPE "TipoTermoAbertura" AS ENUM ('TURMA', 'INDIVIDUAL');

CREATE TYPE "StatusTermoAbertura" AS ENUM ('PENDENTE', 'APROVADO', 'RECUSADO');

CREATE TABLE "solicitacoes_termo_abertura" (
  "id" UUID NOT NULL,
  "tipo" "TipoTermoAbertura" NOT NULL,
  "status" "StatusTermoAbertura" NOT NULL DEFAULT 'PENDENTE',
  "professorId" UUID NOT NULL,
  "turmaId" UUID,
  "diarioClasseId" UUID,
  "notaAv" DECIMAL(4,2),
  "notaAvs" DECIMAL(4,2),
  "notaAv3" DECIMAL(4,2),
  "totalFaltas" INTEGER,
  "criadoEm" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "decididoEm" TIMESTAMPTZ,
  "decididoPorId" UUID,

  CONSTRAINT "solicitacoes_termo_abertura_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "solicitacoes_termo_abertura_status_criadoEm_idx" ON "solicitacoes_termo_abertura"("status", "criadoEm");

CREATE INDEX "solicitacoes_termo_abertura_professorId_status_idx" ON "solicitacoes_termo_abertura"("professorId", "status");

ALTER TABLE "solicitacoes_termo_abertura"
  ADD CONSTRAINT "solicitacoes_termo_abertura_professorId_fkey"
  FOREIGN KEY ("professorId") REFERENCES "professores"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "solicitacoes_termo_abertura"
  ADD CONSTRAINT "solicitacoes_termo_abertura_turmaId_fkey"
  FOREIGN KEY ("turmaId") REFERENCES "turmas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "solicitacoes_termo_abertura"
  ADD CONSTRAINT "solicitacoes_termo_abertura_diarioClasseId_fkey"
  FOREIGN KEY ("diarioClasseId") REFERENCES "diarios_classe"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "solicitacoes_termo_abertura"
  ADD CONSTRAINT "solicitacoes_termo_abertura_decididoPorId_fkey"
  FOREIGN KEY ("decididoPorId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
