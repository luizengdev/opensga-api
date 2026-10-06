CREATE TYPE "StatusDisciplina" AS ENUM ('EM_ABERTO', 'APROVADO', 'RF', 'RN');

ALTER TABLE "diarios_classe"
  ADD COLUMN "notaAv" DECIMAL(4,2),
  ADD COLUMN "notaAvs" DECIMAL(4,2),
  ADD COLUMN "notaAv3" DECIMAL(4,2),
  ADD COLUMN "notaSemestral" DECIMAL(4,2),
  ADD COLUMN "mediaFinal" DECIMAL(4,2),
  ADD COLUMN "habilitaAv3" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN "statusDisciplina" "StatusDisciplina" NOT NULL DEFAULT 'EM_ABERTO',
  ADD COLUMN "semestreFechado" BOOLEAN NOT NULL DEFAULT false;

UPDATE "diarios_classe"
SET
  "notaAv" = "notaA1",
  "notaAvs" = "notaA2",
  "notaAv3" = "notaAF",
  "notaSemestral" = CASE
    WHEN "notaA1" IS NULL AND "notaA2" IS NULL THEN NULL
    WHEN "notaA1" IS NULL THEN "notaA2"
    WHEN "notaA2" IS NULL THEN "notaA1"
    ELSE GREATEST("notaA1", "notaA2")
  END,
  "mediaFinal" = "notaFinal",
  "habilitaAv3" = CASE
    WHEN "notaA1" IS NULL AND "notaA2" IS NULL THEN false
    WHEN GREATEST(COALESCE("notaA1", "notaA2"), COALESCE("notaA2", "notaA1")) < 6 THEN true
    ELSE false
  END,
  "statusDisciplina" = CASE
    WHEN "aprovado" IS TRUE THEN 'APROVADO'::"StatusDisciplina"
    WHEN "aprovado" IS FALSE THEN 'RN'::"StatusDisciplina"
    ELSE 'EM_ABERTO'::"StatusDisciplina"
  END;

ALTER TABLE "diarios_classe"
  DROP COLUMN "notaA1",
  DROP COLUMN "notaA2",
  DROP COLUMN "notaAF",
  DROP COLUMN "notaFinal",
  DROP COLUMN "aprovado";

ALTER TABLE "diarios_classe"
  ADD CONSTRAINT "diarios_classe_nota_av_range"
    CHECK ("notaAv" IS NULL OR ("notaAv" >= 0 AND "notaAv" <= 10)),
  ADD CONSTRAINT "diarios_classe_nota_avs_range"
    CHECK ("notaAvs" IS NULL OR ("notaAvs" >= 0 AND "notaAvs" <= 10)),
  ADD CONSTRAINT "diarios_classe_nota_av3_range"
    CHECK ("notaAv3" IS NULL OR ("notaAv3" >= 0 AND "notaAv3" <= 10)),
  ADD CONSTRAINT "diarios_classe_nota_semestral_range"
    CHECK ("notaSemestral" IS NULL OR ("notaSemestral" >= 0 AND "notaSemestral" <= 10)),
  ADD CONSTRAINT "diarios_classe_media_final_range"
    CHECK ("mediaFinal" IS NULL OR ("mediaFinal" >= 0 AND "mediaFinal" <= 10)),
  ADD CONSTRAINT "diarios_classe_faltas_nao_negativas"
    CHECK ("totalFaltas" >= 0),
  ADD CONSTRAINT "diarios_classe_ch_cumprida_nao_negativa"
    CHECK ("chCumprida" >= 0);

ALTER TABLE "matrizes_componentes"
  ADD CONSTRAINT "matrizes_componentes_ch_identidade"
    CHECK ("chTotal" = "chPresencial" + "chSincrona" + "chAssincrona"),
  ADD CONSTRAINT "matrizes_componentes_ch_nao_negativa"
    CHECK (
      "chTotal" >= 0
      AND "chPresencial" >= 0
      AND "chSincrona" >= 0
      AND "chAssincrona" >= 0
      AND "chExtensao" >= 0
    );
