-- CreateEnum
CREATE TYPE "IntervaloCobranca" AS ENUM ('MONTH');

-- CreateTable
CREATE TABLE "precos_curso" (
    "id" UUID NOT NULL,
    "cursoId" UUID NOT NULL,
    "valor" DECIMAL(10,2) NOT NULL,
    "moeda" VARCHAR(3) NOT NULL DEFAULT 'brl',
    "intervalo" "IntervaloCobranca" NOT NULL DEFAULT 'MONTH',
    "stripeProductId" VARCHAR(100) NOT NULL,
    "stripePriceId" VARCHAR(100) NOT NULL,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "criadoEm" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "precos_curso_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "precos_curso_cursoId_key" ON "precos_curso"("cursoId");

-- AddForeignKey
ALTER TABLE "precos_curso" ADD CONSTRAINT "precos_curso_cursoId_fkey" FOREIGN KEY ("cursoId") REFERENCES "cursos"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AlterTable
ALTER TABLE "cursos" DROP COLUMN IF EXISTS "stripePriceId";
