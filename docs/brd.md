# Documentação de Negócio (Business Requirements Document — BRD)

## OpenSGA — Sistema de Gestão Acadêmica e ERP Universitário

---

### Controle de Versão e Governança do Documento

| Versão | Data de Elaboração | Responsável | Perfil | Status |
| :--- | :--- | :--- | :--- | :--- |
| **1.2.0** | 07/10/2026 | Arquitetura de Soluções e Negócios | Analista de Negócios / Arquiteto de Software | Homologado |
| **1.1.0** | 01/10/2026 | Arquitetura de Soluções e Negócios | Analista de Negócios / Arquiteto de Software | Substituído |
| **1.0.0** | 01/10/2026 | Arquitetura de Soluções e Negócios | Analista de Negócios / Arquiteto de Software | Substituído |

---

## 1. Visão Geral do Negócio

### 1.1 Proposta de Valor

O **OpenSGA** é uma plataforma integrada de gestão acadêmica e governança universitária desenvolvida para Instituições de Ensino Superior (IES) brasileiras. Sua proposta de valor centra-se em:

- **Centralização Operacional**: unificar a jornada completa do discente — do ingresso e matrícula à conclusão do curso — em uma única fonte de dados confiável.
- **Conformidade Regulatória Nativa**: automatizar a adesão contínua às diretrizes e resoluções do Ministério da Educação (MEC) e do Conselho Nacional de Educação (CNE/CES), mitigando riscos de não conformidade ou penalidades em atos regulatórios.
- **Transparência Pedagógica e Financeira**: oferecer visibilidade em tempo real sobre assiduidade, rendimento escolar, cumprimento de grade horária e obrigações financeiras para estudantes, docentes e gestão institucional.

### 1.2 Problema de Negócio que o Sistema Resolve

Instituições de ensino superior frequentemente enfrentam gargalos críticos decorrentes do uso de sistemas legados ou processos manuais descentralizados:

1. **Risco de Sanções Regulatórias**: Dificuldade em controlar e auditar a obrigatoriedade de 10% de carga horária em atividades de extensão curricular (Resolução CNE/CES nº 7/2018), bem como os limites operacionais de oferta presencial, síncrona e a distância (EAD) por campus ou polo.
2. **Inconsistências no Ciclo da Matrícula**: Erros na vinculação de matrizes curriculares, emissão de identificadores discentes (RA) sem controle de unicidade e falta de comunicação imediata de credenciais de acesso inicial.
3. **Falhas na Enturmação e Integralização Curricular**: Alocação inadequada de discentes em disciplinas fora de suas grades vigentes, ausência de travas contra duplicidade de enturmação no mesmo período e cálculos de média final desconectados do registro oficial de horas cumpridas.
4. **Desconexão entre Atendimento, Família e Gestão**: Falta de canais estruturados para envolvimento de responsáveis legais/financeiros e ausência de uma ouvidoria categorizada para tratar demandas antes que impactem a retenção e a satisfação discente.

### 1.3 Perfis de Usuários e Personas Principais

```
                  ┌───────────────────────────────────────────────┐
                  │          PERFIS DE ACESSO (RBAC)              │
                  └──────────────────────┬────────────────────────┘
                                         │
        ┌──────────────────┬─────────────┴────────────┬──────────────────┐
        ▼                  ▼                          ▼                  ▼
┌───────────────┐  ┌───────────────┐          ┌───────────────┐  ┌───────────────┐
│ Administrador │  │   Professor   │          │     Aluno     │  │  Responsável  │
│  (Secretaria/ │  │    (Corpo     │          │  (Estudante/  │  │ (Financeiro/  │
│  Coordenação) │  │   Docente)    │          │   Discente)   │  │    Legal)     │
└───────────────┘  └───────────────┘          └───────────────┘  └───────────────┘
```

- **Administrador (`ADMIN`) — Secretaria Acadêmica, Coordenação e Diretoria**  
  Responsável pela parametrização da infraestrutura multicampus, cadastro de usuários e professores, desenho de cursos, versionamento de matrizes curriculares, cadastramento de componentes, auditoria de indicadores MEC, abertura de turmas, efetivação de matrículas, emissão de faturas, comunicados institucionais e condução da ouvidoria.

- **Professor (`PROFESSOR`) — Corpo Docente**  
  Responsável pela gestão do diário de classe das turmas sob sua regência, registro de assiduidade (faltas) e lançamento das avaliações semestrais (AV, AVS e AV3).

- **Aluno (`ALUNO`) — Estudante / Discente**  
  Titular do vínculo acadêmico, identificado pelo Registro Acadêmico (RA). Consulta histórico escolar, frequenta as disciplinas da grade, acompanha sua evolução no curso e acessa as faturas financeiras emitidas.

- **Responsável (`RESPONSAVEL`) — Pai, Mãe, Tutor ou Patrocinador Financeiro**  
  Pessoa física vinculada ao estudante no ato da matrícula com grau de parentesco registrado. Possui credenciais exclusivas para acompanhar a situação acadêmica e gerenciar compromissos financeiros do dependente.

---

## 2. Funcionalidades Principais (Core Features)

O sistema é subdividido em domínios de negócio delimitados, operando sob regras de validação estritas:

```
┌────────────────────────────────────────────────────────────────────────┐
│                        DOMÍNIOS DE NEGÓCIO                             │
├─────────────────────┬───────────────────┬──────────────────────────────┤
│  Acesso e Identidade│  Gestão Curricular│    Ingresso e Matrícula      │
│     (Autenticação)  │    e Regulatória  │     (Ciclo do Estudante)     │
├─────────────────────┼───────────────────┼──────────────────────────────┤
│  Diário e Avaliação │  Financeiro e ERP │   Comunicação e Ouvidoria    │
│     Acadêmica       │    Educacional    │        Institucional         │
└─────────────────────┴───────────────────┴──────────────────────────────┘
```

### 2.1 Gestão de Identidade e Acesso Unificado

- **Credenciais Flexíveis**: O acesso ao ambiente não depende unicamente de e-mail. Alunos podem acessar utilizando seu RA ou CPF; professores via Matrícula funcional ou CPF; administradores via e-mail corporativo ou CPF.
- **Governança de Perfis (RBAC)**: Segregação automática de privilégios. Um usuário só pode realizar ações pertinentes ao seu papel atribuído, com validação de status de conta ativa.

### 2.2 Estrutura Curricular e Governança Regulatória MEC

- **Catálogo Centralizado de Disciplinas**: Entidades globais padronizadas (nome, código, tipo curricular, tipo de entrega e carga horária) evitam duplicidade de nomenclaturas e garantem consistência institucional entre campi. O semestre ideal só é informado ao incluir a disciplina na matriz de um curso.
- **Versionamento de Matrizes Curriculares**: Um mesmo curso superior pode ter múltiplas matrizes curriculares atreladas a diferentes anos de vigência, assegurando segurança jurídica aos alunos de diferentes períodos de ingresso.
- **Tridimensionalidade da Carga Horária**: Cada componente curricular define sua carga horária total distribuída obrigatoriamente entre três modalidades de entrega:
  1. *Presencial Física* (em salas de aula, laboratórios ou polos).
  2. *Síncrona Mediada* (aulas remotas ao vivo mediadas por tecnologia).
  3. *Assíncrona Digital* (conteúdos autoinstrucionais em Ambiente Virtual de Aprendizagem).
  - *Regra de Consistência*: A carga horária total cadastrada deve ser rigorosamente igual à soma das modalidades presencial, síncrona e assíncrona.
- **Classificação Curricular dos Componentes**: Categorização conforme projeto pedagógico em disciplinas de núcleo comum (*Vida & Carreira*), núcleo técnico específico (*Específico*), trilhas de formação flexível (*Eletivas*), disciplinas livres (*Optativas*) e atividades práticas de impacto social (*Extensão*).
- **Auditoria Automatizada de Conformidade MEC**:
  - *Curricularização da Extensão (Resolução CNE/CES nº 7/2018)*: O sistema calcula a razão da carga horária de extensão em relação à carga horária total da matriz. Matrizes com índice inferior a 10% recebem indicador explícito de não conformidade legal.
  - *Balanço Presencial e Síncrono (Decreto nº 12.456/2026)*: cada disciplina deve cumprir `CH_Total = CH_Presencial + CH_Síncrona + CH_Assíncrona` e os pisos da modalidade do curso (Presencial ≥ 70% presencial; Semipresencial ≥ 30% presencial e ≥ 20% síncrono, com teto de 50% assíncrono; EAD ≥ 10% presencial e ≥ 10% síncrono). A auditoria estrita (`GET /academic/matrizes/:id/auditoria`) responde HTTP 409 em conflito regulatório.

### 2.3 Ingresso, Matrículas e Onboarding Discente

- **Efetivação de Vínculo Acadêmico**: Registro formal do estudante vinculado a um curso e obrigatoriamente a uma matriz curricular ativa e homologada.
- **Geração Automatizada de RA**: Criação de Registro Acadêmico único e permanente, composto pelo ano civil de ingresso acrescido de sufixo numérico exclusivo.
- **Tratamento Integral do Responsável Legal**: Na existência de dependência legal/financeira, o sistema cria simultaneamente o perfil do responsável (com validação estrita de unicidade de CPF e e-mail em relação ao aluno) ou associa um responsável já cadastrado na instituição.
- **Boas-Vindas e Entrega de Acesso (Onboarding Digital)**: Geração de senhas temporárias seguras com envio automático de e-mail formal da Secretaria Acadêmica, fornecendo RA, link do portal e orientações de primeiro acesso.
- **Gestão de Ciclo de Vida da Matrícula**: Acompanhamento dos estados de vínculo do estudante: pré-matrícula, ativa, trancada, cancelada, formada, evadida ou transferida (mudança interna de curso ou polo/campus).
- **Transferência Interna**: A secretaria reposiciona um aluno ATIVO ou TRANCADO em outro curso ou na oferta do mesmo programa em outro polo/campus. O RA não muda. A matrícula de origem fica `TRANSFERIDO` e um novo vínculo `ATIVO` é criado no destino. Se o nome do curso coincidir (mesmo programa em outra unidade/modalidade), todo o histórico de diários segue com o aluno; se o curso for outro, só as disciplinas globais presentes na matriz de destino são aproveitadas.

### 2.4 Oferta de Turmas e Alocação Semestral

- **Planejamento por Período Letivo**: Oferta de turmas semestrais atreladas a um **curso** e ao campus/polo desse curso. A secretaria escolhe o semestre letivo (ano + 1º/2º), a disciplina da matriz daquele curso, o docente titular, a capacidade, o horário e o local/link.
- **Monitoramento de Ocupação**: Rastreamento da quantidade de alunos enturmados em tempo real contra o limite de vagas planejado.

### 2.5 Diário de Classe, Frequência e Rendimento Escolar

- **Enturmação com Travas de Integridade**:
  - O discente só pode ser inserido em turmas de disciplinas que constem formalmente na matriz curricular em que está matriculado.
  - Impedimento definitivo de duplicidade de enturmação na mesma disciplina no mesmo período.
  - Restrição de enturmação apenas para matrículas com status ativo.
- **Controle de Assiduidade e Limite de Faltas**:
  - A assiduidade é acompanhada pelo total acumulado de faltas.
  - *Teto Regulatório de 25%*: Se o total de faltas do estudante exceder 25% da carga horária total da disciplina, ocorre reprovação direta por faltas, independentemente de sua pontuação nas avaliações.
- **Motor de Avaliação e Médias**:
  - A pontuação semestral usa a maior nota entre a avaliação regular (AV) e a substitutiva (AVS):  
    **Nota Semestral = MAX(AV, AVS)**
  - *Aprovação Direta*: Caso a Nota Semestral seja igual ou superior a 6,0 e a frequência esteja dentro do limite, o estudante é aprovado no fechamento do semestre.
  - *AV3 (Recuperação Final)*: Se a Nota Semestral for inferior a 6,0 (e o aluno não tiver sido reprovado por faltas), habilita-se a AV3.  
    **Média Final = (Nota Semestral + AV3) / 2**  
    Aprovado se a Média Final ≥ 5,0; caso contrário, status `RN`.

  - *Contrato de lançamento (`PATCH /diario/avaliar`)*: body `{ diarioClasseId, notaAv?, notaAvs?, notaAv3?, totalFaltas? }`. Campos omitidos preservam o valor gravado. Recalcula `notaSemestral` e `habilitaAv3` (frequência regular e NS < 6,0). Não creditada CH. AV3 sem a flag → 400. Semestre já fechado → 409. Status permanece `EM_ABERTO` até o fechamento.
  - *Contrato de fechamento (`POST /diario/fechar-semestre`)*: body `{ turmaId }`. Transação atômica: (1) faltas > 25% da CH → `RF`, `chCumprida = 0`; (2) NS ≥ 6,0 → `APROVADO` e CH creditada; (3) senão `MF = (NS + AV3) / 2` (≥ 5,0 `APROVADO`, < 5,0 `RN`); (4) NS ausente ou AV3 obrigatória faltando → 409 e nenhum diário é persistido. Resposta: `{ turmaId, fechados, diarios }`.
  - *Auditoria da matriz*: `GET /academic/matrizes/:id/auditoria` responde 200 se conforme ao Decreto nº 12.456/2026 e à extensão ≥ 10%; 409 com `violacoes[]` se inconforme. `GET /academic/matrizes/:id/auditoria-mec` permanece 200 (dashboard).
- **Integralização Curricular Condicionada**: A carga horária cumprida da disciplina só é creditada como progresso no histórico escolar do aluno quando a aprovação for efetivamente confirmada. Em caso de reprovação, a carga horária cumprida é registrada como zero.
- **Governança de Lançamento por Turma**: Docentes só possuem permissão para lançar faltas e notas nas turmas sob sua estrita responsabilidade acadêmica. Administradores possuem visão de auditoria e intervenção institucional.

### 2.6 Gestão Financeira, Comunicação e Ouvidoria

- **Contas a Receber (Faturamento)**: Emissão e controle de faturas acadêmicas vinculadas ao aluno, com rastreamento de vencimento, status financeiro (pendente, paga, atrasada, cancelada) e links diretos para pagamento.
- **Mural Institucional de Comunicados**: Publicação de notificações institucionais direcionadas por público-alvo (administradores, professores, alunos e responsáveis).
- **Ouvidoria Universitária e SLA**: Central de atendimento e manifestações com triagem por setor (Financeiro, Acadêmico, Secretaria, Infraestrutura e Ouvidoria Geral), acompanhada por histórico de status da demanda e registro formal de respostas (aberta, em análise, respondida e fechada).

### 2.7 Superfície administrativa da API (ADMIN)

O prefixo HTTP é `/api/v1`. A documentação técnica interativa fica em `/docs` (Scalar / OpenAPI). As exclusões respeitam integridade acadêmica: o sistema recusa com conflito (HTTP 409) quando a entidade ainda possui vínculos que não podem ser apagados em cascata.

| Domínio | Capacidade ADMIN exposta |
| :--- | :--- |
| Identidade | Login unificado, `GET /auth/me` (`ativo`, ids de aluno/professor e `dependentes[]`) e `PATCH /auth/senha`. CRUD de usuários, professores e administradores; consulta de alunos e responsáveis (`/users`). JWT de conta inativa é recusado. |
| Currículo | CRUD de campus, curso, disciplina, matriz, componente e turma (`/academic`). Auditoria MEC da matriz. Professor lista/consulta apenas as próprias turmas. |
| Matrícula | Efetivação, consulta por status, alteração de status, exclusão do vínculo e transferência interna (`GET /matriculas/:id/transferencia-preview`, `POST /matriculas/:id/transferencia`). O aluno não é apagado junto com a matrícula. |
| Diário | Enturmação ADMIN; listagem/consulta ADMIN+PROFESSOR (filtro JWT); desenturmação ADMIN; lançamento AV/AVS/AV3 pelo titular (`PATCH /diario/avaliar`); fechamento atômico (`POST /diario/fechar-semestre`). |
| Dashboards | `GET /dashboard/admin` e `GET /dashboard/professor` com KPIs do período letivo. |
| Financeiro | Precificação por curso (`/financeiro/precos`, ADMIN): o valor é cadastrado no OpenSGA e sincronizado como Product/Price no Stripe. Emissão de faturas (`/financeiro/faturas`). Inscrição/checkout (`POST /api/inscricao`, `POST /api/checkout`) só abrem o Stripe se o valor devido agora for maior que zero; isenção (cupom 100% na 1ª parcela) conclui em `PRE_MATRICULADO` sem cartão e agenda fatura `PENDENTE` no ciclo seguinte. Quando há cobrança, o Checkout oferece cartão e boleto (voucher em 3 dias). Webhook `POST /webhooks/stripe` ativa matrícula em `checkout.session.completed` só se `payment_status=paid` (cartão) ou em `checkout.session.async_payment_succeeded` (boleto); boleto gerado (`completed` + `unpaid`) e `async_payment_failed` não efetivam a vaga. Também concilia `invoice.payment_succeeded` e `invoice.payment_failed`. |
| Comunicação | CRUD de comunicados por público-alvo (`/comunicados`) e fluxo de ouvidoria: abrir, responder, fechar e excluir (`/ouvidoria/reclamacoes`). |
| Portal do aluno | `GET /portal/contexto` (`ALUNO` / `RESPONSAVEL`): vínculo, diários, faturas, matriz, comunicados e protocolos do aluno ou dependente (`alunoId` só se vinculado). `GET /portal/documentos` lista modelos ativos; `POST /portal/documentos/emitir` interpola o texto da Secretaria. `POST /portal/ouvidoria` abre protocolo em nome do JWT. Sem CRUD desses papéis. |
| Documentos oficiais | Catálogo `ModeloDocumento` (`ADMIN`: `GET/PATCH /documentos/modelos`). Declaração e carteirinha exigem matrícula `ATIVO`; quitação bloqueada se fatura `ATRASADA`. Impressão no browser. |

**Regras de exclusão (integridade referencial)**

- Apagar **campus**, **curso** ou **matriz** é bloqueado enquanto existir matrícula vinculada.
- Apagar **disciplina** ou **professor** é bloqueado enquanto existir turma ofertada.
- Apagar **turma** ou **matrícula** remove os diários correspondentes.
- Apagar **usuário** remove o perfil (professor, aluno ou responsável) e as reclamações abertas; alunos perdem o vínculo de responsável (ficam sem responsável), sem exclusão do discente.
- Apagar **responsável** não exclui o aluno: o campo de responsável é apenas desvinculado.

---

## 3. Arquitetura de Negócio e Fluxo de Dados

### 3.1 Macrofluxo: Do Planejamento Acadêmico à Formatura

```
┌─────────────────┐      ┌─────────────────┐      ┌─────────────────┐
│ 1. Estruturação │  ──> │ 2. Oferta de    │  ──> │ 3. Matrícula e  │
│  das Matrizes   │      │    Turmas       │      │   Onboarding    │
└─────────────────┘      └─────────────────┘      └─────────────────┘
                                                           │
                                                           ▼
┌─────────────────┐      ┌─────────────────┐      ┌─────────────────┐
│ 6. Integralização│ <──  │ 5. Avaliação e  │ <──  │ 4. Enturmação   │
│  e Histórico    │      │    Frequência   │      │   Disciplinar   │
└─────────────────┘      └─────────────────┘      └─────────────────┘
```

### 3.2 Fluxo Detalhado 1: Configuração Curricular e Auditoria MEC

*Ator principal: Administrador / Coordenador Acadêmico*

```
[Início: Criação de Nova Grade]
       │
       ▼
[Cadastrar unidade: Campus (presencial) ou Polo (EAD) + código MEC]
       │
       ▼
[Criar Curso e Nova Versão de Matriz Curricular]
       │
       ▼
[Vincular Componentes Curriculares à Matriz]
  ├─> Escolher disciplina do catálogo (carga e tipo já cadastrados)
  └─> Informar o semestre ideal naquela matriz (carga/tipo podem ser sobrescritos)
       │
       ▼
[Executar Auditoria de Conformidade MEC]
  ├─> Validação de Extensão: Carga de Extensão >= 10% da CH Total?
  │      ├── Sim -> Matriz apta para abertura de ofertas e matrículas
  │      └── Não -> Alerta de inconformidade emitido para ajuste curricular
  └─> Validação de Carga Presencial/Síncrona por Polo
```

### 3.3 Fluxo Detalhado 2: Ingresso do Estudante, Matrícula e Ativação

*Atores: Candidato / Aluno, Responsável e Secretaria Acadêmica*

```
[Secretaria submete dados cadastrais do Estudante]
       │
       ▼
[Sistema valida duplicidade de CPF e E-mail]
       │
       ▼
[Sistema valida se a Matriz Curricular selecionada está ativa e pertence ao Curso]
       │
       ├── Há Responsável Legal informado?
       │      ├── Sim -> Valida/Cria perfil de Responsável com credenciais próprias
       │      └── Não -> Prossegue com vínculo direto
       │
       ▼
[Gera Registro Acadêmico (RA) exclusivo de forma atômica]
       │
       ▼
[Gera Senha Provisória criptografada para o Aluno (e Responsável)]
       │
       ▼
[Cria Matrícula no 1º Semestre]
  ├── Secretaria (`POST /matriculas`) -> status ATIVO
  └── Inscrição pública / Checkout -> PRE_MATRICULADO;
         webhook Stripe (pagamento confirmado) -> ATIVO;
         isenção 100% permanece PRE_MATRICULADO e agenda fatura PENDENTE
       │
       ▼
[Dispara e-mail de Boas-Vindas com RA, link do portal e senha provisória]
```

### 3.4 Fluxo Detalhado 3: Ciclo Avaliativo, Frequência e Integralização

*Atores: Professor, Aluno e Secretaria*

```
[Secretaria enturma Aluno Ativo em Turma Aberta]
  └─> Validação: A disciplina pertence à matriz do aluno? Não há duplicidade?
       │
       ▼
[Semestre Letivo em Andamento: Professor registra Faltas e Avaliações no Diário]
       │
       ▼
[Lançamento de AV e AVS pelo Professor Titular]
       │
       ▼
[Sistema calcula Nota Semestral = MAX(AV, AVS) e habilitaAv3]
       │
       ▼
[POST /diario/fechar-semestre — atômico por turma]
       │
       ├── Total de Faltas > 25% da CH Total?
       │      └── SIM  -> Status RF | CH Cumprida = 0h (ignora notas)
       │
       └── Frequência Regular (Faltas <= 25%):
              │
              ├── Nota Semestral >= 6,0?
              │      └── SIM  -> APROVADO | CH Cumprida = CH Total
              │
              └── Nota Semestral < 6,0:
                     │
                     ▼
              [Aluno realiza AV3]
                     │
                     ▼
              [Média Final = (Nota Semestral + AV3) / 2]
                     │
                     ├── Média Final >= 5,0 -> APROVADO | CH Cumprida = CH Total
                     └── Média Final < 5,0  -> RN | CH Cumprida = 0h
```

---

## 4. Integrações e Serviços Externos

```
┌────────────────────────────────────────────────────────────────────────┐
│                        SERVIÇOS E INTEGRAÇÕES                          │
├─────────────────────┬───────────────────┬──────────────────────────────┤
│    Banco de Dados   │  Gateway Financeiro│  Mensageria Transacional     │
│      Relacional     │    e Pagamentos   │          (E-mail)            │
│    (PostgreSQL)     │      (Stripe)     │     (SMTP / Nodemailer)      │
├─────────────────────┼───────────────────┼──────────────────────────────┤
│  Armazenamento em   │   Autenticação e  │   Interface e Documentação   │
│   Nuvem de Mídias   │   Sessão Segura   │       Técnica da API         │
│    (Cloudinary)     │   (Bcrypt / JWT)  │       (Swagger / Scalar)     │
└─────────────────────┴───────────────────┴──────────────────────────────┘
```

1. **Banco de Dados Relacional Corporativo (PostgreSQL)**  
   *Papel no negócio*: Armazena de forma durável e estruturada todo o repositório institucional (registros acadêmicos, notas, frequências, contratos e histórico).  
   *Valor*: Garantia de transações atômicas — quando uma matrícula é gerada, a criação do usuário, aluno, responsável e matrícula ocorre em bloco indivisível, eliminando cadastros órfãos ou inconsistentes.

2. **Gateway Financeiro e Processamento de Cobranças (Stripe)**  
   *Papel no negócio*: Orquestra o ciclo de cobrança das mensalidades universitárias, taxas de matrícula e emolumentos.  
   *Valor*: Facilita o faturamento via links seguros de pagamento, geração de faturas digitais e conciliação em tempo real de liquidação de mensalidades via webhooks, reduzindo a inadimplência.

3. **Serviço de Mensageria e Notificações Institucionais (SMTP / Nodemailer)**  
   *Papel no negócio*: Canal oficial de comunicação externa entre a Secretaria Acadêmica e os discentes/responsáveis.  
   *Valor*: Garante a entrega confidencial e pontual de credenciais provisórias de acesso no instante da efetivação da matrícula, reduzindo chamados de suporte no início do período letivo.

4. **Armazenamento Seguro de Mídia e Imagens (Cloudinary)**  
   *Papel no negócio*: Armazenamento e otimização de imagens de identificação discente (fotos de perfil/carteirinha estudantil) e documentações acadêmicas complementares.  
   *Valor*: Garante alta performance no carregamento de identidades visuais sem onerar a infraestrutura do banco de dados institucional.

5. **Autenticação Criptográfica e Segurança de Acesso (Bcrypt e JSON Web Token — JWT)**  
   *Papel no negócio*: Proteção de identidade institucional e controle de sessões.  
   *Valor*: Assegura que senhas jamais sejam armazenadas em texto plano e que cada requisição ao portal valide a integridade e expiração da sessão do usuário de acordo com suas permissões vigentes.

6. **Portal de Especificação e Integração (Swagger / Scalar OpenAPI)**  
   *Papel no negócio*: Disponibiliza contrato vivo e documentado das rotas do sistema para integração facilitada com portais web, aplicativos móveis (Portal do Aluno / Portal do Professor) e sistemas legados de catraca ou biblioteca.

---

## 5. Glossário de Termos de Negócio

- **AV (Avaliação Regular)**: Instrumento avaliativo principal do semestre (escala 0,0 a 10,0).
- **AVS (Avaliação Substitutiva)**: Segunda chance semestral. A nota semestral é o maior valor entre AV e AVS.
- **AV3 (Recuperação Final)**: Exame habilitado apenas se a nota semestral for inferior a 6,0 e a frequência for regular. Média final = (NS + AV3) / 2, corte em 5,0.
- **Aluno**: Pessoa física com matrícula ativa ou com histórico curricular em um dos cursos da instituição.
- **Assiduidade**: Índice de comparecimento do estudante às aulas da disciplina. O descumprimento de mais de 25% da carga horária gera reprovação sumária por infrequência.
- **Campus / Polo**: Unidade da IES identificada pelo código MEC (`codigoPolo`). `tipo = CAMPI` é sede presencial (cursos presencial/semipresencial); `tipo = POLO` é polo de apoio EAD (somente cursos EAD).
- **Carga Horária Cumprida (`chCumprida`)**: Quantidade de horas de uma disciplina que são efetivamente incorporadas ao histórico de integralização do estudante, condicionada estritamente à sua aprovação.
- **Curricularização da Extensão**: Exigência legal estabelecida pela Resolução CNE/CES nº 7/2018 que impõe que no mínimo 10% da carga horária total da formação universitária seja dedicada a projetos e ações de extensão com a comunidade externa.
- **Diário de Classe**: Instrumento formal de escrituração acadêmica onde são consolidados os registros de presença, ausências, notas parciais, exame final e resultado conclusivo de cada aluno em uma turma ofertada.
- **Disciplina Global**: Entidade curricular do catálogo (ex.: *Cálculo I*, *Comunicação Empresarial*), com carga e classificação padrão, reutilizável em múltiplos cursos. Semestre ideal pertence ao componente da matriz, não ao catálogo.
- **Enturmação**: Ação de alocar um aluno formalmente matriculado em uma turma específica ofertada em um determinado semestre letivo.
- **Matrícula**: Registro de vínculo contratual e acadêmico que associa um discente a um curso e a uma versão específica de matriz curricular.
- **Matriz Curricular**: Versão pedagógica oficial do curso que estabelece a relação de disciplinas, cargas horárias, pré-requisitos, semestre ideal e modalidades de ensino aplicáveis aos alunos que ingressaram em seu período de vigência.
- **Modalidades de Entrega**:
  - *Presencial Física*: Encontros regulares no polo ou campus universitário.
  - *Síncrona Mediada*: Atividades em tempo real realizadas por plataformas de conferência e mediação docente remota.
  - *Assíncrona Digital*: Atividades e trilhas de aprendizagem realizadas de maneira flexível no Ambiente Virtual de Aprendizagem (AVA).
- **Professor**: Profissional do corpo docente alocado nas turmas institucionais, habilitado a realizar registros pedagógicos em diário de classe.
- **RA (Registro Acadêmico)**: Código alfanumérico institucional exclusivo que identifica univocamente o discente durante toda a sua trajetória acadêmica na IES.
- **Responsável**: Pessoa física legal ou financeiramente responsável pelo estudante perante a instituição, possuindo credenciais próprias para acompanhamento acadêmico e financeiro.
- **Status da Matrícula**:
  - `PRE_MATRICULADO`: Candidato em ingresso (inscrição pública/Checkout) aguardando pagamento ou documentação; não efetivado até o webhook Stripe (ou permanece assim em isenção da 1ª parcela).
  - `ATIVO`: Aluno regular, apto a enturmar-se em turmas do período e a acessar as instalações da instituição.
  - `TRANCADO`: Suspensão temporária do vínculo acadêmico a pedido do estudante, preservando o direito à reabertura de estudos.
  - `CANCELADO`: Rompimento definitivo do vínculo acadêmico por desistência ou rescisão contratual.
  - `FORMADO`: Aluno que completou com êxito todas as exigências curriculares e de colação de grau.
  - `EVADIDO`: Aluno que abandonou os estudos sem comunicação formal à Secretaria Acadêmica no período regulamentar.
  - `TRANSFERIDO`: Vínculo encerrado por transferência interna para outro curso ou polo/campus da instituição.
- **Status da Fatura**:
  - `PENDENTE`: Cobrança gerada e aguardando liquidação até a data de vencimento.
  - `PAGA`: Liquidação financeira confirmada pelo gateway de pagamento ou baixa manual.
  - `ATRASADA`: Título vencido sem registro de pagamento, sujeito a ações de cobrança amigável.
  - `CANCELADA`: Cobrança invalidada por renegociação, bolsa, estorno ou cancelamento administrativo.
- **Turma**: Instância de oferta semestral de uma disciplina da matriz de um curso, no campus/polo desse curso, com docente regente, horário, local/link e limite de vagas. O período letivo (`anoLetivo`.`semestreLetivo`) é escolhido na oferta.

---

### Considerações Finais de Negócio

O **OpenSGA** posiciona-se como uma espinha dorsal corporativa de sustentação para Instituições de Ensino Superior, associando rigor matemático aos cálculos acadêmicos, conformidade legal proativa às exigências do MEC e segurança em todos os processos de gestão cadastral e financeira.
