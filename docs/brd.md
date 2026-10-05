# Documentação de Negócio (Business Requirements Document — BRD)

## OpenSGA — Sistema de Gestão Acadêmica e ERP Universitário

---

### Controle de Versão e Governança do Documento

| Versão | Data de Elaboração | Responsável | Perfil | Status |
| :--- | :--- | :--- | :--- | :--- |
| **1.1.0** | 01/10/2026 | Arquitetura de Soluções e Negócios | Analista de Negócios / Arquiteto de Software | Homologado |
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
  Responsável pela gestão do diário de classe das turmas sob sua regência, registro de assiduidade (faltas) e lançamento das avaliações semestrais (A1, A2 e Avaliação Final — AF).

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

- **Catálogo Centralizado de Disciplinas**: Entidades globais padronizadas evitam duplicidade de nomenclaturas e garantem consistência institucional entre campi.
- **Versionamento de Matrizes Curriculares**: Um mesmo curso superior pode ter múltiplas matrizes curriculares atreladas a diferentes anos de vigência, assegurando segurança jurídica aos alunos de diferentes períodos de ingresso.
- **Tridimensionalidade da Carga Horária**: Cada componente curricular define sua carga horária total distribuída obrigatoriamente entre três modalidades de entrega:
  1. *Presencial Física* (em salas de aula, laboratórios ou polos).
  2. *Síncrona Mediada* (aulas remotas ao vivo mediadas por tecnologia).
  3. *Assíncrona Digital* (conteúdos autoinstrucionais em Ambiente Virtual de Aprendizagem).
  - *Regra de Consistência*: A carga horária total cadastrada deve ser rigorosamente igual à soma das modalidades presencial, síncrona e assíncrona.
- **Classificação Curricular dos Componentes**: Categorização conforme projeto pedagógico em disciplinas de núcleo comum (*Vida & Carreira*), núcleo técnico específico (*Específico*), trilhas de formação flexível (*Eletivas*), disciplinas livres (*Optativas*) e atividades práticas de impacto social (*Extensão*).
- **Auditoria Automatizada de Conformidade MEC**:
  - *Curricularização da Extensão (Resolução CNE/CES nº 7/2018)*: O sistema calcula a razão da carga horária de extensão em relação à carga horária total da matriz. Matrizes com índice inferior a 10% recebem indicador explícito de não conformidade legal.
  - *Balanço Presencial e Síncrono*: Medição percentual instantânea de horas presenciais e mediadas por polo/campus, respaldando a conformidade regulatória para cursos presenciais, semipresenciais ou EAD.

### 2.3 Ingresso, Matrículas e Onboarding Discente

- **Efetivação de Vínculo Acadêmico**: Registro formal do estudante vinculado a um curso e obrigatoriamente a uma matriz curricular ativa e homologada.
- **Geração Automatizada de RA**: Criação de Registro Acadêmico único e permanente, composto pelo ano civil de ingresso acrescido de sufixo numérico exclusivo.
- **Tratamento Integral do Responsável Legal**: Na existência de dependência legal/financeira, o sistema cria simultaneamente o perfil do responsável (com validação estrita de unicidade de CPF e e-mail em relação ao aluno) ou associa um responsável já cadastrado na instituição.
- **Boas-Vindas e Entrega de Acesso (Onboarding Digital)**: Geração de senhas temporárias seguras com envio automático de e-mail formal da Secretaria Acadêmica, fornecendo RA, link do portal e orientações de primeiro acesso.
- **Gestão de Ciclo de Vida da Matrícula**: Acompanhamento dos estados de vínculo do estudante: pré-matrícula, ativa, trancada, cancelada, formada ou evadida.

### 2.4 Oferta de Turmas e Alocação Semestral

- **Planejamento por Período Letivo**: Oferta de turmas semestrais atreladas a um campus/polo, com especificação de disciplina, docente titular, limite de capacidade física/virtual, horário e local/link.
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
  - A pontuação semestral é balizada por duas avaliações regulares com pesos ponderados:  
    **Média Semestral = (A1 × 0,4) + (A2 × 0,6)**
  - *Aprovação Direta*: Caso a Média Semestral seja igual ou superior a 6,0 e a frequência esteja dentro do limite, o estudante é considerado aprovado.
  - *Avaliação Final (AF)*: Se a Média Semestral for inferior a 6,0 (e o aluno não tiver sido reprovado por faltas), habilita-se a Avaliação Final.  
    **Média Final = (Média Semestral + AF) / 2**  
    O aluno é aprovado se a Média Final resultar em nota igual ou superior a 5,0.
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
| Identidade | Login unificado, `GET /auth/me` (ids de aluno/professor e `ativo`) e `PATCH /auth/senha`. CRUD de usuários, professores e administradores; consulta de alunos e responsáveis (`/users`). JWT de conta inativa é recusado. |
| Currículo | CRUD de campus, curso, disciplina, matriz, componente e turma (`/academic`). Auditoria MEC da matriz. Professor lista/consulta apenas as próprias turmas. |
| Matrícula | Efetivação, consulta por status, alteração de status e exclusão do vínculo (`/matriculas`). O aluno não é apagado junto com a matrícula. |
| Diário | Enturmação ADMIN; listagem/consulta ADMIN+PROFESSOR (filtro JWT); desenturmação ADMIN; lançamento de notas/faltas pelo titular (`PATCH /diario/avaliar`). |
| Dashboards | `GET /dashboard/admin` e `GET /dashboard/professor` com KPIs do período letivo. |
| Financeiro | Precificação por curso (`/financeiro/precos`, ADMIN): o valor é cadastrado no OpenSGA e sincronizado como Product/Price no Stripe. Emissão de faturas (`/financeiro/faturas`). Checkout de matrícula (`POST /api/checkout` e `POST /api/v1/checkout`) em modo `subscription` com cupom de 100% na primeira parcela. Webhook `POST /webhooks/stripe` concilia `checkout.session.completed`, `invoice.payment_succeeded` e `invoice.payment_failed`. |
| Comunicação | CRUD de comunicados por público-alvo (`/comunicados`) e fluxo de ouvidoria: abrir, responder, fechar e excluir (`/ouvidoria/reclamacoes`). |

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
[Cadastrar Campus e Código de Polo MEC]
       │
       ▼
[Criar Curso e Nova Versão de Matriz Curricular]
       │
       ▼
[Vincular Componentes Curriculares à Matriz]
  ├─> Definir Semestre Ideal e Classificação (Ex: Extensão)
  └─> Decompor Carga Horária: Presencial + Síncrona + Assíncrona = CH Total
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
[Cria Matrícula com status "ATIVO" no 1º Semestre]
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
[Lançamento das notas A1 e A2 pelo Professor Titular da Turma]
       │
       ▼
[Sistema calcula automaticamente a Média Semestral e avalia Assiduidade]
       │
       ├── Total de Faltas > 25% da CH Total?
       │      └── SIM  -> Reprovado por Falta (RF) | CH Cumprida = 0h
       │
       └── Frequência Regular (Faltas <= 25%):
              │
              ├── Média Semestral >= 6,0?
              │      └── SIM  -> Aprovado Direto | CH Cumprida = CH Total
              │
              └── Média Semestral < 6,0:
                     │
                     ▼
              [Aluno realiza Avaliação Final (AF)]
                     │
                     ▼
              [Média Final = (Média Semestral + AF) / 2]
                     │
                     ├── Média Final >= 5,0 -> Aprovado em Exame | CH Cumprida = CH Total
                     └── Média Final < 5,0  -> Reprovado por Nota | CH Cumprida = 0h
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

- **A1 e A2 (Avaliações Regulares Semestrais)**: Instrumentos avaliativos de peso 40% e 60%, respectivamente, aplicados ao longo do semestre letivo para mensurar o aprendizado discente.
- **AF (Avaliação Final)**: Exame de recuperação concedido exclusivamente a estudantes que não alcançaram a média mínima semestral (6,0), desde que não tenham sido reprovados por limite de faltas.
- **Aluno**: Pessoa física com matrícula ativa ou com histórico curricular em um dos cursos da instituição.
- **Assiduidade**: Índice de comparecimento do estudante às aulas da disciplina. O descumprimento de mais de 25% da carga horária gera reprovação sumária por infrequência.
- **Campus / Polo**: Unidade física ou sede regional onde as atividades letivas e administrativas ocorrem, identificado formalmente por seu Código de Polo perante os cadastros do MEC.
- **Carga Horária Cumprida (`chCumprida`)**: Quantidade de horas de uma disciplina que são efetivamente incorporadas ao histórico de integralização do estudante, condicionada estritamente à sua aprovação.
- **Curricularização da Extensão**: Exigência legal estabelecida pela Resolução CNE/CES nº 7/2018 que impõe que no mínimo 10% da carga horária total da formação universitária seja dedicada a projetos e ações de extensão com a comunidade externa.
- **Diário de Classe**: Instrumento formal de escrituração acadêmica onde são consolidados os registros de presença, ausências, notas parciais, exame final e resultado conclusivo de cada aluno em uma turma ofertada.
- **Disciplina Global**: Entidade curricular neutra (ex.: *Cálculo I*, *Comunicação Empresarial*) reutilizável em múltiplos cursos ou unidades, evitando cadastros concorrentes no sistema.
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
  - `PRE_MATRICULADO`: Candidato em fase de análise de documentação ou assinatura de contrato.
  - `ATIVO`: Aluno regular, apto a enturmar-se em turmas do período e a acessar as instalações da instituição.
  - `TRANCADO`: Suspensão temporária do vínculo acadêmico a pedido do estudante, preservando o direito à reabertura de estudos.
  - `CANCELADO`: Rompimento definitivo do vínculo acadêmico por desistência ou rescisão contratual.
  - `FORMADO`: Aluno que completou com êxito todas as exigências curriculares e de colação de grau.
  - `EVADIDO`: Aluno que abandonou os estudos sem comunicação formal à Secretaria Acadêmica no período regulamentar.
- **Status da Fatura**:
  - `PENDENTE`: Cobrança gerada e aguardando liquidação até a data de vencimento.
  - `PAGA`: Liquidação financeira confirmada pelo gateway de pagamento ou baixa manual.
  - `ATRASADA`: Título vencido sem registro de pagamento, sujeito a ações de cobrança amigável.
  - `CANCELADA`: Cobrança invalidada por renegociação, bolsa, estorno ou cancelamento administrativo.
- **Turma**: Instância de oferta semestral de uma disciplina global, vinculada a um campus, um docente regente, uma faixa de horário, um espaço físico/virtual e um limite pré-determinado de vagas.

---

### Considerações Finais de Negócio

O **OpenSGA** posiciona-se como uma espinha dorsal corporativa de sustentação para Instituições de Ensino Superior, associando rigor matemático aos cálculos acadêmicos, conformidade legal proativa às exigências do MEC e segurança em todos os processos de gestão cadastral e financeira.
