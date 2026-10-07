ALTER TABLE "turmas" ADD COLUMN "cursoId" UUID;

UPDATE "turmas" AS t
SET "cursoId" = sub."cursoId"
FROM (
  SELECT DISTINCT ON (t2.id) t2.id AS "turmaId", c.id AS "cursoId"
  FROM "turmas" t2
  INNER JOIN "cursos" c ON c."campusId" = t2."campusId"
  INNER JOIN "matrizes_curriculares" m ON m."cursoId" = c.id
  INNER JOIN "matrizes_componentes" mc
    ON mc."matrizCurricularId" = m.id
    AND mc."disciplinaId" = t2."disciplinaId"
  ORDER BY t2.id, m."anoVigencia" DESC
) AS sub
WHERE t.id = sub."turmaId";

UPDATE "turmas" AS t
SET "cursoId" = (
  SELECT c.id
  FROM "cursos" c
  WHERE c."campusId" = t."campusId"
  LIMIT 1
)
WHERE t."cursoId" IS NULL;

ALTER TABLE "turmas" ALTER COLUMN "cursoId" SET NOT NULL;

ALTER TABLE "turmas" ADD CONSTRAINT "turmas_cursoId_fkey" FOREIGN KEY ("cursoId") REFERENCES "cursos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

CREATE INDEX "turmas_cursoId_idx" ON "turmas"("cursoId");
