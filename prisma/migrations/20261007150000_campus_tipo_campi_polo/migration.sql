CREATE TYPE "TipoCampus" AS ENUM ('CAMPI', 'POLO');

ALTER TABLE "campi" ADD COLUMN "tipo" "TipoCampus" NOT NULL DEFAULT 'CAMPI';

UPDATE "campi"
SET "tipo" = 'POLO'
WHERE "codigoPolo" ILIKE '%POLO%';
