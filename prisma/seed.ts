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
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
