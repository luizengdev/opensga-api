import {linhaPresencial, type ILinhaMatrizSeed} from "./tipos.js";

const disc = (
  codigo: string,
  nome: string,
  tipo: ILinhaMatrizSeed["tipo"],
  chTotal: number,
  semestreIdeal: number,
) => linhaPresencial({codigo, nome, tipo, chTotal, semestreIdeal});

export const matrizEngenhariaSoftware: ILinhaMatrizSeed[] = [
  disc("ETICA", "Ética e Cidadania", "CORE_VIDA_CARREIRA", 60, 1),
  disc("LPORT", "Língua Portuguesa", "CORE_VIDA_CARREIRA", 60, 1),
  disc("CALC1", "Cálculo I", "ESPECIFICO", 80, 1),
  disc("ALGPROG", "Algoritmos e Programação", "ESPECIFICO", 80, 1),
  disc("EXTES1", "Projeto de Extensão em Software I", "EXTENSAO", 80, 1),

  disc("EMPREE", "Empreendedorismo", "CORE_VIDA_CARREIRA", 60, 2),
  disc("POO", "Programação Orientada a Objetos", "ESPECIFICO", 80, 2),
  disc("BD1", "Banco de Dados I", "ESPECIFICO", 80, 2),
  disc("EDADOS", "Estrutura de Dados", "ESPECIFICO", 80, 2),
  disc("EXTES2", "Projeto de Extensão em Software II", "EXTENSAO", 80, 2),

  disc("MATDISC", "Matemática Discreta", "ESPECIFICO", 60, 3),
  disc("REQSW", "Engenharia de Requisitos", "ESPECIFICO", 80, 3),
  disc("SO", "Sistemas Operacionais", "ESPECIFICO", 80, 3),
  disc("REDES", "Redes de Computadores", "ESPECIFICO", 60, 3),
  disc("EXTES3", "Projeto de Extensão em Software III", "EXTENSAO", 80, 3),

  disc("ARQSW", "Arquitetura de Software", "ESPECIFICO", 80, 4),
  disc("ENGTES", "Teste e Qualidade de Software", "ESPECIFICO", 80, 4),
  disc("IHM", "Interface Humano-Computador", "ESPECIFICO", 60, 4),
  disc("BD2", "Banco de Dados II", "ESPECIFICO", 60, 4),
  disc("EXTES4", "Projeto de Extensão em Software IV", "EXTENSAO", 80, 4),

  disc("QUALSW", "Processos e Qualidade de Software", "ESPECIFICO", 80, 5),
  disc("WEB1", "Desenvolvimento Web I", "ESPECIFICO", 80, 5),
  disc("MOBILE", "Desenvolvimento Mobile", "ESPECIFICO", 60, 5),
  disc("SEGINFO", "Segurança da Informação", "ESPECIFICO", 60, 5),
  disc("EXTES5", "Projeto de Extensão em Software V", "EXTENSAO", 80, 5),

  disc("DEVOPS", "DevOps e Integração Contínua", "ESPECIFICO", 80, 6),
  disc("IAAP", "Inteligência Artificial Aplicada", "ESPECIFICO", 60, 6),
  disc("GESTPROJ", "Gestão de Projetos de Software", "ESPECIFICO", 60, 6),
  disc("WEB2", "Desenvolvimento Web II", "ESPECIFICO", 80, 6),
  disc("EXTES6", "Projeto de Extensão em Software VI", "EXTENSAO", 80, 6),

  disc("ESTAGSW", "Estágio Supervisionado em Software", "ESPECIFICO", 80, 7),
  disc("TCCSW1", "Trabalho de Conclusão de Curso I", "ESPECIFICO", 80, 7),
  disc("CLOUD", "Computação em Nuvem", "ESPECIFICO", 60, 7),
  disc("ARQDIST", "Arquiteturas Distribuídas", "ESPECIFICO", 60, 7),
  disc("EXTES7", "Projeto de Extensão em Software VII", "EXTENSAO", 40, 7),

  disc("TCCSW2", "Trabalho de Conclusão de Curso II", "ESPECIFICO", 80, 8),
  disc("TOPSW", "Tópicos Especiais em Software", "ESPECIFICO", 80, 8),
  disc("EMPSW", "Empreendedorismo Digital", "CORE_VIDA_CARREIRA", 60, 8),
  disc("EXTES8", "Projeto de Extensão em Software VIII", "EXTENSAO", 80, 8),
];
