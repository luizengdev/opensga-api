import bcrypt from "bcrypt";

import {ModalidadeCurso} from "../src/generated/prisma/enums.js";
import {dayjs} from "../src/lib/dayjs.js";
import {prisma} from "../src/lib/db.js";
import {env} from "../src/lib/env.js";
import {PARAMETRO_INSTITUCIONAL_ID, periodoLetivoDoCalendario} from "../src/lib/periodo-letivo.js";
import {createStripeTuitionCatalog} from "../src/lib/stripe.js";
import {collectViolacoesMatriz} from "../src/modules/academic/mec-2026.js";
import {
  alunoQuartoPeriodoEsw,
  lancamentoHistoricoAprovado,
  recuarSemestresLetivos,
} from "./seed-data/aluno-quarto-periodo.js";
import {matrizAdministracaoEad} from "./seed-data/matriz-administracao-ead.js";
import {matrizEngenhariaSoftware} from "./seed-data/matriz-engenharia-software.js";
import type {ILinhaMatrizSeed} from "./seed-data/tipos.js";

interface IAlunoSeed {
  nome: string;
  email: string;
  cpf: string;
  ra: string;
}

interface IProfessorSeed {
  nome: string;
  email: string;
  cpf: string;
  matricula: string;
  titulacao: string;
  departamento: string;
}

interface ICursoSeed {
  nome: string;
  codigoMec: string;
  modalidade: "PRESENCIAL" | "EAD";
  campusCodigo: "SEDE-REC" | "POLO-EAD";
  valorMensalidade: number;
  disciplina: {codigo: string; nome: string};
  professor: IProfessorSeed;
  alunos: IAlunoSeed[];
  catalogo?: "ESW" | "ADM_EAD";
}

const catalogosCompletos: Record<"ESW" | "ADM_EAD", ILinhaMatrizSeed[]> = {
  ESW: matrizEngenhariaSoftware,
  ADM_EAD: matrizAdministracaoEad,
};

const horariosPresenciais = ["Seg 19h-22h", "Ter 19h-22h", "Qua 19h-22h", "Qui 19h-22h", "Sex 19h-22h"] as const;
const salasPresenciais = [
  "Bloco A - Sala 101",
  "Bloco A - Sala 102",
  "Bloco B - Sala 201",
  "Bloco B - Sala 202",
  "Lab. de Computação 1",
] as const;
const horariosEad = [
  "Seg 19h-21h (síncrono)",
  "Ter 19h-21h (síncrono)",
  "Qua 19h-21h (síncrono)",
  "Qui 19h-21h (síncrono)",
  "Sex 19h-21h (síncrono)",
] as const;

const formatCpf = (sequence: number) => {
  const digits = String(sequence).padStart(11, "0");
  return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6, 9)}-${digits.slice(9)}`;
};

const cursosSeed: ICursoSeed[] = [
  {
    nome: "Engenharia de Software",
    codigoMec: "ESW-001",
    modalidade: "PRESENCIAL",
    campusCodigo: "SEDE-REC",
    valorMensalidade: 1290,
    disciplina: {codigo: "CALC1", nome: "Cálculo I"},
    catalogo: "ESW",
    professor: {
      nome: "Maria Silva",
      email: "professor@opensga.dev",
      cpf: "111.111.111-11",
      matricula: "PROF-001",
      titulacao: "Mestre",
      departamento: "Computação",
    },
    alunos: [
      {
        nome: "João Santos",
        email: "aluno@opensga.dev",
        cpf: "222.222.222-22",
        ra: "2026000001",
      },
      {
        nome: "Ana Beatriz Rocha",
        email: "aluno.esw.2@opensga.dev",
        cpf: formatCpf(30000000002),
        ra: "2026000002",
      },
    ],
  },
  {
    nome: "Direito",
    codigoMec: "DIR-001",
    modalidade: "PRESENCIAL",
    campusCodigo: "SEDE-REC",
    valorMensalidade: 1490,
    disciplina: {codigo: "DIRINT", nome: "Introdução ao Direito"},
    professor: {
      nome: "Carlos Mendes",
      email: "professor.dir@opensga.dev",
      cpf: formatCpf(11000000002),
      matricula: "PROF-002",
      titulacao: "Doutor",
      departamento: "Ciências Jurídicas",
    },
    alunos: [
      {nome: "Lucas Ferreira", email: "aluno.dir.1@opensga.dev", cpf: formatCpf(30000000003), ra: "2026000003"},
      {nome: "Mariana Lopes", email: "aluno.dir.2@opensga.dev", cpf: formatCpf(30000000004), ra: "2026000004"},
    ],
  },
  {
    nome: "Administração",
    codigoMec: "ADM-001",
    modalidade: "PRESENCIAL",
    campusCodigo: "SEDE-REC",
    valorMensalidade: 1190,
    disciplina: {codigo: "TEOADM", nome: "Teoria da Administração"},
    professor: {
      nome: "Patrícia Nogueira",
      email: "professor.adm@opensga.dev",
      cpf: formatCpf(11000000003),
      matricula: "PROF-003",
      titulacao: "Mestre",
      departamento: "Gestão",
    },
    alunos: [
      {nome: "Rafael Souza", email: "aluno.adm.1@opensga.dev", cpf: formatCpf(30000000005), ra: "2026000005"},
      {nome: "Camila Dias", email: "aluno.adm.2@opensga.dev", cpf: formatCpf(30000000006), ra: "2026000006"},
    ],
  },
  {
    nome: "Psicologia",
    codigoMec: "PSI-001",
    modalidade: "PRESENCIAL",
    campusCodigo: "SEDE-REC",
    valorMensalidade: 1390,
    disciplina: {codigo: "INTPSI", nome: "Introdução à Psicologia"},
    professor: {
      nome: "Helena Castro",
      email: "professor.psi@opensga.dev",
      cpf: formatCpf(11000000004),
      matricula: "PROF-004",
      titulacao: "Doutora",
      departamento: "Saúde",
    },
    alunos: [
      {nome: "Bruno Oliveira", email: "aluno.psi.1@opensga.dev", cpf: formatCpf(30000000007), ra: "2026000007"},
      {nome: "Juliana Martins", email: "aluno.psi.2@opensga.dev", cpf: formatCpf(30000000008), ra: "2026000008"},
    ],
  },
  {
    nome: "Enfermagem",
    codigoMec: "ENF-001",
    modalidade: "PRESENCIAL",
    campusCodigo: "SEDE-REC",
    valorMensalidade: 1590,
    disciplina: {codigo: "FENFER", nome: "Fundamentos de Enfermagem"},
    professor: {
      nome: "Roberto Azevedo",
      email: "professor.enf@opensga.dev",
      cpf: formatCpf(11000000005),
      matricula: "PROF-005",
      titulacao: "Mestre",
      departamento: "Saúde",
    },
    alunos: [
      {nome: "Fernanda Alves", email: "aluno.enf.1@opensga.dev", cpf: formatCpf(30000000009), ra: "2026000009"},
      {nome: "Thiago Barbosa", email: "aluno.enf.2@opensga.dev", cpf: formatCpf(30000000010), ra: "2026000010"},
    ],
  },
  {
    nome: "Análise e Desenvolvimento de Sistemas",
    codigoMec: "ADS-001",
    modalidade: "EAD",
    campusCodigo: "POLO-EAD",
    valorMensalidade: 690,
    disciplina: {codigo: "ALG1", nome: "Algoritmos e Lógica"},
    professor: {
      nome: "Diego Ramos",
      email: "professor.ads@opensga.dev",
      cpf: formatCpf(11000000006),
      matricula: "PROF-006",
      titulacao: "Especialista",
      departamento: "Computação",
    },
    alunos: [
      {nome: "Igor Teixeira", email: "aluno.ads.1@opensga.dev", cpf: formatCpf(30000000011), ra: "2026000011"},
      {nome: "Larissa Pinto", email: "aluno.ads.2@opensga.dev", cpf: formatCpf(30000000012), ra: "2026000012"},
    ],
  },
  {
    nome: "Gestão de TI",
    codigoMec: "GTI-001",
    modalidade: "EAD",
    campusCodigo: "POLO-EAD",
    valorMensalidade: 720,
    disciplina: {codigo: "FNDTI", nome: "Fundamentos de TI"},
    professor: {
      nome: "Vanessa Ribeiro",
      email: "professor.gti@opensga.dev",
      cpf: formatCpf(11000000007),
      matricula: "PROF-007",
      titulacao: "Mestre",
      departamento: "Computação",
    },
    alunos: [
      {nome: "Paulo Henrique", email: "aluno.gti.1@opensga.dev", cpf: formatCpf(30000000013), ra: "2026000013"},
      {nome: "Sofia Carvalho", email: "aluno.gti.2@opensga.dev", cpf: formatCpf(30000000014), ra: "2026000014"},
    ],
  },
  {
    nome: "Pedagogia",
    codigoMec: "PED-001",
    modalidade: "EAD",
    campusCodigo: "POLO-EAD",
    valorMensalidade: 650,
    disciplina: {codigo: "DIDAT", nome: "Didática"},
    professor: {
      nome: "Aline Moreira",
      email: "professor.ped@opensga.dev",
      cpf: formatCpf(11000000008),
      matricula: "PROF-008",
      titulacao: "Doutora",
      departamento: "Educação",
    },
    alunos: [
      {nome: "Gabriel Costa", email: "aluno.ped.1@opensga.dev", cpf: formatCpf(30000000015), ra: "2026000015"},
      {nome: "Beatriz Lima", email: "aluno.ped.2@opensga.dev", cpf: formatCpf(30000000016), ra: "2026000016"},
    ],
  },
  {
    nome: "Ciências Contábeis",
    codigoMec: "CON-001",
    modalidade: "EAD",
    campusCodigo: "POLO-EAD",
    valorMensalidade: 680,
    disciplina: {codigo: "CONT1", nome: "Contabilidade Introdutória"},
    professor: {
      nome: "Eduardo Farias",
      email: "professor.con@opensga.dev",
      cpf: formatCpf(11000000009),
      matricula: "PROF-009",
      titulacao: "Mestre",
      departamento: "Gestão",
    },
    alunos: [
      {nome: "Amanda Vieira", email: "aluno.con.1@opensga.dev", cpf: formatCpf(30000000017), ra: "2026000017"},
      {nome: "Felipe Araújo", email: "aluno.con.2@opensga.dev", cpf: formatCpf(30000000018), ra: "2026000018"},
    ],
  },
  {
    nome: "Marketing Digital",
    codigoMec: "MKT-001",
    modalidade: "EAD",
    campusCodigo: "POLO-EAD",
    valorMensalidade: 640,
    disciplina: {codigo: "MKTDG", nome: "Introdução ao Marketing Digital"},
    professor: {
      nome: "Natália Gomes",
      email: "professor.mkt@opensga.dev",
      cpf: formatCpf(11000000010),
      matricula: "PROF-010",
      titulacao: "Especialista",
      departamento: "Gestão",
    },
    alunos: [
      {nome: "Henrique Melo", email: "aluno.mkt.1@opensga.dev", cpf: formatCpf(30000000019), ra: "2026000019"},
      {nome: "Isabela Duarte", email: "aluno.mkt.2@opensga.dev", cpf: formatCpf(30000000020), ra: "2026000020"},
    ],
  },
  {
    nome: "Administração",
    codigoMec: "ADM-EAD",
    modalidade: "EAD",
    campusCodigo: "POLO-EAD",
    valorMensalidade: 590,
    disciplina: {codigo: "TEOADM", nome: "Teoria da Administração"},
    catalogo: "ADM_EAD",
    professor: {
      nome: "Sérgio Palhares",
      email: "professor.admead@opensga.dev",
      cpf: formatCpf(11000000011),
      matricula: "PROF-011",
      titulacao: "Mestre",
      departamento: "Gestão",
    },
    alunos: [
      {nome: "Tatiana Reis", email: "aluno.admead.1@opensga.dev", cpf: formatCpf(30000000021), ra: "2026000021"},
      {nome: "Vinícius Prado", email: "aluno.admead.2@opensga.dev", cpf: formatCpf(30000000022), ra: "2026000022"},
    ],
  },
];

const ensureCampus = async ({
  nome,
  codigoPolo,
  tipo,
  cidade,
  estado,
  endereco,
}: {
  nome: string;
  codigoPolo: string;
  tipo: "CAMPI" | "POLO";
  cidade: string;
  estado: string;
  endereco: string;
}) => {
  return prisma.campus.upsert({
    where: {codigoPolo},
    update: {nome, tipo, cidade, estado, endereco},
    create: {nome, codigoPolo, tipo, cidade, estado, endereco},
  });
};

const ensureDisciplina = async ({
  codigo,
  nome,
  tipo,
  tipoEntrega,
  chTotal,
  chPresencial,
  chSincrona,
  chAssincrona,
  chExtensao,
}: {
  codigo: string;
  nome: string;
  tipo: "CORE_VIDA_CARREIRA" | "ESPECIFICO" | "EXTENSAO";
  tipoEntrega: "PRESENCIAL_FISICO" | "SINCRONO_MEDIADO" | "ASSINCRONO_DIGITAL";
  chTotal: number;
  chPresencial: number;
  chSincrona: number;
  chAssincrona: number;
  chExtensao: number;
}) => {
  const carga = {nome, tipo, tipoEntrega, chTotal, chPresencial, chSincrona, chAssincrona, chExtensao};

  return prisma.disciplina.upsert({
    where: {codigo},
    update: {nome},
    create: {codigo, ...carga},
  });
};

const ensureComponente = async ({
  matrizCurricularId,
  disciplinaId,
  semestreIdeal,
  tipo,
  tipoEntrega,
  chTotal,
  chPresencial,
  chSincrona,
  chAssincrona,
  chExtensao,
}: {
  matrizCurricularId: string;
  disciplinaId: string;
  semestreIdeal: number;
  tipo: "CORE_VIDA_CARREIRA" | "ESPECIFICO" | "EXTENSAO";
  tipoEntrega: "PRESENCIAL_FISICO" | "SINCRONO_MEDIADO" | "ASSINCRONO_DIGITAL";
  chTotal: number;
  chPresencial: number;
  chSincrona: number;
  chAssincrona: number;
  chExtensao: number;
}) => {
  const existente = await prisma.matrizComponente.findUnique({
    where: {
      matrizCurricularId_disciplinaId: {matrizCurricularId, disciplinaId},
    },
  });

  if (existente) {
    return prisma.matrizComponente.update({
      where: {id: existente.id},
      data: {
        semestreIdeal,
        tipo,
        tipoEntrega,
        chTotal,
        chPresencial,
        chSincrona,
        chAssincrona,
        chExtensao,
      },
    });
  }

  return prisma.matrizComponente.create({
    data: {
      matrizCurricularId,
      disciplinaId,
      semestreIdeal,
      tipo,
      tipoEntrega,
      chTotal,
      chPresencial,
      chSincrona,
      chAssincrona,
      chExtensao,
    },
  });
};

const applyLinhasMatriz = async (matrizCurricularId: string, linhas: ILinhaMatrizSeed[]) => {
  const disciplinas = await Promise.all(
    linhas.map(async (linha) => {
      const disciplina = await ensureDisciplina(linha);
      await ensureComponente({
        matrizCurricularId,
        disciplinaId: disciplina.id,
        semestreIdeal: linha.semestreIdeal,
        tipo: linha.tipo,
        tipoEntrega: linha.tipoEntrega,
        chTotal: linha.chTotal,
        chPresencial: linha.chPresencial,
        chSincrona: linha.chSincrona,
        chAssincrona: linha.chAssincrona,
        chExtensao: linha.chExtensao,
      });
      return {linha, disciplina};
    }),
  );

  const codigos = new Set(linhas.map((linha) => linha.codigo));
  const componentes = await prisma.matrizComponente.findMany({
    where: {matrizCurricularId},
    include: {disciplina: {select: {codigo: true}}},
  });

  await Promise.all(
    componentes
      .filter((componente) => !codigos.has(componente.disciplina.codigo))
      .map((componente) => prisma.matrizComponente.delete({where: {id: componente.id}})),
  );

  return disciplinas;
};

const assertMatrizConforme = async ({
  matrizId,
  modalidade,
  nomeCurso,
}: {
  matrizId: string;
  modalidade: "PRESENCIAL" | "EAD";
  nomeCurso: string;
}) => {
  const componentes = await prisma.matrizComponente.findMany({
    where: {matrizCurricularId: matrizId},
  });

  const {violacoes} = collectViolacoesMatriz({
    modalidade: modalidade === "PRESENCIAL" ? ModalidadeCurso.PRESENCIAL : ModalidadeCurso.EAD,
    componentes,
  });

  if (violacoes.length > 0) {
    const detalhe = violacoes.map((violacao) => violacao.mensagem).join("; ");
    throw new Error(`Matriz de ${nomeCurso} falhou na auditoria MEC: ${detalhe}`);
  }
};

const codigoTurmaPeriodo = ({
  codigoDisciplina,
  codigoMec,
  anoLetivo,
  semestreLetivo,
  namespaced,
}: {
  codigoDisciplina: string;
  codigoMec: string;
  anoLetivo: number;
  semestreLetivo: number;
  namespaced: boolean;
}) => {
  if (codigoDisciplina === "CALC1") {
    return `CALC1-${anoLetivo}.${semestreLetivo}`;
  }

  if (namespaced) {
    return `${codigoMec}-${codigoDisciplina}-${anoLetivo}.${semestreLetivo}`;
  }

  return `${codigoDisciplina}-${anoLetivo}.${semestreLetivo}`;
};

const ensureTurmaPeriodo = async ({
  campusId,
  cursoId,
  disciplinaId,
  professorId,
  codigo,
  anoLetivo,
  semestreLetivo,
  isPresencial,
  indiceHorario,
}: {
  campusId: string;
  cursoId: string;
  disciplinaId: string;
  professorId: string;
  codigo: string;
  anoLetivo: number;
  semestreLetivo: number;
  isPresencial: boolean;
  indiceHorario: number;
}) => {
  const horario = isPresencial
    ? horariosPresenciais[indiceHorario % horariosPresenciais.length]
    : horariosEad[indiceHorario % horariosEad.length];
  const salaOuLink = isPresencial
    ? salasPresenciais[indiceHorario % salasPresenciais.length]
    : "https://meet.opensga.dev/aula";

  return prisma.turma.upsert({
    where: {codigo},
    update: {
      campusId,
      cursoId,
      disciplinaId,
      professorId,
      anoLetivo,
      semestreLetivo,
      tipoEntrega: isPresencial ? "PRESENCIAL_FISICO" : "SINCRONO_MEDIADO",
    },
    create: {
      campusId,
      cursoId,
      disciplinaId,
      professorId,
      codigo,
      anoLetivo,
      semestreLetivo,
      capacidade: 40,
      horario,
      salaOuLink,
      tipoEntrega: isPresencial ? "PRESENCIAL_FISICO" : "SINCRONO_MEDIADO",
    },
  });
};

const ensureProfessor = async (input: IProfessorSeed, senhaHash: string) => {
  const user = await prisma.user.upsert({
    where: {email: input.email},
    update: {nome: input.nome, cpf: input.cpf, ativo: true},
    create: {
      nome: input.nome,
      email: input.email,
      cpf: input.cpf,
      senhaHash,
      role: "PROFESSOR",
      ativo: true,
    },
  });

  const professor =
    (await prisma.professor.findUnique({where: {userId: user.id}})) ??
    (await prisma.professor.create({
      data: {
        userId: user.id,
        matricula: input.matricula,
        titulacao: input.titulacao,
        departamento: input.departamento,
      },
    }));

  return {user, professor};
};

const ensureAluno = async (input: IAlunoSeed, senhaHash: string) => {
  const user = await prisma.user.upsert({
    where: {email: input.email},
    update: {nome: input.nome, cpf: input.cpf, ativo: true},
    create: {
      nome: input.nome,
      email: input.email,
      cpf: input.cpf,
      senhaHash,
      role: "ALUNO",
      ativo: true,
    },
  });

  const aluno =
    (await prisma.aluno.findUnique({where: {userId: user.id}})) ??
    (await prisma.aluno.create({
      data: {
        userId: user.id,
        ra: input.ra,
        dataNascimento: dayjs("2004-03-15", "YYYY-MM-DD").toDate(),
      },
    }));

  return {user, aluno};
};

const seedAlunoQuartoPeriodoEsw = async ({
  campusId,
  cursoId,
  matrizId,
  professorId,
  codigoMec,
  valorMensalidade,
  anoLetivo,
  semestreLetivo,
  senhaAluno,
}: {
  campusId: string;
  cursoId: string;
  matrizId: string;
  professorId: string;
  codigoMec: string;
  valorMensalidade: number;
  anoLetivo: number;
  semestreLetivo: number;
  senhaAluno: string;
}) => {
  const periodoAtual = 4;
  const ingresso = recuarSemestresLetivos({anoLetivo, semestreLetivo}, periodoAtual - 1);
  const semestreIngresso = `${ingresso.anoLetivo}.${ingresso.semestreLetivo}`;
  const {aluno} = await ensureAluno({...alunoQuartoPeriodoEsw}, senhaAluno);

  const matriculaExistente = await prisma.matricula.findFirst({
    where: {alunoId: aluno.id, cursoId, matrizCurricularId: matrizId},
  });

  const matricula =
    matriculaExistente ??
    (await prisma.matricula.create({
      data: {
        alunoId: aluno.id,
        cursoId,
        matrizCurricularId: matrizId,
        status: "ATIVO",
        periodoAtual,
        semestreIngresso,
      },
    }));

  if (matricula.periodoAtual !== periodoAtual || matricula.semestreIngresso !== semestreIngresso) {
    await prisma.matricula.update({
      where: {id: matricula.id},
      data: {periodoAtual, semestreIngresso},
    });
  }

  const linhas = matrizEngenhariaSoftware.filter((linha) => linha.semestreIdeal <= periodoAtual);

  await Promise.all(
    linhas.map(async (linha, index) => {
      const disciplina = await prisma.disciplina.findUnique({where: {codigo: linha.codigo}});

      if (!disciplina) {
        throw new Error(`Disciplina ${linha.codigo} não encontrada para o aluno do 4º período.`);
      }

      const periodoOferta = recuarSemestresLetivos({anoLetivo, semestreLetivo}, periodoAtual - linha.semestreIdeal);
      const turma = await ensureTurmaPeriodo({
        campusId,
        cursoId,
        disciplinaId: disciplina.id,
        professorId,
        codigo: codigoTurmaPeriodo({
          codigoDisciplina: linha.codigo,
          codigoMec,
          anoLetivo: periodoOferta.anoLetivo,
          semestreLetivo: periodoOferta.semestreLetivo,
          namespaced: true,
        }),
        anoLetivo: periodoOferta.anoLetivo,
        semestreLetivo: periodoOferta.semestreLetivo,
        isPresencial: true,
        indiceHorario: index,
      });

      const historico =
        linha.semestreIdeal < periodoAtual ? lancamentoHistoricoAprovado({index, chTotal: linha.chTotal}) : null;

      await prisma.diarioClasse.upsert({
        where: {
          matriculaId_turmaId: {
            matriculaId: matricula.id,
            turmaId: turma.id,
          },
        },
        update: historico ?? {},
        create: {
          matriculaId: matricula.id,
          turmaId: turma.id,
          ...(historico ?? {}),
        },
      });
    }),
  );

  const descricaoFatura = `Mensalidade ${anoLetivo}.${semestreLetivo} · ${codigoMec}`;
  const faturaExistente = await prisma.fatura.findFirst({
    where: {alunoId: aluno.id, descricao: descricaoFatura},
  });

  if (!faturaExistente) {
    await prisma.fatura.create({
      data: {
        alunoId: aluno.id,
        descricao: descricaoFatura,
        valor: valorMensalidade,
        dataVencimento: dayjs(`${anoLetivo}-04-10`, "YYYY-MM-DD").toDate(),
        status: "PENDENTE",
      },
    });
  }
};

const ensurePrecoCurso = async ({
  cursoId,
  nome,
  modalidade,
  valor,
}: {
  cursoId: string;
  nome: string;
  modalidade: "PRESENCIAL" | "EAD";
  valor: number;
}) => {
  const existente = await prisma.precoCurso.findUnique({where: {cursoId}});

  if (existente) {
    return existente;
  }

  if (
    nome === "Engenharia de Software" &&
    modalidade === "PRESENCIAL" &&
    process.env.STRIPE_PRODUCT_PRESENCIAL &&
    process.env.STRIPE_PRICE_PRESENCIAL
  ) {
    return prisma.precoCurso.create({
      data: {
        cursoId,
        valor,
        stripeProductId: process.env.STRIPE_PRODUCT_PRESENCIAL,
        stripePriceId: process.env.STRIPE_PRICE_PRESENCIAL,
      },
    });
  }

  if (!env.STRIPE_SECRET_KEY) {
    return null;
  }

  try {
    const catalog = await createStripeTuitionCatalog({cursoId, modalidade, nome, valor});
    return prisma.precoCurso.create({
      data: {
        cursoId,
        valor,
        stripeProductId: catalog.stripeProductId,
        stripePriceId: catalog.stripePriceId,
      },
    });
  } catch (error) {
    console.error(`Stripe indisponível para ${nome}:`, error);
    return null;
  }
};

async function main() {
  const senhaAdmin = await bcrypt.hash("Admin@123456", 10);
  const senhaProfessor = await bcrypt.hash("Professor@123456", 10);
  const senhaAluno = await bcrypt.hash("Aluno@123456", 10);

  const admin = await prisma.user.upsert({
    where: {email: "testeadmin@opensga.dev"},
    update: {},
    create: {
      nome: "Teste Admin",
      email: "testeadmin@opensga.dev",
      cpf: "121.121.121-21",
      senhaHash: senhaAdmin,
      role: "ADMIN",
      ativo: true,
    },
  });

  const sede = await ensureCampus({
    nome: "Sede Recife",
    codigoPolo: "SEDE-REC",
    tipo: "CAMPI",
    cidade: "Recife",
    estado: "PE",
    endereco: "Av. Conde da Boa Vista, 1000",
  });

  const poloEad = await ensureCampus({
    nome: "Polo EAD Recife",
    codigoPolo: "POLO-EAD",
    tipo: "POLO",
    cidade: "Recife",
    estado: "PE",
    endereco: "Rua do Imperador, 200 — Polo Digital",
  });

  const campi = {
    "SEDE-REC": sede,
    "POLO-EAD": poloEad,
  };

  const etica = await ensureDisciplina({
    codigo: "ETICA",
    nome: "Ética e Cidadania",
    tipo: "CORE_VIDA_CARREIRA",
    tipoEntrega: "PRESENCIAL_FISICO",
    chTotal: 60,
    chPresencial: 60,
    chSincrona: 0,
    chAssincrona: 0,
    chExtensao: 0,
  });
  const extensao = await ensureDisciplina({
    codigo: "EXTUNIV",
    nome: "Extensão Universitária",
    tipo: "EXTENSAO",
    tipoEntrega: "PRESENCIAL_FISICO",
    chTotal: 40,
    chPresencial: 40,
    chSincrona: 0,
    chAssincrona: 0,
    chExtensao: 40,
  });

  const {anoLetivo, semestreLetivo} = periodoLetivoDoCalendario();
  const semestreIngresso = `${anoLetivo}.${semestreLetivo}`;

  for (const item of cursosSeed) {
    const campus = campi[item.campusCodigo];
    const isPresencial = item.modalidade === "PRESENCIAL";

    const cursoExistente = await prisma.curso.findFirst({
      where: {nome: item.nome, campusId: campus.id, modalidade: item.modalidade},
    });

    const curso =
      cursoExistente ??
      (await prisma.curso.create({
        data: {
          campusId: campus.id,
          nome: item.nome,
          codigoMec: item.codigoMec,
          modalidade: item.modalidade,
          duracaoSemestres: 8,
        },
      }));

    await ensurePrecoCurso({
      cursoId: curso.id,
      nome: item.nome,
      modalidade: item.modalidade,
      valor: item.valorMensalidade,
    });

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

    let ofertasPrimeiroPeriodo: {codigo: string; disciplinaId: string}[];

    if (item.catalogo) {
      const linhas = catalogosCompletos[item.catalogo];
      const aplicadas = await applyLinhasMatriz(matriz.id, linhas);
      await assertMatrizConforme({
        matrizId: matriz.id,
        modalidade: item.modalidade,
        nomeCurso: `${item.nome} ${item.modalidade}`,
      });
      ofertasPrimeiroPeriodo = aplicadas
        .filter((aplicada) => aplicada.linha.semestreIdeal === 1)
        .map((aplicada) => ({codigo: aplicada.linha.codigo, disciplinaId: aplicada.disciplina.id}));
    } else {
      const especifica = await ensureDisciplina({
        ...item.disciplina,
        tipo: "ESPECIFICO",
        tipoEntrega: isPresencial ? "PRESENCIAL_FISICO" : "ASSINCRONO_DIGITAL",
        chTotal: 60,
        chPresencial: isPresencial ? 60 : 8,
        chSincrona: isPresencial ? 0 : 12,
        chAssincrona: isPresencial ? 0 : 40,
        chExtensao: 0,
      });

      await ensureComponente({
        matrizCurricularId: matriz.id,
        disciplinaId: etica.id,
        semestreIdeal: 1,
        tipo: "CORE_VIDA_CARREIRA",
        tipoEntrega: isPresencial ? "PRESENCIAL_FISICO" : "SINCRONO_MEDIADO",
        chTotal: 60,
        chPresencial: isPresencial ? 60 : 8,
        chSincrona: isPresencial ? 0 : 12,
        chAssincrona: isPresencial ? 0 : 40,
        chExtensao: 0,
      });

      await ensureComponente({
        matrizCurricularId: matriz.id,
        disciplinaId: especifica.id,
        semestreIdeal: 1,
        tipo: "ESPECIFICO",
        tipoEntrega: isPresencial ? "PRESENCIAL_FISICO" : "ASSINCRONO_DIGITAL",
        chTotal: 60,
        chPresencial: isPresencial ? 60 : 8,
        chSincrona: isPresencial ? 0 : 12,
        chAssincrona: isPresencial ? 0 : 40,
        chExtensao: 0,
      });

      await ensureComponente({
        matrizCurricularId: matriz.id,
        disciplinaId: extensao.id,
        semestreIdeal: 1,
        tipo: "EXTENSAO",
        tipoEntrega: isPresencial ? "PRESENCIAL_FISICO" : "ASSINCRONO_DIGITAL",
        chTotal: 40,
        chPresencial: isPresencial ? 40 : 6,
        chSincrona: isPresencial ? 0 : 8,
        chAssincrona: isPresencial ? 0 : 26,
        chExtensao: 40,
      });

      ofertasPrimeiroPeriodo = [{codigo: item.disciplina.codigo, disciplinaId: especifica.id}];
    }

    const {professor} = await ensureProfessor(item.professor, senhaProfessor);

    const turmasPeriodo = await Promise.all(
      ofertasPrimeiroPeriodo.map((oferta, indiceHorario) =>
        ensureTurmaPeriodo({
          campusId: campus.id,
          cursoId: curso.id,
          disciplinaId: oferta.disciplinaId,
          professorId: professor.id,
          codigo: codigoTurmaPeriodo({
            codigoDisciplina: oferta.codigo,
            codigoMec: item.codigoMec,
            anoLetivo,
            semestreLetivo,
            namespaced: Boolean(item.catalogo),
          }),
          anoLetivo,
          semestreLetivo,
          isPresencial,
          indiceHorario,
        }),
      ),
    );

    const alunosDoCurso = await Promise.all(item.alunos.map((alunoSeed) => ensureAluno(alunoSeed, senhaAluno)));

    await Promise.all(
      alunosDoCurso.map(async ({aluno}, index) => {
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
              semestreIngresso,
            },
          }));

        await Promise.all(
          turmasPeriodo.map((turma) =>
            prisma.diarioClasse.upsert({
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
                notaAv: index === 1 ? 7.5 : null,
                notaSemestral: index === 1 ? 7.5 : null,
              },
            }),
          ),
        );

        const descricaoFatura = `Mensalidade ${semestreIngresso} · ${item.codigoMec}`;
        const faturaExistente = await prisma.fatura.findFirst({
          where: {alunoId: aluno.id, descricao: descricaoFatura},
        });

        if (!faturaExistente) {
          await prisma.fatura.create({
            data: {
              alunoId: aluno.id,
              descricao: descricaoFatura,
              valor: item.valorMensalidade,
              dataVencimento: dayjs(`${anoLetivo}-04-10`, "YYYY-MM-DD").toDate(),
              status: "PENDENTE",
            },
          });
        }
      }),
    );

    if (item.catalogo === "ESW") {
      await seedAlunoQuartoPeriodoEsw({
        campusId: campus.id,
        cursoId: curso.id,
        matrizId: matriz.id,
        professorId: professor.id,
        codigoMec: item.codigoMec,
        valorMensalidade: item.valorMensalidade,
        anoLetivo,
        semestreLetivo,
        senhaAluno,
      });
    }
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

  const alunoDemo = await prisma.user.findUnique({where: {email: "aluno@opensga.dev"}});
  const reclamacaoExistente = await prisma.reclamacao.findFirst({
    where: {assunto: "Acesso ao AVA no primeiro acesso"},
  });

  if (alunoDemo && !reclamacaoExistente) {
    await prisma.reclamacao.create({
      data: {
        usuarioId: alunoDemo.id,
        assunto: "Acesso ao AVA no primeiro acesso",
        tipo: "ACADEMICO",
        descricao: "Não consigo entrar no ambiente virtual após receber as credenciais.",
        status: "ABERTO",
      },
    });
  }

  const faturaJoaoLegado = await prisma.fatura.findFirst({
    where: {descricao: "Mensalidade 2026.1"},
  });

  if (!faturaJoaoLegado) {
    const alunoJoao = await prisma.aluno.findUnique({where: {ra: "2026000001"}});
    if (alunoJoao) {
      await prisma.fatura.create({
        data: {
          alunoId: alunoJoao.id,
          descricao: "Mensalidade 2026.1",
          valor: 980.5,
          dataVencimento: dayjs("2026-04-10", "YYYY-MM-DD").toDate(),
          status: "PENDENTE",
        },
      });
    }
  }

  const modelosDocumento = [
    {
      tipo: "DECLARACAO_MATRICULA" as const,
      titulo: "Declaração de matrícula ativa",
      descricao: "Atesta vínculo discente no semestre vigente com disciplinas e carga horária.",
      finalidade: "Estágios, passe estudantil e bancos.",
      corpo:
        "Declaramos, para os devidos fins e a quem possa interessar, que o(a) discente {{aluno.nome}}, portador(a) do CPF sob o nº {{aluno.cpf}} e Registro Acadêmico RA {{aluno.ra}}, encontra-se regularmente matriculado(a) e com frequência ativa no curso de {{curso.nome}}, modalidade {{curso.modalidade}}, no polo {{campus.nome}}.\n\nO discente ingressou nesta Instituição de Ensino Superior no período letivo de {{semestreIngresso}} e está cursando atualmente o {{periodoAtual}}º período, estando em conformidade com as exigências regimentais e da Lei de Diretrizes e Bases da Educação Nacional (LDB 9.394/96).",
    },
    {
      tipo: "HISTORICO_PARCIAL" as const,
      titulo: "Histórico escolar parcial",
      descricao: "Espelho curricular com disciplinas, médias finais e horas integralizadas.",
      finalidade: "Transferência, processos seletivos e intercâmbio.",
      corpo:
        "Espelho curricular do(a) discente {{aluno.nome}}, RA {{aluno.ra}}, no curso de {{curso.nome}}. Carga horária integralizada: {{chIntegralizada}}h de {{chTotalCurso}}h.",
    },
    {
      tipo: "QUITACAO_FINANCEIRA" as const,
      titulo: "Declaração de quitação financeira",
      descricao: "Certidão de adimplência das mensalidades até a data corrente.",
      finalidade: "Bolsas, convênios e comprovação de pagamentos.",
      corpo:
        "Certificamos que o(a) estudante {{aluno.nome}}, inscrito(a) sob o CPF {{aluno.cpf}} e RA {{aluno.ra}}, do curso de {{curso.nome}}, encontra-se com sua situação financeira regular e em dia com as obrigações contratuais até {{dataEmissao}}.\n\nEsta declaração atesta a ausência de débitos vencidos e pendências de mensalidades para fins de comprovação em estágios, transferência ou solicitação de financiamento estudantil.",
    },
    {
      tipo: "CARTEIRINHA_ESTUDANTIL" as const,
      titulo: "Carteirinha estudantil digital",
      descricao: "Identificação estudantil com RA e validade vinculada à matrícula ativa.",
      finalidade: "Acesso ao campus e meia-entrada.",
      corpo:
        "Documento de identificação estudantil válido enquanto a matrícula permanecer ativa. Autenticidade: {{codigoAutenticacao}}.",
    },
  ];

  for (const modelo of modelosDocumento) {
    await prisma.modeloDocumento.upsert({
      where: {tipo: modelo.tipo},
      update: {},
      create: modelo,
    });
  }

  await prisma.parametroInstitucional.upsert({
    where: {id: PARAMETRO_INSTITUCIONAL_ID},
    update: {},
    create: {
      id: PARAMETRO_INSTITUCIONAL_ID,
      nomeIes: "OpenSGA",
      siglaIes: "OSGA",
      mantenedora: "",
      cnpj: "",
      anoLetivo,
      semestreLetivo,
      periodoAutomatico: true,
      corteAprovacaoDireta: 6,
      corteMediaFinal: 5,
      limiteFaltasPercentual: 25,
      percentualMinimoExtensao: 10,
    },
  });

  console.log(`✅ Admin: ${admin.email} (Senha: Admin@123456)`);
  console.log(`✅ Campi: ${sede.codigoPolo}, ${poloEad.codigoPolo}`);
  console.log("✅ 5 cursos PRESENCIAL (SEDE-REC) e 6 EAD (POLO-EAD, incl. Administração EAD)");
  console.log("✅ 11 professores / 23 alunos / matrizes 2026.1 com extensão ≥ 10%");
  console.log("✅ Matrizes completas (8 semestres): Engenharia de Software presencial e Administração EAD");
  console.log(`✅ Turmas do 1º período ${anoLetivo}.${semestreLetivo} (CALC1 canônica sem nota no João)`);
  console.log("✅ Aluno 4º período: aluno.esw.4@opensga.dev / RA 2025000001 (histórico 1–3 APROVADO)");
  console.log("✅ Professor canônico: professor@opensga.dev (Senha: Professor@123456)");
  console.log("✅ Aluno canônico: aluno@opensga.dev / RA 2026000001 (Senha: Aluno@123456)");
  console.log("✅ Demais logins: professor.{sigla}@opensga.dev e aluno.{sigla}.{1|2}@opensga.dev");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
