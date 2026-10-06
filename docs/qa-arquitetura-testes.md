# Especificação de Testes — OpenSGA API

| Campo              | Valor                                                          |
| :----------------- | :------------------------------------------------------------- |
| Versão             | 1.0.0                                                          |
| Data               | 02/10/2026                                                     |
| Público            | QA, Postman/Newman, Playwright (E2E do front), desenvolvimento |
| Base HTTP          | `{{API_BASE_URL}}` (dev: `http://localhost:3333`)              |
| Prefixo de negócio | `/api/v1`                                                      |
| Contrato vivo      | Scalar `/docs` e OpenAPI `/swagger.json`                       |
| Fonte de regras    | [brd.md](./brd.md) + implementação em `src/modules/`           |

Este documento é a **fonte de verdade para testes**. Use-o para execução manual agora, collection Postman depois (pastas = seções 6–14; requests = IDs `QA-*`) e **Playwright no frontend** (um `test()` por ID, mesmos Given/When/Then).

---

## 1. Como usar

1. Suba o Postgres e rode `npx prisma db seed --config prisma7.config.ts`.
2. Autentique com as personas da seção 4 e grave o JWT em `{{token_admin}}` / `{{token_professor}}` / `{{token_aluno}}`.
3. Execute os critérios de aceite (CA) e os cenários Gherkin. Cada cenário tem um **ID de rastreio** para o Postman (`QA-AUTH-01`, etc.).
4. Falha = divergência entre este spec e a API. Se a API estiver certa e o spec errado, atualize este arquivo.

**Fora de escopo nesta versão:** portal aluno/responsável, upload Cloudinary, paginação, forgot-password, suíte automatizada no CI.

---

## 2. Arquitetura de testes

```
┌─────────────────────────────────────────────────────────────┐
│  Contrato (este doc + OpenAPI)                              │
├──────────────┬──────────────────┬───────────────────────────┤
│  Smoke       │  API / contrato  │  Regras de negócio        │
│  /health     │  schema, status  │  MEC, notas, RBAC, 409    │
│  login+me    │  401/403/404     │  enturmação, CH, exclusão │
└──────────────┴──────────────────┴───────────────────────────┘
         ▲                    ▲
         │                    └── Collection Postman (próximo passo)
         └── Execução manual / Newman
```

| Camada    | O que cobre                                             | Quando rodar                    |
| :-------- | :------------------------------------------------------ | :------------------------------ |
| Smoke     | `/health`, login admin, `GET /auth/me`                  | Sempre, antes de qualquer suíte |
| Contrato  | Status HTTP, `{ error, message? }`, campos obrigatórios | Cada release                    |
| Negócio   | Tabelas de decisão (notas, MEC, exclusão, RBAC)         | Cada mudança no domínio         |
| Segurança | Sem token, token inválido, papel errado, conta inativa  | Cada release                    |
| Regressão | Fluxo ponta a ponta da seção 15                         | Antes de merge em `main`        |

**Ordem sugerida de execução:** identidade → acadêmico → matrícula → turma → enturmação → avaliação → dashboards → financeiro → comunicação → exclusões 409.

---

## 3. Contrato transversal

### 3.1 Autenticação

- Header: `Authorization: Bearer {{token}}`.
- Login: `POST /api/v1/auth/login` com `{ "identificador", "senha" }`.
- Identificador aceito: e-mail, CPF, RA (aluno) ou matrícula funcional (professor).
- JWT inválido, ausente ou expirado → **401** `{ error, message? }`.
- Conta `ativo = false` no login **e** em qualquer rota autenticada → **401**.
- Papel sem permissão → **403**.

### 3.2 Forma de erro (obrigatória)

```json
{"error": "string", "message": "string opcional"}
```

| HTTP | Uso                                                                    |
| :--- | :--------------------------------------------------------------------- |
| 200  | GET/PATCH/DELETE com corpo                                             |
| 201  | POST de criação                                                        |
| 400  | Validação Zod ou regra de negócio (CH, senha atual, matrícula inativa) |
| 401  | Sem JWT, JWT inválido, credenciais erradas, conta inativa              |
| 403  | RBAC ou professor acessando turma/diário de outro docente              |
| 404  | Recurso inexistente                                                    |
| 409  | Exclusão bloqueada por Restrict (filhos existentes)                    |

### 3.3 Datas e enums

- Entrada data civil: `YYYY-MM-DD` (`z.iso.date()`).
- Saída timestamp: ISO-8601 datetime.
- CPF nos cadastros: **14 caracteres** (`000.000.000-00`).
- Semestre de ingresso: `AAAA.S` (`2026.1` ou `2026.2`).
- Enums Prisma: `Role`, `StatusMatricula`, `StatusFatura`, `StatusReclamacao`, `TipoReclamacao`, `ModalidadeCurso`, `TipoComponente`, `TipoEntrega`.

### 3.4 Variáveis Postman (preparar depois)

| Variável                                                     | Exemplo                    |
| :----------------------------------------------------------- | :------------------------- |
| `baseUrl`                                                    | `http://localhost:3333`    |
| `token_admin`                                                | JWT admin                  |
| `token_professor`                                            | JWT professor              |
| `token_aluno`                                                | JWT aluno (só login/`/me`) |
| `campusId`, `cursoId`, `matrizId`, `disciplinaId`, `turmaId` | UUIDs do seed / setup      |
| `matriculaId`, `diarioId`, `professorId`, `alunoUserId`      | UUIDs do fluxo             |

---

## 4. Personas e dados de seed

Rodar seed: `npx prisma db seed --config prisma7.config.ts`.

| Persona         | Identificador                                                         | Senha              | Role        | Uso                                         |
| :-------------- | :-------------------------------------------------------------------- | :----------------- | :---------- | :------------------------------------------ |
| Secretaria      | `testeadmin@opensga.dev` ou `000.000.000-00`                          | `Admin@123456`     | `ADMIN`     | CRUD + dashboard admin                      |
| Docente         | `professor@opensga.dev`, CPF `111.111.111-11` ou matrícula `PROF-001` | `Professor@123456` | `PROFESSOR` | Turmas próprias, diário, dashboard, avaliar |
| Discente (demo) | `aluno@opensga.dev`, CPF `222.222.222-22` ou RA `2026000001`          | `Aluno@123456`     | `ALUNO`     | **Somente** login e `/me`                   |

Dados acadêmicos criados pelo seed: campi `SEDE-REC` (5 cursos PRESENCIAL) e `POLO-EAD` (5 cursos EAD); cada curso tem matriz 2026.1 (Ética + específica + extensão ≥ 10%), 1 professor, 2 alunos `ATIVO`, turma do **período corrente** e diários. Personas canônicas inalteradas: `professor@opensga.dev` (turma `CALC1-{ano}.{semestre}`), `aluno@opensga.dev` (RA `2026000001`, diário sem AV/AVS, fatura `PENDENTE`). Demais logins: `professor.{sigla}@opensga.dev` e `aluno.{sigla}.{1|2}@opensga.dev` (senhas iguais às personas). 1 reclamação `ABERTO`.

Período corrente da API: ano civil atual; semestre `1` de janeiro a junho (`getMonth() < 6`), senão `2`. Dashboard e seed usam a mesma regra.

---

## 5. Matriz RBAC

| Recurso                                                                              | Público | ADMIN |     PROFESSOR      | ALUNO |
| :----------------------------------------------------------------------------------- | :-----: | :---: | :----------------: | :---: |
| `GET /health`                                                                        |   sim   |   —   |         —          |   —   |
| `POST /auth/login`                                                                   |   sim   |   —   |         —          |   —   |
| `GET /auth/me`, `PATCH /auth/senha`                                                  |         |  sim  |        sim         |  sim  |
| CRUD users, academic (exceto GET turma), matriculas, faturas, comunicados, ouvidoria |         |  sim  |        403         |  403  |
| `GET /academic/turmas`, `GET /academic/turmas/:id`                                   |         | todas |     só as suas     |  403  |
| `GET /diario`, `GET /diario/:id`                                                     |         | todos | só das suas turmas |  403  |
| `POST /diario/enturmar`, `DELETE /diario/:id`                                        |         |  sim  |        403         |  403  |
| `PATCH /diario/avaliar`                                                              |         |  sim  | só se for titular  |  403  |
| `GET /dashboard/admin`                                                               |         |  sim  |        403         |  403  |
| `GET /dashboard/professor`                                                           |         |  403  |        sim         |  403  |

**CA-RBAC-01.** Sem `Authorization`, toda rota protegida retorna 401.  
**CA-RBAC-02.** Token de professor em rota ADMIN-only retorna 403.  
**CA-RBAC-03.** Token de aluno além de `/auth/*` retorna 403.

```gherkin
@QA-RBAC-01
Cenário: Rota protegida sem token
  Dado que não envio o header Authorization
  Quando solicito GET /api/v1/auth/me
  Então a resposta é 401
  E o corpo contém a chave "error"

@QA-RBAC-02
Cenário: Professor tenta criar campus
  Dado que estou autenticado como PROFESSOR
  Quando envio POST /api/v1/academic/campi com payload válido
  Então a resposta é 403
```

---

## 6. Identidade e sessão

### Regras

- Login único por e-mail, CPF, RA ou matrícula funcional.
- Senha de login: mínimo 6 caracteres; senha nova (`PATCH /auth/senha`): mínimo 8.
- `/me` devolve `id`, `nome`, `email`, `cpf`, `role`, `avatarUrl`, `ativo`, `aluno.{id, ra}|null`, `professor.{id, matricula, titulacao}|null`.
- Troca de senha exige senha atual correta.
- Conta inativa não autentica e não usa JWT antigo.

### Critérios de aceite

**CA-AUTH-01.** Login admin com e-mail e senha corretos retorna 200, `token` e `user.role = ADMIN`.  
**CA-AUTH-02.** Login professor com matrícula `PROF-001` retorna `role = PROFESSOR`.  
**CA-AUTH-03.** Login aluno com RA retorna `role = ALUNO`.  
**CA-AUTH-04.** Identificador ou senha inválidos → 401.  
**CA-AUTH-05.** `GET /auth/me` do professor inclui `professor.id` e `professor.matricula`.  
**CA-AUTH-06.** `GET /auth/me` do aluno inclui `aluno.id` e `aluno.ra`.  
**CA-AUTH-07.** `PATCH /auth/senha` com senha atual correta → 200 `{ message }`; login seguinte só aceita a senha nova.  
**CA-AUTH-08.** Senha atual incorreta → 400.  
**CA-AUTH-09.** Usuário `ativo = false` no login → 401; JWT emitido antes da inativação também → 401.

```gherkin
@QA-AUTH-01
Cenário: Login unificado do administrador
  Dado o identificador "testeadmin@opensga.dev" e a senha "Admin@123456"
  Quando envio POST /api/v1/auth/login
  Então a resposta é 200
  E o corpo contém token JWT
  E user.role é "ADMIN"

@QA-AUTH-02
Cenário: Login do professor por matrícula funcional
  Dado o identificador "PROF-001" e a senha "Professor@123456"
  Quando envio POST /api/v1/auth/login
  Então user.role é "PROFESSOR"

@QA-AUTH-04
Cenário: Credenciais inválidas
  Dado um identificador existente e senha "errada"
  Quando envio POST /api/v1/auth/login
  Então a resposta é 401

@QA-AUTH-05
Cenário: Perfil do professor autenticado
  Dado um JWT de PROFESSOR
  Quando envio GET /api/v1/auth/me
  Então a resposta é 200
  E professor.id é um UUID
  E aluno é null

@QA-AUTH-07
Cenário: Troca de senha com senha atual válida
  Dado um JWT válido
  Quando envio PATCH /api/v1/auth/senha com senhaAtual correta e senhaNova com 8+ caracteres
  Então a resposta é 200
  E o login com a senha nova sucede
  E o login com a senha antiga retorna 401

@QA-AUTH-09
Cenário: Conta inativada após o login
  Dado um JWT emitido para um usuário ativo
  E um ADMIN inativa esse usuário (PATCH /users/:id { "ativo": false })
  Quando o titular reutiliza o JWT em GET /auth/me
  Então a resposta é 401
```

---

## 7. Usuários (ADMIN)

### Regras

- Listar usuários com filtro opcional `?role=`.
- Criar ADMIN (`POST /users/admins`) e PROFESSOR (`POST /users/professores`) com senha 8–72, e-mail e CPF únicos.
- Aluno e responsável **não** têm POST próprio: nascem em `POST /matriculas`.
- `DELETE /users/:id` não pode ser o próprio autenticado (400).
- Apagar professor com turma → **409**.
- Apagar usuário remove perfil e reclamações (Cascade).

### Critérios de aceite

**CA-USR-01.** `GET /users?role=PROFESSOR` devolve só professores.  
**CA-USR-02.** Criar professor com CPF/e-mail novos → 201 e `user.role = PROFESSOR`.  
**CA-USR-03.** CPF ou e-mail duplicado → 400.  
**CA-USR-04.** `GET /users/alunos` e `GET /users/responsaveis` listam perfis existentes.  
**CA-USR-05.** ADMIN não consegue `DELETE` o próprio `id` → 400.  
**CA-USR-06.** DELETE de professor titular de turma → 409.

```gherkin
@QA-USR-02
Cenário: Cadastro de professor
  Dado um JWT de ADMIN
  Quando envio POST /api/v1/users/professores com nome, email, cpf, senha, matricula, titulacao e departamento válidos
  Então a resposta é 201
  E o corpo contém user.role "PROFESSOR"

@QA-USR-05
Cenário: Autodelete bloqueado
  Dado o JWT do próprio ADMIN
  Quando envio DELETE /api/v1/users/{{meuUserId}}
  Então a resposta é 400
```

---

## 8. Acadêmico e conformidade MEC

### 8.1 Campus, curso, disciplina (CRUD ADMIN)

**Regras.** Campus tem `codigoPolo` único e `estado` com 2 letras. Curso exige `campusId` existente. Disciplina é catálogo global (`codigo` único).

**CA-ACA-01.** CRUD campus: POST 201, GET lista/id 200, PATCH 200, DELETE sem matrículas 200.  
**CA-ACA-02.** Campus/curso inexistente em GET/PATCH/DELETE → 404.  
**CA-ACA-03.** Curso com `campusId` inválido → 404.  
**CA-ACA-04.** `GET /academic/cursos?campusId=` filtra pelo campus.

```gherkin
@QA-ACA-01
Cenário: Criar e buscar campus
  Dado um JWT de ADMIN
  Quando envio POST /api/v1/academic/campi com nome, codigoPolo, cidade, estado e endereco
  Então a resposta é 201
  E GET /academic/campi/:id devolve o mesmo codigoPolo
```

### 8.2 Matriz e componente

**Regras.**

- Matriz pertence a um curso existente; `PATCH` altera `nome`, `anoVigencia`, `ativo`.
- Componente: `chPresencial + chSincrona + chAssincrona = chTotal` (obrigatório no POST e no PATCH se qualquer CH vier no body).
- `chExtensao` é independente da soma das três modalidades (horas de extensão curricular).
- Tipos: `CORE_VIDA_CARREIRA`, `ESPECIFICO`, `ELETIVA_TRILHA`, `EXTENSAO`, `OPTATIVO`.
- Entrega: `PRESENCIAL_FISICO`, `SINCRONO_MEDIADO`, `ASSINCRONO_DIGITAL`.
- Par único `matriz + disciplina` não pode duplicar.

**CA-MTZ-01.** POST matriz em curso existente → 201.  
**CA-MTZ-02.** POST componente com soma CH ≠ total → 400 e mensagem citando as parcelas.  
**CA-MTZ-03.** POST componente com soma correta → 201.  
**CA-MTZ-04.** PATCH só `semestreIdeal` (sem CH) não revalida soma.  
**CA-MTZ-05.** PATCH alterando `chTotal` sem ajustar parcelas inconsistentes → 400.  
**CA-MTZ-06.** `GET /academic/matrizes?cursoId=` filtra.  
**CA-MTZ-07.** `GET /academic/matrizes/:id` inclui componentes.

```gherkin
@QA-MTZ-02
Cenário: Carga horária inconsistente
  Dado uma matriz existente
  Quando adiciono componente com chTotal 60, chPresencial 40, chSincrona 10, chAssincrona 0
  Então a resposta é 400
  E a mensagem informa que 50h ≠ 60h

@QA-MTZ-03
Cenário: Carga horária consistente
  Dado uma matriz e uma disciplina existentes
  Quando adiciono componente com chTotal 60, presencial 40, sincrona 10, assincrona 10, extensao 8
  Então a resposta é 201
```

### 8.3 Auditoria MEC

`GET /academic/matrizes/:id/auditoria` (estrito) e `GET /academic/matrizes/:id/auditoria-mec` (indicador 200).

**Regras.**

- Matriz inexistente → 404.
- Matriz sem componentes → 400.
- Identidade: `chTotal = chPresencial + chSincrona + chAssincrona` em cada componente.
- Modalidade do curso (Decreto 12.456/2026) aplicada em **cada disciplina**:
  - PRESENCIAL: presencial ≥ 70% da CH.
  - SEMIPRESENCIAL: presencial ≥ 30% **e** síncrona ≥ 20%; assíncrona ≤ 50%.
  - EAD: presencial ≥ 10% **e** síncrona ≥ 10%.
- Extensão: Σ `chTotal` dos componentes `tipo = EXTENSAO` ≥ 10% da CH da matriz.
- `GET /auditoria` → 200 se conforme; **409** com payload de violações se inconforme.
- `GET /auditoria-mec` → sempre 200 (dashboard), com `conformeDecreto12456` e `violacoes[]`.

**CA-MEC-01.** Matriz com extensão ≥ 10% e disciplinas nos pisos → `GET /auditoria` 200 e `conformeDecreto12456 = true`.  
**CA-MEC-02.** Matriz com extensão &lt; 10% → `GET /auditoria` 409; `GET /auditoria-mec` 200 com `cumpreRegra10PorcentoExtensao = false`.  
**CA-MEC-03.** Matriz vazia → 400.  
**CA-MEC-04.** Id inexistente → 404.  
**CA-MEC-05.** Disciplina EAD com presencial &lt; 10% → 409 em `/auditoria`.

```gherkin
@QA-MEC-01
Cenário: Matriz conforme CNE/CES 7/2018
  Dado uma matriz cuja soma de chExtensao é pelo menos 10% da soma de chTotal
  Quando solicito GET /academic/matrizes/:id/auditoria-mec
  Então a resposta é 200
  E cumpreRegra10PorcentoExtensao é true

@QA-MEC-02
Cenário: Matriz inconforme em extensão
  Dado uma matriz com extensão abaixo de 10%
  Quando solicito a auditoria MEC
  Então a resposta é 200
  E cumpreRegra10PorcentoExtensao é false
```

### 8.4 Turmas

**Regras.** CRUD ADMIN. GET lista/id também PROFESSOR (somente `professor.userId = JWT.sub`). Filtros opcionais: `campusId`, `anoLetivo`, `semestreLetivo`. Lista inclui `quantidadeDiarios`.

**CA-TUR-01.** ADMIN cria turma com campus, disciplina e professor existentes → 201.  
**CA-TUR-02.** FK inexistente → 404.  
**CA-TUR-03.** ADMIN lista todas; professor lista só as suas.  
**CA-TUR-04.** Professor em `GET /turmas/:id` de outra turma → 403.  
**CA-TUR-05.** DELETE turma remove diários (Cascade) e retorna 200.

```gherkin
@QA-TUR-03
Cenário: Professor vê apenas as próprias turmas
  Dado um JWT de PROFESSOR titular da turma do seed
  Quando envio GET /api/v1/academic/turmas
  Então todos os itens têm professor.user.id igual ao meu sub
  E a turma do seed aparece

@QA-TUR-04
Cenário: Professor acessa turma de outro docente
  Dado um JWT de PROFESSOR
  E um turmaId de outro professor
  Quando envio GET /api/v1/academic/turmas/:id
  Então a resposta é 403
```

---

## 9. Matrícula e onboarding

### Regras

- `POST /matriculas` cria User ALUNO + Aluno (RA `ano + 6 dígitos`) + Matricula `ATIVO` período 1.
- Matriz deve existir, estar `ativo = true` e pertencer ao `cursoId`.
- CPF/e-mail do aluno únicos na instituição.
- Responsável: ou nenhum campo, ou os quatro (`responsavelCpf`, `responsavelNome`, `responsavelEmail`, `parentesco`). CPF/e-mail do responsável ≠ aluno.
- Lista: `GET /matriculas?status=` (sem filtro = todos os status).
- `PATCH /matriculas/:id/status` com `PRE_MATRICULADO | ATIVO | TRANCADO | CANCELADO | FORMADO | EVADIDO`.
- `DELETE /matriculas/:id` remove diários; **não** apaga o aluno.

### Critérios de aceite

**CA-MAT-01.** POST com matriz ativa do curso → 201 com `ra`, `matriculaId`, `matrizNome`.  
**CA-MAT-02.** Matriz inativa, de outro curso ou inexistente → 404.  
**CA-MAT-03.** CPF ou e-mail já cadastrado → 400.  
**CA-MAT-04.** Responsável parcial → 400.  
**CA-MAT-05.** `GET /matriculas?status=ATIVO` não devolve trancadas.  
**CA-MAT-06.** PATCH status → 200 `{ id, status }`.  
**CA-MAT-07.** DELETE matrícula → 200; `GET /users/alunos/:id` do aluno ainda existe.

```gherkin
@QA-MAT-01
Cenário: Efetivar matrícula em matriz ativa
  Dado cursoId e matrizCurricularId ativos e compatíveis
  E CPF e e-mail inéditos
  Quando envio POST /api/v1/matriculas
  Então a resposta é 201
  E ra começa com o ano corrente
  E o aluno consegue logar com o RA (senha provisória do e-mail; em teste local, cadastrar senha conhecida ou usar seed)

@QA-MAT-02
Cenário: Matriz incompatível com o curso
  Dado uma matriz de outro curso
  Quando envio POST /matriculas
  Então a resposta é 404

@QA-MAT-07
Cenário: Excluir matrícula preserva o aluno
  Dado uma matrícula existente
  Quando envio DELETE /matriculas/:id
  Então a resposta é 200
  E o perfil ALUNO continua listável
```

---

## 10. Diário, enturmação e avaliação

### 10.1 Enturmação (`POST /diario/enturmar`) — ADMIN

**Regras.**

1. Matrícula existe.
2. Status da matrícula é `ATIVO`.
3. Turma existe.
4. `disciplinaId` da turma está nos componentes da matriz da matrícula.
5. Aluno ainda não está enturmado na **mesma disciplina** (qualquer turma) no período.

**CA-ENT-01.** Matrícula ATIVO + disciplina da matriz + primeira vez → 201 com `id` do diário.  
**CA-ENT-02.** Matrícula TRANCADO (ou outro status ≠ ATIVO) → 400.  
**CA-ENT-03.** Disciplina fora da matriz → 400.  
**CA-ENT-04.** Segunda enturmação na mesma disciplina → 400.  
**CA-ENT-05.** Matrícula ou turma inexistente → 404.

```gherkin
@QA-ENT-01
Cenário: Enturmar aluno ativo na disciplina da grade
  Dado matrícula ATIVO cuja matriz contém CALC1
  E uma turma de CALC1
  Quando envio POST /api/v1/diario/enturmar
  Então a resposta é 201
  E o corpo contém matriculaId e turmaId

@QA-ENT-03
Cenário: Disciplina estranha à matriz
  Dado uma turma de disciplina que não está na matriz do aluno
  Quando tento enturmar
  Então a resposta é 400
```

### 10.2 Leitura e desenturmação

**CA-DIA-01.** ADMIN lista todos; professor só diários das turmas que rege.  
**CA-DIA-02.** Professor em diário de outra turma → 403.  
**CA-DIA-03.** `DELETE /diario/:id` (ADMIN) remove a enturmação → 200; professor recebe 403.

### 10.3 Motor de notas (`PATCH /diario/avaliar`)

Entrada: `diarioClasseId` + opcionais `notaAv`, `notaAvs`, `notaAv3` (0–10), `totalFaltas` (≥ 0). Campos omitidos preservam o valor gravado.

Seja `NS = MAX(AV, AVS)` (nota nula é ignorada) e `limiteFaltas = floor(chTotal × 0,25)`.
O PATCH **não** fecha o semestre: persiste lançamento, `notaSemestral` e `habilitaAv3`. `chCumprida` e `statusDisciplina` finais vêm de `POST /diario/fechar-semestre`.

| Condição no PATCH                         | `notaSemestral` | `habilitaAv3` | `statusDisciplina` |
| :---------------------------------------- | :-------------- | :------------ | :----------------- |
| Sem AV e sem AVS                          | `null`          | false         | EM_ABERTO          |
| NS ≥ 6,0 e faltas ≤ limite                | NS              | false         | EM_ABERTO          |
| NS &lt; 6,0 e faltas ≤ limite             | NS              | true          | EM_ABERTO          |
| Faltas > limite                           | NS (se houver)  | false         | EM_ABERTO          |
| AV3 sem `habilitaAv3`                     | —               | —             | 400                |
| Semestre já fechado                       | —               | —             | 409                |

| Condição no POST fechar-semestre          | `statusDisciplina` | `mediaFinal`    | `chCumprida` |
| :---------------------------------------- | :----------------- | :-------------- | :----------- |
| Faltas > 25%                              | RF                 | `null`          | 0            |
| NS ≥ 6,0                                  | APROVADO           | NS              | chTotal      |
| NS &lt; 6,0 com AV3 e MF ≥ 5,0            | APROVADO           | (NS+AV3)/2      | chTotal      |
| NS &lt; 6,0 com AV3 e MF &lt; 5,0         | RN                 | (NS+AV3)/2      | 0            |
| NS &lt; 6,0 sem AV3, ou sem NS            | —                  | —               | 409 atômico  |

**CA-AVA-01.** Titular lança AV=7 e AVS=5, faltas 0 → NS 7, `habilitaAv3` false.  
**CA-AVA-02.** AV=4 e AVS=5, faltas 0, sem AV3 → NS 5, `habilitaAv3` true.  
**CA-AVA-03.** Mesmo caso + AV3=7 → PATCH aceita; POST fechar → MF 6, APROVADO, chCumprida = chTotal.  
**CA-AVA-04.** AV=10, faltas > 25% → PATCH `habilitaAv3` false; POST fechar → RF, chCumprida 0.  
**CA-AVA-05.** Professor **não** titular → 403.  
**CA-AVA-06.** ADMIN pode lançar em qualquer turma.  
**CA-AVA-07.** Notas fora de 0–10 → 400.  
**CA-AVA-08.** POST fechar com aluno ainda sem AV3 obrigatória → 409 e nenhum diário é fechado.

```gherkin
@QA-AVA-01
Cenário: Aprovação direta
  Dado um diário cuja disciplina tem chTotal 60
  E sou o professor titular
  Quando envio PATCH /diario/avaliar com notaAv 7, notaAvs 5, totalFaltas 0
  Então notaSemestral é 7
  E habilitaAv3 é false
  E statusDisciplina é EM_ABERTO

@QA-AVA-02
Cenário: Elegível à AV3
  Dado chTotal 60 e faltas dentro do limite
  Quando lanço AV 4 e AVS 5 sem AV3
  Então notaSemestral é 5
  E habilitaAv3 é true

@QA-AVA-03
Cenário: Aprovado na AV3 após fechamento
  Dado o diário do cenário anterior
  Quando lanço notaAv3 7
  E envio POST /diario/fechar-semestre da turma
  Então mediaFinal é 6
  E statusDisciplina é APROVADO
  E chCumprida é 60

@QA-AVA-04
Cenário: Reprovação por falta no fechamento
  Dado chTotal 60 (limite 15 faltas)
  Quando lanço notaAv 10 e totalFaltas 16
  E fecho o semestre
  Então statusDisciplina é RF
  E chCumprida é 0

@QA-AVA-05
Cenário: Professor de outra turma tenta lançar
  Dado um JWT de professor que não rege a turma do diário
  Quando envio PATCH /diario/avaliar
  Então a resposta é 403
```

---

## 11. Dashboards

Período: query `anoLetivo` e `semestreLetivo` opcionais; default = período corrente (seção 4).

### Admin — `GET /dashboard/admin`

Corpo: `matriculasPorStatus[]` (todos os valores de `StatusMatricula`, quantidade 0 se vazio), `turmasNoPeriodo`, `ocupacaoMedia` (média de diários/capacidade × 100, duas casas), `faturasPendentes`, `reclamacoesAbertas`.

**CA-DASH-01.** ADMIN 200; PROFESSOR 403.  
**CA-DASH-02.** Sem query, `anoLetivo`/`semestreLetivo` batem com a regra do período corrente.  
**CA-DASH-03.** Após o seed, `turmasNoPeriodo ≥ 1` e existe status `ATIVO` ≥ 1.  
**CA-DASH-04.** Query de um período sem turmas → `turmasNoPeriodo = 0` e `ocupacaoMedia = 0`.

### Professor — `GET /dashboard/professor`

Corpo: `turmas[]` (`id`, `codigo`, `capacidade`, `quantidadeDiarios`) só das suas; `lancamentosPendentes` = diários das suas turmas do período com `notaSemestral` nula.

**CA-DASH-05.** PROFESSOR 200; ADMIN 403.  
**CA-DASH-06.** Seed: a turma `CALC1-*` aparece e `lancamentosPendentes ≥ 1` (diário sem notas).

```gherkin
@QA-DASH-01
Cenário: Dashboard administrativo
  Dado um JWT de ADMIN
  Quando envio GET /api/v1/dashboard/admin
  Então a resposta é 200
  E matriculasPorStatus contém todos os status do enum

@QA-DASH-05
Cenário: Dashboard do professor
  Dado um JWT de PROFESSOR do seed
  Quando envio GET /api/v1/dashboard/professor
  Então a resposta é 200
  E lancamentosPendentes é maior que 0
```

---

## 12. Financeiro

`/financeiro/faturas` — ADMIN.

**Regras.** Fatura pertence a um aluno existente. Status: `PENDENTE | PAGA | ATRASADA | CANCELADA`. Ao marcar `PAGA`, `pagoEm` = informado ou agora; outros status zeram `pagoEm`. Valor &gt; 0. Filtros: `alunoId`, `status`.

**CA-FIN-01.** POST com `alunoId` válido → 201; `valor` numérico na resposta.  
**CA-FIN-02.** Aluno inexistente → 404.  
**CA-FIN-03.** PATCH status `PAGA` preenche `pagoEm`.  
**CA-FIN-04.** `GET ?status=PENDENTE` não devolve pagas.  
**CA-FIN-05.** DELETE → 200.

```gherkin
@QA-FIN-03
Cenário: Baixa de fatura
  Dado uma fatura PENDENTE
  Quando envio PATCH /financeiro/faturas/:id/status com { "status": "PAGA" }
  Então status é PAGA
  E pagoEm não é null
```

### Checkout de matrícula e webhook Stripe

`/financeiro/precos` — ADMIN. Um registro por `cursoId` (o `Curso` já carrega `modalidade`). O admin informa o valor em reais; a API cria/atualiza Product e Price no Stripe. Mudança de valor arquiva o Price antigo e cria um novo (`unit_amount` é imutável no Stripe).

**CA-FIN-PRECO-01.** POST com `cursoId` válido e `valor` > 0 → 201, com `stripePriceId`.  
**CA-FIN-PRECO-02.** Segundo POST para o mesmo curso → 409.  
**CA-FIN-PRECO-03.** PATCH `valor` gera novo `stripePriceId`.  
**CA-FIN-PRECO-04.** Curso inexistente → 404.

`GET /api/catalogo` e `GET /api/v1/catalogo` — públicos. Lista cursos com `PrecoCurso` **ativo** (sem IDs Stripe): `cursoId`, `nome`, `modalidade`, `duracaoSemestres`, `campus`, `valor`, `moeda`, `intervalo`.

`POST /api/inscricao` e `POST /api/v1/inscricao` — públicos. Corpo: `nome`, `email`, `cpf` (14 chars), `telefone?`, `dataNascimento` (`YYYY-MM-DD`), `cursoModalidadeId`. Cria aluno + matrícula `PRE_MATRICULADO` (ou reutiliza aluno existente identificado pelo CPF ou pelo e-mail). Se o valor devido agora for R$ 0 (cupom `isencao-inscricao` 100% `once`), **não** cria sessão Stripe: `requiresCheckout=false`, `url=null`, `status=PRE_MATRICULADO` e agenda fatura `PENDENTE` no ciclo seguinte. Se houver valor agora, devolve Checkout com cartão e boleto (`requiresCheckout=true`, `status=AGUARDANDO_PAGAMENTO`). Se CPF e e-mail apontarem para pessoas diferentes, 400.

`POST /api/checkout` e `POST /api/v1/checkout` — públicos. Corpo: `studentId`, `email`, `cursoModalidadeId` (id do `Curso`). A API usa o `stripePriceId` da precificação **ativa** em `precos_curso` e calcula o valor devido agora com o cupom. Checkout em `mode=subscription` só ocorre se o devido for maior que zero; nesse caso oferece `card` e `boleto` (voucher 3 dias, endereço e CPF no Checkout). Metadata: `studentId`, `cursoId`.

`POST /webhooks/stripe` — público, body raw (`Buffer`). Valida `Stripe-Signature` com `STRIPE_WEBHOOK_SECRET`. Cartão: `checkout.session.completed` com `payment_status=paid` efetiva a matrícula. Boleto: `completed` com `unpaid` só gera o voucher; `checkout.session.async_payment_succeeded` efetiva; `async_payment_failed` (vencido) mantém `PRE_MATRICULADO`.

**CA-FIN-CAT-01.** GET `/api/catalogo` → 200 e somente cursos com preço ativo.
**CA-FIN-INS-01.** POST `/api/inscricao` com dados válidos, curso precificado e 1ª parcela isenta → 200, `url` nula, `requiresCheckout=false`, `status=PRE_MATRICULADO`, `acesso.ra` e `acesso.senhaProvisoria` (nula se o aluno já existia); matrícula `PRE_MATRICULADO`; fatura `PENDENTE` no ciclo seguinte.
**CA-FIN-INS-02.** POST `/api/inscricao` com CPF/e-mail de não-aluno → 400.
**CA-FIN-INS-03.** POST `/api/inscricao` com valor devido agora > 0 → 200, `requiresCheckout=true` e `url` do Stripe.
**CA-FIN-06.** POST `/api/checkout` com aluno, curso válidos e 1ª parcela isenta → 200, `url` nula e `requiresCheckout=false`.  
**CA-FIN-07.** `studentId` inexistente → 404.  
**CA-FIN-08.** `cursoModalidadeId` inexistente → 404.  
**CA-FIN-09.** Webhook sem `Stripe-Signature` → 400.  
**CA-FIN-10.** `checkout.session.completed` com `payment_status=paid` e `metadata.studentId` atualiza a matrícula para `ATIVO`.  
**CA-FIN-10b.** `checkout.session.completed` com `payment_status=unpaid` (boleto gerado) **não** efetiva a matrícula.  
**CA-FIN-11.** `invoice.payment_succeeded` upsert da fatura `PAGA` por `stripeInvoiceId`.  
**CA-FIN-12.** `invoice.payment_failed` upsert da fatura `ATRASADA`.
**CA-FIN-13.** `checkout.session.async_payment_succeeded` efetiva a matrícula (`ATIVO`).
**CA-FIN-14.** `checkout.session.async_payment_failed` mantém `PRE_MATRICULADO`.

```gherkin
@QA-FIN-06
Cenário: Inscrição isenta não abre Checkout Stripe
  Dado um aluno existente e um curso com precificação ativa
  E o cupom de inscrição zera a primeira parcela
  Quando envio POST /api/checkout com studentId, email e cursoModalidadeId
  Então a resposta é 200
  E requiresCheckout é false
  E url é null
  E status é PRE_MATRICULADO
```

```gherkin
@QA-FIN-10
Cenário: Boleto só efetiva a matrícula depois do pagamento
  Dado um checkout com boleto gerado
  Quando chega checkout.session.completed com payment_status unpaid
  Então a matrícula permanece PRE_MATRICULADO
  Quando chega checkout.session.async_payment_succeeded
  Então a matrícula passa a ATIVO
```

---

## 13. Comunicados e ouvidoria

### Comunicados (ADMIN)

**CA-COM-01.** POST com `publicoAlvo` (array de `Role`, mín. 1) → 201.  
**CA-COM-02.** `GET ?publicoAlvo=PROFESSOR` só devolve comunicados que contenham esse papel.  
**CA-COM-03.** PATCH/DELETE por id; id inexistente → 404.

### Ouvidoria (ADMIN)

Status: `ABERTO` (criação) → `RESPONDIDO` (`PATCH .../responder` com `resposta`) → `FECHADO` (`PATCH .../fechar`). Tipos: `FINANCEIRO`, `ACADEMICO`, `SECRETARIA`, `INFRAESTRUTURA`, `OUVIDORIA_GERAL`.

**CA-OUV-01.** POST com `usuarioId` existente → 201, status `ABERTO`.  
**CA-OUV-02.** Usuario inexistente → 404.  
**CA-OUV-03.** Responder grava `resposta` e status `RESPONDIDO`.  
**CA-OUV-04.** Fechar → `FECHADO` (mantém resposta se houver).  
**CA-OUV-05.** Filtros `status` e `tipo`.  
**CA-OUV-06.** DELETE → 200.

```gherkin
@QA-OUV-03
Cenário: Responder reclamação
  Dado uma reclamação ABERTO
  Quando envio PATCH /ouvidoria/reclamacoes/:id/responder com resposta de 3+ caracteres
  Então status é RESPONDIDO
  E resposta está preenchida
```

---

## 14. Integridade referencial (exclusões)

| Ação                                             | Esperado                            | ID        |
| :----------------------------------------------- | :---------------------------------- | :-------- |
| DELETE campus/curso/matriz com matrícula filha   | 409                                 | QA-DEL-01 |
| DELETE disciplina ou usuário professor com turma | 409                                 | QA-DEL-02 |
| DELETE turma                                     | 200; diários somem                  | QA-DEL-03 |
| DELETE matrícula                                 | 200; aluno permanece                | QA-DEL-04 |
| DELETE responsável (via user)                    | aluno fica com `responsavelId` null | QA-DEL-05 |
| GET/DELETE id inexistente                        | 404                                 | QA-DEL-06 |

```gherkin
@QA-DEL-01
Cenário: Campus com alunos matriculados não pode ser apagado
  Dado um campus que possui curso com matrícula
  Quando envio DELETE /academic/campi/:id
  Então a resposta é 409

@QA-DEL-02
Cenário: Professor com turma ofertada
  Dado o professor do seed (titular de turma)
  Quando envio DELETE /users/:id do user do professor
  Então a resposta é 409
```

---

## 15. Fluxo ponta a ponta (regressão)

Use IDs gerados no próprio fluxo (não só o seed).

```gherkin
@QA-E2E-01
Cenário: Do campus à aprovação do aluno
  Dado um JWT de ADMIN
  Quando crio campus → curso → disciplina → matriz → componente (CH válida, extensão ≥ 10%)
  E audito a matriz (cumpreRegra10PorcentoExtensao true)
  E crio professor e turma
  E efetivo matrícula ATIVO na matriz
  E enturmo o aluno
  E o professor lista a turma e o diário
  E o professor lança AV 7, AVS 7, faltas 0
  Então o diário está aprovado com chCumprida = chTotal
  E GET /dashboard/admin reflete a matrícula ATIVO
  E GET /dashboard/professor deixa de contar esse diário como pendente após AV ou AVS
```

**CA-E2E-01.** O fluxo acima completa sem 4xx inesperado.  
**CA-E2E-02.** Professor nunca executa POST de campus/matrícula/enturmação.

---

## 16. Smoke mínimo (5 minutos)

1. `GET /health` → `{ "status": "ok" }`.
2. Login admin → token.
3. `GET /auth/me` → `role` ADMIN, `ativo` true.
4. Login professor → `GET /dashboard/professor` 200.
5. Mesmo token professor em `POST /academic/campi` → 403.

---

## 17. Playwright (E2E do frontend)

Os IDs `QA-*` são o nome do teste no front. Não invente cenário novo no Playwright se ele já existir aqui — implemente o Gherkin contra a UI.

| Convenção | Valor                                                                                               |
| :-------- | :-------------------------------------------------------------------------------------------------- |
| Arquivo   | `e2e/<dominio>.spec.ts` (auth, academic, enrollment, grading, dashboard…)                           |
| Título    | `test('QA-AVA-01: aprovação direta', …)`                                                            |
| Tag       | `@p0` nos IDs da seção 18; `@api-only` se ainda não houver tela                                     |
| Auth      | `storageState` por persona (admin / professor / aluno) gerado no `global-setup` via login unificado |
| Dados     | Seed da API + UUIDs criados no próprio spec (igual ao E2E da seção 15)                              |

**Primeira suíte do front (críticos, nesta ordem):**

1. `QA-AUTH-01` / `QA-AUTH-02` — login unificado e redirecionamento `/admin` vs `/professor`
2. `QA-DASH-01` / `QA-DASH-05` — KPIs das home
3. `QA-TUR-03` / `QA-DIA-01` — professor só vê as próprias turmas e diários
4. `QA-AVA-01` a `QA-AVA-05` — motor de notas na tela de lançamento
5. `QA-ENT-01` / `QA-ENT-03` — enturmação (tela ADMIN)
6. `QA-MEC-01` / `QA-MEC-02` — auditoria MEC
7. `QA-E2E-01` — jornada completa (último, mais lento)

Professor **não** deve conseguir abrir telas de CRUD acadêmico (`QA-RBAC-02`). Aluno autenticado no interno: só `/auth` — qualquer outra rota de UI deve negar (`QA-RBAC-03`).

Quando a tela ainda não existir, deixe o spec `test.skip` com o ID e o motivo (`@api-only`). Não apague o cenário.

---

## 18. Mapa para a collection Postman (próximo passo)

Pastas sugeridas (espelham este doc):

1. `00-Smoke` — health, login admin/professor/aluno
2. `01-Auth` — me, senha, inativo
3. `02-RBAC` — 401/403
4. `03-Users`
5. `04-Academic` — campus, curso, disciplina, matriz, componente, MEC, turma
6. `05-Enrollment`
7. `06-Grading` — enturmar, listar, avaliar (tabela de decisão), desenturmar
8. `07-Dashboard`
9. `08-Financial`
10. `09-Communications`
11. `10-Deletes-409`
12. `11-E2E`

Convenção de request: nome = ID (`QA-AVA-01`). Tests (pm.test): status code + 2–3 asserts de negócio. Pre-request: `pm.environment.set` dos UUIDs criados.

Ambientes: `local` (`baseUrl=http://localhost:3333`) e, depois, `staging`.

---

## 19. Rastreabilidade rápida

| ID                                               | Camada           | Prioridade |
| :----------------------------------------------- | :--------------- | :--------- |
| QA-RBAC-*                                        | Segurança        | P0         |
| QA-AUTH-*                                        | Sessão           | P0         |
| QA-MTZ-02/03, QA-MEC-*                           | Regulatório      | P0         |
| QA-MAT-_, QA-ENT-_                               | Ingresso         | P0         |
| QA-AVA-*                                         | Avaliação        | P0         |
| QA-TUR-03/04, QA-DIA-_, QA-DASH-_                | Portal professor | P0         |
| QA-DEL-*                                         | Integridade      | P1         |
| QA-USR-_, QA-ACA-_, QA-FIN-_, QA-COM-_, QA-OUV-* | CRUD             | P1         |
| QA-E2E-01                                        | Regressão        | P0         |
| Smoke seção 16                                   | Gate             | P0         |

Quando a collection existir, cada request deve citar o ID deste arquivo. Se a regra mudar no código, atualize **primeiro** o CA/BDD aqui e só então o Postman.
