import {PrismaPg} from "@prisma/adapter-pg";

import {PrismaClient} from "../generated/prisma/client.js";
import {env} from "./env.js";

const adapter = new PrismaPg({
  connectionString: env.DATABASE_URL,
});

interface IGlobalForPrisma {
  prisma?: PrismaClient;
}

// Utiliza um "truque" com o objeto global para evitar que múltiplas instâncias do Prisma
// sejam criadas em ambientes de desenvolvimento.
const globalForPrisma = globalThis as unknown as IGlobalForPrisma;

// O client Prisma será reutilizado se já existir no global, senão ele cria uma nova instância passando o adaptador.
export const prisma = globalForPrisma.prisma ?? new PrismaClient({adapter});

// Se não estiver em produção, armazena a instância no objeto global. Em produção, cada instância de execução pode ser isolada.
if (env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
