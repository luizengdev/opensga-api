export type TipoComponenteSeed = "CORE_VIDA_CARREIRA" | "ESPECIFICO" | "EXTENSAO";
export type TipoEntregaSeed = "PRESENCIAL_FISICO" | "SINCRONO_MEDIADO" | "ASSINCRONO_DIGITAL";

export interface ILinhaMatrizSeed {
  codigo: string;
  nome: string;
  tipo: TipoComponenteSeed;
  tipoEntrega: TipoEntregaSeed;
  semestreIdeal: number;
  chTotal: number;
  chPresencial: number;
  chSincrona: number;
  chAssincrona: number;
  chExtensao: number;
}

const chExtensaoDe = (tipo: TipoComponenteSeed, chTotal: number) => {
  return tipo === "EXTENSAO" ? chTotal : 0;
};

export const linhaPresencial = ({
  codigo,
  nome,
  tipo,
  semestreIdeal,
  chTotal,
}: {
  codigo: string;
  nome: string;
  tipo: TipoComponenteSeed;
  semestreIdeal: number;
  chTotal: number;
}): ILinhaMatrizSeed => {
  return {
    codigo,
    nome,
    tipo,
    tipoEntrega: "PRESENCIAL_FISICO",
    semestreIdeal,
    chTotal,
    chPresencial: chTotal,
    chSincrona: 0,
    chAssincrona: 0,
    chExtensao: chExtensaoDe(tipo, chTotal),
  };
};

const parcelasEad = (chTotal: number) => {
  if (chTotal === 40) {
    return {chPresencial: 6, chSincrona: 8, chAssincrona: 26};
  }

  if (chTotal === 80) {
    return {chPresencial: 10, chSincrona: 16, chAssincrona: 54};
  }

  return {chPresencial: 8, chSincrona: 12, chAssincrona: 40};
};

export const linhaEad = ({
  codigo,
  nome,
  tipo,
  semestreIdeal,
  chTotal,
}: {
  codigo: string;
  nome: string;
  tipo: TipoComponenteSeed;
  semestreIdeal: number;
  chTotal: number;
}): ILinhaMatrizSeed => {
  const parcelas = parcelasEad(chTotal);
  const tipoEntrega: TipoEntregaSeed =
    tipo === "CORE_VIDA_CARREIRA" ? "SINCRONO_MEDIADO" : "ASSINCRONO_DIGITAL";

  return {
    codigo,
    nome,
    tipo,
    tipoEntrega,
    semestreIdeal,
    chTotal,
    ...parcelas,
    chExtensao: chExtensaoDe(tipo, chTotal),
  };
};
