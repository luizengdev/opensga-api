import bcrypt from "bcrypt";

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

  console.log(`✅ Campus: ${campus.nome} (${campus.id})`);
  console.log(`✅ Curso: ${curso.nome} (${curso.id})`);
  console.log(`✅ Matriz: ${matriz.nome} (${matriz.id})`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
