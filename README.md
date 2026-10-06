<div align="center">

# OpenSGA API

Sistema de Gestão Acadêmica para IES brasileiras — projeto de estudo profissional.

API REST com identidade, currículo, matrícula, diário, financeiro (Stripe) e conformidade MEC.

[![Node.js](https://img.shields.io/badge/Node.js-24-339933?logo=nodedotjs&logoColor=white)](https://nodejs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-6-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Fastify](https://img.shields.io/badge/Fastify-5-000000?logo=fastify&logoColor=white)](https://fastify.dev/)
[![Prisma](https://img.shields.io/badge/Prisma-7-2D3748?logo=prisma&logoColor=white)](https://www.prisma.io/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-4169E1?logo=postgresql&logoColor=white)](https://www.postgresql.org/)
[![Stripe](https://img.shields.io/badge/Stripe-Checkout-635BFF?logo=stripe&logoColor=white)](https://stripe.com/)

[Documentação](#documentação) · [O que demonstra](#o-que-este-projeto-demonstra) · [Arquitetura](#arquitetura) · [Instalação](#instalação) · [Demo](#acesso-de-demonstração)

</div>

---

## Documentação

Contrato vivo (Scalar / OpenAPI):

| Ambiente | URL |
| :--- | :--- |
| Local | http://localhost:3333/docs |
| Produção | _cole aqui a URL pública do `/docs`_ |

<!--
Previews — salve as capturas em docs/assets/ e descomente:

![Scalar — contrato OpenAPI](./docs/assets/scalar-docs.png)
![Arquitetura / domínio](./docs/assets/arquitetura.png)
-->

---

## O que este projeto demonstra

Estudo de um SGA/ERP universitário: da matrícula à avaliação, com regras acadêmicas reais (MEC) e cobrança via Stripe.

| Decisão | Por quê importa |
| :--- | :--- |
| Arquitetura hexagonal por módulo | Separação `route → controller → service → repository` |
| RBAC com JWT | Papéis `ADMIN`, `PROFESSOR`, `ALUNO`, `RESPONSAVEL` |
| Domínio acadêmico | Matriz curricular, Decreto 12.456/2026, extensão ≥ 10%, notas AV/AVS/AV3 |
| Stripe no servidor | Catálogo, inscrição pública, Checkout (cartão/boleto) e webhook |
| Contrato vivo | OpenAPI + Scalar em [`/docs`](http://localhost:3333/docs) |

Contrato OpenAPI, BRD e spec de testes (BDD `QA-*`) ficam em [`docs/`](./docs).

---

## Arquitetura

```mermaid
flowchart TB
  HTTP[Fastify 5 + Zod 4] --> Auth[JWT · authenticate / authorize]
  HTTP --> Mods[Módulos de domínio]
  Mods --> Svc[Services — regras de negócio]
  Svc --> Repo[Repositories — Prisma 7]
  Repo --> PG[(PostgreSQL 16)]
  Svc --> Stripe[Stripe · e-mail]
```

Stack: **Node 24**, TypeScript, Fastify 5, Zod 4, Prisma 7 (`@prisma/adapter-pg`), PostgreSQL 16, Stripe, Nodemailer.

Cada módulo em `src/modules/` tem o mesmo recorte (`-route`, `-controller`, `-service`, `-repository`, `-schemas`). O SDK Stripe vive só em `src/lib/stripe.ts`.

---

## Instalação

**Requisitos:** Node.js **24.x** (`engine-strict`), Docker Compose, npm.

```bash
git clone <url-do-repositorio> opensga-api && cd opensga-api
cp .env-example .env          # preencha JWT_SECRET; Stripe é opcional
docker compose up -d          # PostgreSQL 16 em :5432
npm install
npx prisma generate --config prisma7.config.ts
npx prisma migrate dev --config prisma7.config.ts
npx prisma db seed --config prisma7.config.ts
npm run dev
```

| URL | Uso |
| :--- | :--- |
| http://localhost:3333/health | liveness |
| http://localhost:3333/docs | Scalar / OpenAPI |

Variáveis: [`.env-example`](./.env-example). Obrigatórias para subir: `DATABASE_URL` e `JWT_SECRET`. Stripe, SMTP e Cloudinary só entram se for exercitar cobrança ou e-mail.

<details>
<summary>Webhook Stripe (opcional)</summary>

```bash
stripe listen --forward-to localhost:3333/webhooks/stripe
```

Cole o `whsec_...` em `STRIPE_WEBHOOK_SECRET` e reinicie a API. Sem isso, a matrícula não passa de `PRE_MATRICULADO` para `ATIVO`.

</details>

---

## Acesso de demonstração

Login: `POST /api/v1/auth/login` com `{ "identificador", "senha" }` (e-mail, CPF, RA ou matrícula). Header: `Authorization: Bearer <token>`.

| Papel | Identificador | Senha |
| :--- | :--- | :--- |
| `ADMIN` | `testeadmin@opensga.dev` | `Admin@123456` |
| `PROFESSOR` | `professor@opensga.dev` | `Professor@123456` |
| `ALUNO` | `aluno@opensga.dev` | `Aluno@123456` |

O seed monta campi `SEDE-REC` / `POLO-EAD`, 10 cursos (presencial + EAD), matrizes 2026.1, turmas, diários e faturas.

---

## Superfície da API

Prefixo de negócio: **`/api/v1`**. Inscrição pública também em `/api` (sem versão).

| Área | Exemplos | Acesso |
| :--- | :--- | :--- |
| Auth | `/auth/login`, `/auth/me`, `/auth/senha` | público / JWT |
| Usuários | `/users`, `/users/professores`, `/users/alunos` | `ADMIN` |
| Acadêmico | `/academic/campi` … `/cursos` … `/matrizes` … `/turmas` | `ADMIN`¹ |
| Matrícula | `/matriculas` | `ADMIN` |
| Diário | `/diario`, `/diario/enturmar`, `/diario/avaliar`, `/diario/fechar-semestre` | `ADMIN` + titular |
| Financeiro | `/financeiro/precos`, `/faturas` | `ADMIN` |
| Ingresso | `GET /api/catalogo`, `POST /api/inscricao`, `POST /api/checkout` | público |
| Webhook | `POST /webhooks/stripe` | assinatura Stripe |
| Comunicação | `/comunicados`, `/ouvidoria/reclamacoes` | `ADMIN` (GET comunicados também `PROFESSOR`) |
| Dashboard | `/dashboard/admin`, `/dashboard/professor` | papel correspondente |

¹ GET de turmas também para `PROFESSOR` (somente as suas).

---

## Licença

ISC. Projeto de estudo — não é homologação MEC.
