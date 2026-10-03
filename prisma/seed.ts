import bcrypt from "bcrypt";

import {dayjs} from "../src/lib/dayjs.js";
import {prisma} from "../src/lib/db.js";

async function main() {
  const senhaHash = await bcrypt.hash("Admin@123456", 10);

  const admin = await prisma.user.upsert({
    where: {email: "luizengdev@gmail.com"},
    update: {},
    create: {
      nome: "Luiz Almeida Alves Filho",
      email: "luizengdev@gmail.com",
      cpf: "000.000.000-00",
      senhaHash,
      role: "ADMIN",
      ativo: true,
    },
  });

  console.log(`✅ Usuário Admin pronto: ${admin.email} (Senha: Admin@123456)`);

  const campus = await prisma.campus.upsert({
    where: {codigoPolo: "SEDE-REC"},
    update: {},
    create: {
      nome: "Sede Recife",
      codigoPolo: "SEDE-REC",
      cidade: "Recife",
      estado: "PE",
      endereco: "Av. Conde da Boa Vista, 1000",
    },
  });

  const cursoExistente = await prisma.curso.findFirst({
    where: {nome: "Engenharia de Software", campusId: campus.id},
  });

  const curso =
    cursoExistente ??
    (await prisma.curso.create({
      data: {
        campusId: campus.id,
        nome: "Engenharia de Software",
        codigoMec: "ESW-001",
        modalidade: "PRESENCIAL",
        duracaoSemestres: 8,
      },
    }));

  const matrizExistente = await prisma.matrizCurricular.findFirst({
    where: {cursoId: curso.id, nome: "Matriz 2026.1"},
  });

  const matriz =
    matrizExistente ??
    (await prisma.matrizCurricular.create({
      data: {
        cursoId: curso.id,
        nome: "Matriz 2026.1",
        anoVigencia: 2026,
        ativo: true,
      },
    }));

  const disciplina = await prisma.disciplina.upsert({
    where: {codigo: "CALC1"},
    update: {},
    create: {
      nome: "Cálculo I",
      codigo: "CALC1",
    },
  });

  const componenteExistente = await prisma.matrizComponente.findUnique({
    where: {
      matrizCurricularId_disciplinaId: {
        matrizCurricularId: matriz.id,
        disciplinaId: disciplina.id,
      },
    },
  });

  if (!componenteExistente) {
    await prisma.matrizComponente.create({
      data: {
        matrizCurricularId: matriz.id,
        disciplinaId: disciplina.id,
        semestreIdeal: 1,
        tipo: "ESPECIFICO",
        tipoEntrega: "PRESENCIAL_FISICO",
        chTotal: 60,
        chPresencial: 60,
        chSincrona: 0,
        chAssincrona: 0,
        chExtensao: 0,
      },
    });
  }

  const professorUser = await prisma.user.upsert({
    where: {email: "professor@opensga.dev"},
    update: {},
    create: {
      nome: "Maria Silva",
      email: "professor@opensga.dev",
      cpf: "111.111.111-11",
      senhaHash: await bcrypt.hash("Professor@123456", 10),
      role: "PROFESSOR",
      ativo: true,
    },
  });

  const professor =
    (await prisma.professor.findUnique({where: {userId: professorUser.id}})) ??
    (await prisma.professor.create({
      data: {
        userId: professorUser.id,
        matricula: "PROF-001",
        titulacao: "Mestre",
        departamento: "Computação",
      },
    }));

  const agora = dayjs();
  const anoLetivo = agora.year();
  const semestreLetivo = agora.month() < 6 ? 1 : 2;
  const codigoTurma = `CALC1-${anoLetivo}.${semestreLetivo}`;

  const turma = await prisma.turma.upsert({
    where: {codigo: codigoTurma},
    update: {},
    create: {
      campusId: campus.id,
      disciplinaId: disciplina.id,
      professorId: professor.id,
      codigo: codigoTurma,
      anoLetivo,
      semestreLetivo,
      capacidade: 40,
      horario: "Seg 19h-22h",
      salaOuLink: "Bloco A - Sala 101",
      tipoEntrega: "PRESENCIAL_FISICO",
    },
  });

  const alunoUser = await prisma.user.upsert({
    where: {email: "aluno@opensga.dev"},
    update: {},
    create: {
      nome: "João Santos",
      email: "aluno@opensga.dev",
      cpf: "222.222.222-22",
      senhaHash: await bcrypt.hash("Aluno@123456", 10),
      role: "ALUNO",
      ativo: true,
    },
  });

  const aluno =
    (await prisma.aluno.findUnique({where: {userId: alunoUser.id}})) ??
    (await prisma.aluno.create({
      data: {
        userId: alunoUser.id,
        ra: "2026000001",
        dataNascimento: dayjs("2004-03-15", "YYYY-MM-DD").toDate(),
      },
    }));

  const matriculaExistente = await prisma.matricula.findFirst({
    where: {alunoId: aluno.id, cursoId: curso.id, matrizCurricularId: matriz.id},
  });

  const matricula =
    matriculaExistente ??
    (await prisma.matricula.create({
      data: {
        alunoId: aluno.id,
        cursoId: curso.id,
        matrizCurricularId: matriz.id,
        status: "ATIVO",
        periodoAtual: 1,
        semestreIngresso: "2026.1",
      },
    }));

  await prisma.diarioClasse.upsert({
    where: {
      matriculaId_turmaId: {
        matriculaId: matricula.id,
        turmaId: turma.id,
      },
    },
    update: {},
    create: {
      matriculaId: matricula.id,
      turmaId: turma.id,
    },
  });

  const faturaExistente = await prisma.fatura.findFirst({
    where: {alunoId: aluno.id, descricao: "Mensalidade 2026.1"},
  });

  if (!faturaExistente) {
    await prisma.fatura.create({
      data: {
        alunoId: aluno.id,
        descricao: "Mensalidade 2026.1",
        valor: 980.5,
        dataVencimento: dayjs("2026-04-10", "YYYY-MM-DD").toDate(),
        status: "PENDENTE",
      },
    });
  }

  const comunicadoExistente = await prisma.comunicado.findFirst({
    where: {titulo: "Início do período letivo 2026.1"},
  });

  if (!comunicadoExistente) {
    await prisma.comunicado.create({
      data: {
        titulo: "Início do período letivo 2026.1",
        conteudo: "O período letivo começa na próxima segunda. Confira horários e diários no portal interno.",
        publicoAlvo: ["ADMIN", "PROFESSOR"],
      },
    });
  }

  console.log(`✅ Campus: ${campus.nome} (${campus.id})`);
  console.log(`✅ Curso: ${curso.nome} (${curso.id})`);
  console.log(`✅ Matriz: ${matriz.nome} (${matriz.id})`);
  console.log(`✅ Professor: ${professorUser.email} (Senha: Professor@123456)`);
  console.log(`✅ Aluno: ${alunoUser.email} / RA ${aluno.ra} (Senha: Aluno@123456)`);
  console.log(`✅ Turma: ${turma.codigo}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
