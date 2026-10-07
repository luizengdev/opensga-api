import {Prisma} from "../../generated/prisma/client.js";
import {dayjs} from "../../lib/dayjs.js";
import {periodoLetivoDoCalendario} from "../../lib/periodo-letivo.js";
import {findOrCreateParametroInstitucional, updateParametroInstitucional} from "./settings-repository.js";
import type {IParametrizacoesOutput, IUpdateParametrizacoesInput} from "./settings-schemas.js";

export class SettingsError extends Error {
  readonly statusCode: 400 | 404;

  constructor(message: string, statusCode: 400 | 404) {
    super(message);
    this.name = "SettingsError";
    this.statusCode = statusCode;
  }
}

const decimalToNumber = (value: Prisma.Decimal) => Number(value);

const mapParametro = (
  row: Awaited<ReturnType<typeof findOrCreateParametroInstitucional>>,
): IParametrizacoesOutput => {
  const periodo = row.periodoAutomatico
    ? periodoLetivoDoCalendario()
    : {anoLetivo: row.anoLetivo, semestreLetivo: row.semestreLetivo};

  return {
    id: row.id,
    nomeIes: row.nomeIes,
    siglaIes: row.siglaIes,
    mantenedora: row.mantenedora,
    cnpj: row.cnpj,
    anoLetivo: periodo.anoLetivo,
    semestreLetivo: periodo.semestreLetivo,
    periodoAutomatico: row.periodoAutomatico,
    corteAprovacaoDireta: decimalToNumber(row.corteAprovacaoDireta),
    corteMediaFinal: decimalToNumber(row.corteMediaFinal),
    limiteFaltasPercentual: decimalToNumber(row.limiteFaltasPercentual),
    percentualMinimoExtensao: decimalToNumber(row.percentualMinimoExtensao),
    atualizadoEm: dayjs(row.atualizadoEm).toISOString(),
  };
};

export const fetchParametrizacoes = async () => {
  const row = await findOrCreateParametroInstitucional();
  return mapParametro(row);
};

export const changeParametrizacoes = async (input: IUpdateParametrizacoesInput) => {
  const atual = await fetchParametrizacoes();
  const corteAprovacaoDireta = input.corteAprovacaoDireta ?? atual.corteAprovacaoDireta;
  const corteMediaFinal = input.corteMediaFinal ?? atual.corteMediaFinal;

  if (corteAprovacaoDireta < corteMediaFinal) {
    throw new SettingsError("O corte de aprovação direta não pode ser inferior ao corte da média final.", 400);
  }

  const periodoAutomatico = input.periodoAutomatico ?? atual.periodoAutomatico;
  const calendario = periodoLetivoDoCalendario();
  const anoLetivo = periodoAutomatico ? calendario.anoLetivo : (input.anoLetivo ?? atual.anoLetivo);
  const semestreLetivo = periodoAutomatico
    ? calendario.semestreLetivo
    : (input.semestreLetivo ?? atual.semestreLetivo);

  const saved = await updateParametroInstitucional({
    ...(input.nomeIes !== undefined ? {nomeIes: input.nomeIes} : {}),
    ...(input.siglaIes !== undefined ? {siglaIes: input.siglaIes} : {}),
    ...(input.mantenedora !== undefined ? {mantenedora: input.mantenedora} : {}),
    ...(input.cnpj !== undefined ? {cnpj: input.cnpj} : {}),
    anoLetivo,
    semestreLetivo,
    periodoAutomatico,
    ...(input.corteAprovacaoDireta !== undefined
      ? {corteAprovacaoDireta: new Prisma.Decimal(input.corteAprovacaoDireta.toFixed(2))}
      : {}),
    ...(input.corteMediaFinal !== undefined
      ? {corteMediaFinal: new Prisma.Decimal(input.corteMediaFinal.toFixed(2))}
      : {}),
    ...(input.limiteFaltasPercentual !== undefined
      ? {limiteFaltasPercentual: new Prisma.Decimal(input.limiteFaltasPercentual.toFixed(2))}
      : {}),
    ...(input.percentualMinimoExtensao !== undefined
      ? {percentualMinimoExtensao: new Prisma.Decimal(input.percentualMinimoExtensao.toFixed(2))}
      : {}),
  });

  return mapParametro(saved);
};
