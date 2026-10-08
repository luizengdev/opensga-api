import {linhaEad, type ILinhaMatrizSeed} from "./tipos.js";

const disc = (
  codigo: string,
  nome: string,
  tipo: ILinhaMatrizSeed["tipo"],
  chTotal: number,
  semestreIdeal: number,
) => linhaEad({codigo, nome, tipo, chTotal, semestreIdeal});

export const matrizAdministracaoEad: ILinhaMatrizSeed[] = [
  disc("ETICA", "Ética e Cidadania", "CORE_VIDA_CARREIRA", 60, 1),
  disc("LPORT", "Língua Portuguesa", "CORE_VIDA_CARREIRA", 60, 1),
  disc("TEOADM", "Teoria da Administração", "ESPECIFICO", 60, 1),
  disc("MATFIN", "Matemática Financeira", "ESPECIFICO", 60, 1),
  disc("EXTAD1", "Projeto de Extensão em Gestão I", "EXTENSAO", 80, 1),

  disc("EMPREE", "Empreendedorismo", "CORE_VIDA_CARREIRA", 60, 2),
  disc("CONTADM", "Contabilidade Gerencial", "ESPECIFICO", 60, 2),
  disc("MICROEC", "Microeconomia", "ESPECIFICO", 60, 2),
  disc("MKTG", "Fundamentos de Marketing", "ESPECIFICO", 60, 2),
  disc("EXTAD2", "Projeto de Extensão em Gestão II", "EXTENSAO", 80, 2),

  disc("DIRADM", "Direito Empresarial", "ESPECIFICO", 60, 3),
  disc("GESTRH", "Gestão de Pessoas", "ESPECIFICO", 60, 3),
  disc("ESTAT", "Estatística Aplicada", "ESPECIFICO", 60, 3),
  disc("SOCIOORG", "Sociologia das Organizações", "CORE_VIDA_CARREIRA", 40, 3),
  disc("EXTAD3", "Projeto de Extensão em Gestão III", "EXTENSAO", 80, 3),

  disc("FINCORP", "Finanças Corporativas", "ESPECIFICO", 80, 4),
  disc("GESTOPS", "Gestão de Operações", "ESPECIFICO", 60, 4),
  disc("LOGIST", "Logística Empresarial", "ESPECIFICO", 60, 4),
  disc("COMPORG", "Comportamento Organizacional", "ESPECIFICO", 60, 4),
  disc("EXTAD4", "Projeto de Extensão em Gestão IV", "EXTENSAO", 80, 4),

  disc("ESTRAT", "Administração Estratégica", "ESPECIFICO", 80, 5),
  disc("SISINF", "Sistemas de Informação Gerencial", "ESPECIFICO", 60, 5),
  disc("ORCAM", "Orçamento Empresarial", "ESPECIFICO", 60, 5),
  disc("NEGINT", "Negócios Internacionais", "ESPECIFICO", 60, 5),
  disc("EXTAD5", "Projeto de Extensão em Gestão V", "EXTENSAO", 80, 5),

  disc("GESTQUAL", "Gestão da Qualidade", "ESPECIFICO", 60, 6),
  disc("INOV", "Inovação e Novos Negócios", "ESPECIFICO", 60, 6),
  disc("MKTSTR", "Marketing Estratégico", "ESPECIFICO", 60, 6),
  disc("ESTAGAD", "Estágio Supervisionado em Administração", "ESPECIFICO", 80, 6),
  disc("EXTAD6", "Projeto de Extensão em Gestão VI", "EXTENSAO", 80, 6),

  disc("TCCAD1", "Trabalho de Conclusão de Curso I", "ESPECIFICO", 80, 7),
  disc("GOVCORP", "Governança Corporativa", "ESPECIFICO", 60, 7),
  disc("GESTPESS", "Gestão de Desempenho", "ESPECIFICO", 60, 7),
  disc("EXTAD7", "Projeto de Extensão em Gestão VII", "EXTENSAO", 80, 7),

  disc("TCCAD2", "Trabalho de Conclusão de Curso II", "ESPECIFICO", 80, 8),
  disc("JOGOSNEG", "Jogos de Empresas", "ESPECIFICO", 60, 8),
  disc("TOPADM", "Tópicos Especiais em Administração", "ESPECIFICO", 60, 8),
  disc("EXTAD8", "Projeto de Extensão em Gestão VIII", "EXTENSAO", 80, 8),
];
