-- CreateEnum
CREATE TYPE "Role" AS ENUM ('ADMIN', 'PROFESSOR', 'ALUNO', 'RESPONSAVEL');

-- CreateEnum
CREATE TYPE "StatusMatricula" AS ENUM ('PRE_MATRICULADO', 'ATIVO', 'TRANCADO', 'CANCELADO', 'FORMADO', 'EVADIDO');

-- CreateEnum
CREATE TYPE "StatusFatura" AS ENUM ('PENDENTE', 'PAGA', 'ATRASADA', 'CANCELADA');

-- CreateEnum
CREATE TYPE "TipoReclamacao" AS ENUM ('FINANCEIRO', 'ACADEMICO', 'SECRETARIA', 'INFRAESTRUTURA', 'OUVIDORIA_GERAL');

-- CreateEnum
CREATE TYPE "StatusReclamacao" AS ENUM ('ABERTO', 'EM_ANALISE', 'RESPONDIDO', 'FECHADO');

-- CreateEnum
CREATE TYPE "ModalidadeCurso" AS ENUM ('PRESENCIAL', 'SEMIPRESENCIAL', 'EAD');

-- CreateEnum
CREATE TYPE "TipoComponente" AS ENUM ('CORE_VIDA_CARREIRA', 'ESPECIFICO', 'ELETIVA_TRILHA', 'EXTENSAO', 'OPTATIVO');

-- CreateEnum
CREATE TYPE "TipoEntrega" AS ENUM ('PRESENCIAL_FISICO', 'SINCRONO_MEDIADO', 'ASSINCRONO_DIGITAL');

-- CreateTable
CREATE TABLE "users" (
    "id" UUID NOT NULL,
    "nome" VARCHAR(150) NOT NULL,
    "email" VARCHAR(150) NOT NULL,
    "senhaHash" VARCHAR(255) NOT NULL,
    "cpf" VARCHAR(14) NOT NULL,
    "telefone" VARCHAR(20),
    "avatarUrl" VARCHAR(500),
    "role" "Role" NOT NULL DEFAULT 'ALUNO',
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "criadoEm" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "professores" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "matricula" VARCHAR(30) NOT NULL,
    "titulacao" VARCHAR(50) NOT NULL,
    "departamento" VARCHAR(100) NOT NULL,

    CONSTRAINT "professores_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "responsaveis" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "parentesco" VARCHAR(50) NOT NULL,

    CONSTRAINT "responsaveis_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "alunos" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "responsavelId" UUID,
    "ra" VARCHAR(20) NOT NULL,
    "dataNascimento" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "alunos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "campi" (
    "id" UUID NOT NULL,
    "nome" VARCHAR(120) NOT NULL,
    "codigoPolo" VARCHAR(20) NOT NULL,
    "cidade" VARCHAR(100) NOT NULL,
    "estado" VARCHAR(2) NOT NULL,
    "endereco" VARCHAR(255) NOT NULL,
    "criadoEm" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "campi_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cursos" (
    "id" UUID NOT NULL,
    "campusId" UUID NOT NULL,
    "nome" VARCHAR(150) NOT NULL,
    "codigoMec" VARCHAR(50),
    "modalidade" "ModalidadeCurso" NOT NULL DEFAULT 'PRESENCIAL',
    "duracaoSemestres" INTEGER NOT NULL DEFAULT 8,
    "criadoEm" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "cursos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "matrizes_curriculares" (
    "id" UUID NOT NULL,
    "cursoId" UUID NOT NULL,
    "nome" VARCHAR(100) NOT NULL,
    "anoVigencia" INTEGER NOT NULL,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "criadoEm" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "matrizes_curriculares_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "disciplinas" (
    "id" UUID NOT NULL,
    "nome" VARCHAR(150) NOT NULL,
    "codigo" VARCHAR(20) NOT NULL,
    "criadoEm" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "disciplinas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "matrizes_componentes" (
    "id" UUID NOT NULL,
    "matrizCurricularId" UUID NOT NULL,
    "disciplinaId" UUID NOT NULL,
    "semestreIdeal" INTEGER NOT NULL DEFAULT 1,
    "tipo" "TipoComponente" NOT NULL DEFAULT 'ESPECIFICO',
    "tipoEntrega" "TipoEntrega" NOT NULL DEFAULT 'PRESENCIAL_FISICO',
    "chTotal" INTEGER NOT NULL DEFAULT 60,
    "chPresencial" INTEGER NOT NULL DEFAULT 0,
    "chSincrona" INTEGER NOT NULL DEFAULT 0,
    "chAssincrona" INTEGER NOT NULL DEFAULT 0,
    "chExtensao" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "matrizes_componentes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "turmas" (
    "id" UUID NOT NULL,
    "campusId" UUID NOT NULL,
    "disciplinaId" UUID NOT NULL,
    "professorId" UUID NOT NULL,
    "codigo" VARCHAR(50) NOT NULL,
    "anoLetivo" INTEGER NOT NULL,
    "semestreLetivo" INTEGER NOT NULL,
    "capacidade" INTEGER NOT NULL DEFAULT 60,
    "horario" VARCHAR(100) NOT NULL,
    "salaOuLink" VARCHAR(255),
    "tipoEntrega" "TipoEntrega" NOT NULL DEFAULT 'PRESENCIAL_FISICO',
    "criadoEm" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "turmas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "matriculas" (
    "id" UUID NOT NULL,
    "alunoId" UUID NOT NULL,
    "cursoId" UUID NOT NULL,
    "matrizCurricularId" UUID NOT NULL,
    "status" "StatusMatricula" NOT NULL DEFAULT 'ATIVO',
    "periodoAtual" INTEGER NOT NULL DEFAULT 1,
    "semestreIngresso" VARCHAR(10) NOT NULL,
    "criadoEm" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "matriculas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "diarios_classe" (
    "id" UUID NOT NULL,
    "matriculaId" UUID NOT NULL,
    "turmaId" UUID NOT NULL,
    "notaA1" DECIMAL(4,2),
    "notaA2" DECIMAL(4,2),
    "notaAF" DECIMAL(4,2),
    "notaFinal" DECIMAL(4,2),
    "totalFaltas" INTEGER NOT NULL DEFAULT 0,
    "chCumprida" INTEGER NOT NULL DEFAULT 0,
    "aprovado" BOOLEAN,
    "criadoEm" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "diarios_classe_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "faturas" (
    "id" UUID NOT NULL,
    "alunoId" UUID NOT NULL,
    "descricao" VARCHAR(255) NOT NULL,
    "valor" DECIMAL(10,2) NOT NULL,
    "dataVencimento" TIMESTAMPTZ NOT NULL,
    "status" "StatusFatura" NOT NULL DEFAULT 'PENDENTE',
    "stripeInvoiceId" VARCHAR(100),
    "stripePaymentUrl" VARCHAR(500),
    "pagoEm" TIMESTAMPTZ,
    "criadoEm" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "faturas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "comunicados" (
    "id" UUID NOT NULL,
    "titulo" VARCHAR(200) NOT NULL,
    "conteudo" TEXT NOT NULL,
    "publicoAlvo" "Role"[],
    "criadoEm" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "comunicados_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "reclamacoes" (
    "id" UUID NOT NULL,
    "usuarioId" UUID NOT NULL,
    "assunto" VARCHAR(200) NOT NULL,
    "tipo" "TipoReclamacao" NOT NULL,
    "descricao" TEXT NOT NULL,
    "resposta" TEXT,
    "status" "StatusReclamacao" NOT NULL DEFAULT 'ABERTO',
    "criadoEm" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "reclamacoes_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "users_cpf_key" ON "users"("cpf");

-- CreateIndex
CREATE UNIQUE INDEX "professores_userId_key" ON "professores"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "professores_matricula_key" ON "professores"("matricula");

-- CreateIndex
CREATE UNIQUE INDEX "responsaveis_userId_key" ON "responsaveis"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "alunos_userId_key" ON "alunos"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "alunos_ra_key" ON "alunos"("ra");

-- CreateIndex
CREATE UNIQUE INDEX "campi_codigoPolo_key" ON "campi"("codigoPolo");

-- CreateIndex
CREATE UNIQUE INDEX "disciplinas_codigo_key" ON "disciplinas"("codigo");

-- CreateIndex
CREATE UNIQUE INDEX "matrizes_componentes_matrizCurricularId_disciplinaId_key" ON "matrizes_componentes"("matrizCurricularId", "disciplinaId");

-- CreateIndex
CREATE UNIQUE INDEX "turmas_codigo_key" ON "turmas"("codigo");

-- CreateIndex
CREATE UNIQUE INDEX "diarios_classe_matriculaId_turmaId_key" ON "diarios_classe"("matriculaId", "turmaId");

-- CreateIndex
CREATE UNIQUE INDEX "faturas_stripeInvoiceId_key" ON "faturas"("stripeInvoiceId");

-- AddForeignKey
ALTER TABLE "professores" ADD CONSTRAINT "professores_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "responsaveis" ADD CONSTRAINT "responsaveis_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "alunos" ADD CONSTRAINT "alunos_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "alunos" ADD CONSTRAINT "alunos_responsavelId_fkey" FOREIGN KEY ("responsavelId") REFERENCES "responsaveis"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cursos" ADD CONSTRAINT "cursos_campusId_fkey" FOREIGN KEY ("campusId") REFERENCES "campi"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "matrizes_curriculares" ADD CONSTRAINT "matrizes_curriculares_cursoId_fkey" FOREIGN KEY ("cursoId") REFERENCES "cursos"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "matrizes_componentes" ADD CONSTRAINT "matrizes_componentes_matrizCurricularId_fkey" FOREIGN KEY ("matrizCurricularId") REFERENCES "matrizes_curriculares"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "matrizes_componentes" ADD CONSTRAINT "matrizes_componentes_disciplinaId_fkey" FOREIGN KEY ("disciplinaId") REFERENCES "disciplinas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "turmas" ADD CONSTRAINT "turmas_campusId_fkey" FOREIGN KEY ("campusId") REFERENCES "campi"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "turmas" ADD CONSTRAINT "turmas_disciplinaId_fkey" FOREIGN KEY ("disciplinaId") REFERENCES "disciplinas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "turmas" ADD CONSTRAINT "turmas_professorId_fkey" FOREIGN KEY ("professorId") REFERENCES "professores"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "matriculas" ADD CONSTRAINT "matriculas_alunoId_fkey" FOREIGN KEY ("alunoId") REFERENCES "alunos"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "matriculas" ADD CONSTRAINT "matriculas_cursoId_fkey" FOREIGN KEY ("cursoId") REFERENCES "cursos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "matriculas" ADD CONSTRAINT "matriculas_matrizCurricularId_fkey" FOREIGN KEY ("matrizCurricularId") REFERENCES "matrizes_curriculares"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "diarios_classe" ADD CONSTRAINT "diarios_classe_matriculaId_fkey" FOREIGN KEY ("matriculaId") REFERENCES "matriculas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "diarios_classe" ADD CONSTRAINT "diarios_classe_turmaId_fkey" FOREIGN KEY ("turmaId") REFERENCES "turmas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "faturas" ADD CONSTRAINT "faturas_alunoId_fkey" FOREIGN KEY ("alunoId") REFERENCES "alunos"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reclamacoes" ADD CONSTRAINT "reclamacoes_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
