import {dayjs} from "./dayjs.js";

export const PARAMETRO_INSTITUCIONAL_ID = "00000000-0000-4000-8000-000000000001";

export const periodoLetivoDoCalendario = () => {
  const hoje = dayjs();

  return {
    anoLetivo: hoje.year(),
    semestreLetivo: hoje.month() < 6 ? 1 : 2,
  };
};
