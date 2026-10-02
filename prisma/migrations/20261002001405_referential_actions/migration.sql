-- DropForeignKey
ALTER TABLE "reclamacoes" DROP CONSTRAINT "reclamacoes_usuarioId_fkey";

-- DropForeignKey
ALTER TABLE "turmas" DROP CONSTRAINT "turmas_campusId_fkey";

-- AddForeignKey
ALTER TABLE "turmas" ADD CONSTRAINT "turmas_campusId_fkey" FOREIGN KEY ("campusId") REFERENCES "campi"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reclamacoes" ADD CONSTRAINT "reclamacoes_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
