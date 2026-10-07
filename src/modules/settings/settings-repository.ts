import {Prisma} from "../../generated/prisma/client.js";
import {prisma} from "../../lib/db.js";
import {PARAMETRO_INSTITUCIONAL_ID, periodoLetivoDoCalendario} from "../../lib/periodo-letivo.js";

const parametroSelect = {
  id: true,
  nomeIes: true,
  siglaIes: true,
  mantenedora: true,
  cnpj: true,
  anoLetivo: true,
  semestreLetivo: true,
  periodoAutomatico: true,
  corteAprovacaoDireta: true,
  corteMediaFinal: true,
  limiteFaltasPercentual: true,
  percentualMinimoExtensao: true,
  atualizadoEm: true,
} as const;

const defaultsDeCriacao = () => {
  const periodo = periodoLetivoDoCalendario();

  return {
    id: PARAMETRO_INSTITUCIONAL_ID,
    nomeIes: "OpenSGA",
    siglaIes: "OSGA",
    mantenedora: "",
    cnpj: "",
    anoLetivo: periodo.anoLetivo,
    semestreLetivo: periodo.semestreLetivo,
    periodoAutomatico: true,
    corteAprovacaoDireta: new Prisma.Decimal("6.00"),
    corteMediaFinal: new Prisma.Decimal("5.00"),
    limiteFaltasPercentual: new Prisma.Decimal("25.00"),
    percentualMinimoExtensao: new Prisma.Decimal("10.00"),
  };
};

export const findOrCreateParametroInstitucional = async () => {
  const existente = await prisma.parametroInstitucional.findUnique({
    where: {id: PARAMETRO_INSTITUCIONAL_ID},
    select: parametroSelect,
  });

  if (existente) {
    return existente;
  }

  return prisma.parametroInstitucional.create({
    data: defaultsDeCriacao(),
    select: parametroSelect,
  });
};

export const updateParametroInstitucional = async (data: Prisma.ParametroInstitucionalUpdateInput) => {
  return prisma.parametroInstitucional.update({
    where: {id: PARAMETRO_INSTITUCIONAL_ID},
    data,
    select: parametroSelect,
  });
};
