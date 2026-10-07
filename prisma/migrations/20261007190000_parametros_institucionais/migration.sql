CREATE TABLE "parametros_institucionais" (
  "id" UUID NOT NULL,
  "nomeIes" VARCHAR(120) NOT NULL,
  "siglaIes" VARCHAR(20) NOT NULL,
  "mantenedora" VARCHAR(200) NOT NULL DEFAULT '',
  "cnpj" VARCHAR(18) NOT NULL DEFAULT '',
  "anoLetivo" INTEGER NOT NULL,
  "semestreLetivo" INTEGER NOT NULL,
  "periodoAutomatico" BOOLEAN NOT NULL DEFAULT true,
  "corteAprovacaoDireta" DECIMAL(4,2) NOT NULL DEFAULT 6.00,
  "corteMediaFinal" DECIMAL(4,2) NOT NULL DEFAULT 5.00,
  "limiteFaltasPercentual" DECIMAL(5,2) NOT NULL DEFAULT 25.00,
  "percentualMinimoExtensao" DECIMAL(5,2) NOT NULL DEFAULT 10.00,
  "criadoEm" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "atualizadoEm" TIMESTAMPTZ NOT NULL,

  CONSTRAINT "parametros_institucionais_pkey" PRIMARY KEY ("id")
);

INSERT INTO "parametros_institucionais" (
  "id",
  "nomeIes",
  "siglaIes",
  "mantenedora",
  "cnpj",
  "anoLetivo",
  "semestreLetivo",
  "periodoAutomatico",
  "corteAprovacaoDireta",
  "corteMediaFinal",
  "limiteFaltasPercentual",
  "percentualMinimoExtensao",
  "atualizadoEm"
) VALUES (
  '00000000-0000-0000-0000-000000000001',
  'OpenSGA',
  'OSGA',
  '',
  '',
  EXTRACT(YEAR FROM CURRENT_TIMESTAMP)::INTEGER,
  CASE WHEN EXTRACT(MONTH FROM CURRENT_TIMESTAMP) < 7 THEN 1 ELSE 2 END,
  true,
  6.00,
  5.00,
  25.00,
  10.00,
  CURRENT_TIMESTAMP
);
