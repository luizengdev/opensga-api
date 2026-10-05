import Stripe from "stripe";

import {Prisma} from "../../generated/prisma/client.js";
import {StatusFatura} from "../../generated/prisma/enums.js";
import {dayjs} from "../../lib/dayjs.js";
import {env} from "../../lib/env.js";
import {EnrollmentError, ensureCandidateForCheckout} from "../enrollment/enrollment-service.js";
import {
  createStripeEnrollmentCheckoutSession,
  createStripeTuitionCatalog,
  retrieveEnrollmentCoupon,
  retrieveStripeSubscriptionMetadata,
  rotateStripeTuitionPrice,
  setStripeTuitionCatalogActive,
} from "../../lib/stripe.js";
import {
  activateMatriculaByAlunoAndCurso,
  deleteFaturaById,
  deletePrecoCursoById,
  findAlunoById,
  findCursoForCheckout,
  findFaturaById,
  findPrecoCursoAtivoByCursoId,
  findPrecoCursoByCursoId,
  findPrecoCursoById,
  insertFatura,
  insertPrecoCurso,
  listCatalogoCursos,
  listFaturas,
  listPrecosCurso,
  updateFaturaStatusById,
  updatePrecoCursoById,
  upsertFaturaFromStripeInvoice,
} from "./financial-repository.js";
import type {
  ICatalogoCurso,
  ICreateCheckoutInput,
  ICreateFaturaInput,
  ICreatePublicInscricaoInput,
  ICreatePrecoCursoInput,
  IFaturaOutput,
  IListFaturasQuery,
  IListPrecosQuery,
  IPrecoCursoOutput,
  IUpdateFaturaStatusInput,
  IUpdatePrecoCursoInput,
} from "./financial-schemas.js";

export class FinancialError extends Error {
  readonly statusCode: 400 | 404 | 409;

  constructor(message: string, statusCode: 400 | 404 | 409) {
    super(message);
    this.name = "FinancialError";
    this.statusCode = statusCode;
  }
}

const mapFatura = (fatura: {
  id: string;
  alunoId: string;
  descricao: string;
  valor: Prisma.Decimal;
  dataVencimento: Date;
  status: StatusFatura;
  stripeInvoiceId: string | null;
  stripePaymentUrl: string | null;
  pagoEm: Date | null;
  aluno: IFaturaOutput["aluno"];
}): IFaturaOutput => {
  return {
    id: fatura.id,
    alunoId: fatura.alunoId,
    descricao: fatura.descricao,
    valor: Number(fatura.valor),
    dataVencimento: dayjs(fatura.dataVencimento).toISOString(),
    status: fatura.status,
    stripeInvoiceId: fatura.stripeInvoiceId,
    stripePaymentUrl: fatura.stripePaymentUrl,
    pagoEm: fatura.pagoEm ? dayjs(fatura.pagoEm).toISOString() : null,
    aluno: fatura.aluno,
  };
};

export const fetchFaturas = async (query: IListFaturasQuery) => {
  const faturas = await listFaturas(query);
  return faturas.map(mapFatura);
};

export const fetchFaturaById = async (id: string) => {
  const fatura = await findFaturaById(id);

  if (!fatura) {
    throw new FinancialError("Fatura não encontrada.", 404);
  }

  return mapFatura(fatura);
};

export const createNewFatura = async (input: ICreateFaturaInput) => {
  const aluno = await findAlunoById(input.alunoId);

  if (!aluno) {
    throw new FinancialError("Aluno informado não existe.", 404);
  }

  const fatura = await insertFatura(input);
  return mapFatura(fatura);
};

export const changeFaturaStatus = async ({id, data}: {id: string; data: IUpdateFaturaStatusInput}) => {
  const pagoEm =
    data.status === StatusFatura.PAGA ? (data.pagoEm ? dayjs(data.pagoEm).toDate() : dayjs().toDate()) : (null);

  const fatura = await updateFaturaStatusById({id, status: data.status, pagoEm});

  if (!fatura) {
    throw new FinancialError("Fatura não encontrada.", 404);
  }

  return mapFatura(fatura);
};

export const removeFatura = async (id: string) => {
  const deleted = await deleteFaturaById(id);

  if (!deleted) {
    throw new FinancialError("Fatura não encontrada.", 404);
  }

  return deleted;
};

interface ICheckoutMetadata {
  studentId?: string;
  cursoId?: string;
}

const readCheckoutMetadata = (metadata: Stripe.Metadata | null | undefined): ICheckoutMetadata => {
  if (!metadata) {
    return {};
  }

  return {
    studentId: metadata.studentId,
    cursoId: metadata.cursoId,
  };
};

const toReais = (valor: Prisma.Decimal) => Number(valor);

const mapPrecoCurso = (preco: {
  id: string;
  cursoId: string;
  valor: Prisma.Decimal;
  moeda: string;
  intervalo: IPrecoCursoOutput["intervalo"];
  stripeProductId: string;
  stripePriceId: string;
  ativo: boolean;
  criadoEm: Date;
  atualizadoEm: Date;
  curso: IPrecoCursoOutput["curso"];
}): IPrecoCursoOutput => {
  return {
    id: preco.id,
    cursoId: preco.cursoId,
    valor: toReais(preco.valor),
    moeda: preco.moeda,
    intervalo: preco.intervalo,
    stripeProductId: preco.stripeProductId,
    stripePriceId: preco.stripePriceId,
    ativo: preco.ativo,
    criadoEm: dayjs(preco.criadoEm).toISOString(),
    atualizadoEm: dayjs(preco.atualizadoEm).toISOString(),
    curso: preco.curso,
  };
};

const getInvoiceSubscriptionId = (invoice: Stripe.Invoice): string | null => {
  const parent = invoice.parent;

  if (parent?.type !== "subscription_details") {
    return null;
  }

  const subscription = parent.subscription_details?.subscription;

  if (typeof subscription === "string") {
    return subscription;
  }

  if (subscription && typeof subscription === "object" && "id" in subscription) {
    return subscription.id;
  }

  return null;
};

const resolveStudentContextFromInvoice = async (invoice: Stripe.Invoice): Promise<ICheckoutMetadata> => {
  const fromInvoice = readCheckoutMetadata(invoice.metadata);

  if (fromInvoice.studentId) {
    return fromInvoice;
  }

  const parent = invoice.parent;

  if (parent?.type === "subscription_details") {
    const fromParent = readCheckoutMetadata(parent.subscription_details?.metadata);

    if (fromParent.studentId) {
      return fromParent;
    }
  }

  const subscriptionId = getInvoiceSubscriptionId(invoice);

  if (!subscriptionId) {
    return {};
  }

  const metadata = await retrieveStripeSubscriptionMetadata(subscriptionId);
  return readCheckoutMetadata(metadata);
};

const syncFaturaFromInvoice = async ({
  invoice,
  status,
}: {
  invoice: Stripe.Invoice;
  status: StatusFatura;
}) => {
  const {studentId} = await resolveStudentContextFromInvoice(invoice);

  if (!studentId) {
    return;
  }

  const aluno = await findAlunoById(studentId);

  if (!aluno) {
    return;
  }

  const amountInCents = status === StatusFatura.PAGA ? invoice.amount_paid : invoice.amount_due;
  const firstLine = invoice.lines.data[0];
  const pagoEm = status === StatusFatura.PAGA ? dayjs().toDate() : null;

  await upsertFaturaFromStripeInvoice({
    alunoId: studentId,
    descricao: invoice.description ?? firstLine?.description ?? "Mensalidade acadêmica",
    valor: amountInCents / 100,
    dataVencimento: invoice.due_date ? dayjs.unix(invoice.due_date).toDate() : dayjs().toDate(),
    status,
    stripeInvoiceId: invoice.id,
    stripePaymentUrl: invoice.hosted_invoice_url ?? null,
    pagoEm,
  });
};

const computeAmountDueNowCents = ({
  coupon,
  priceReais,
}: {
  coupon: {
    amountOffCents: number | null;
    percentOff: number | null;
  } | null;
  priceReais: number;
}) => {
  const priceCents = Math.round(priceReais * 100);

  if (!coupon) {
    return priceCents;
  }

  if (coupon.percentOff !== null) {
    return Math.max(0, priceCents - Math.round((priceCents * coupon.percentOff) / 100));
  }

  if (coupon.amountOffCents !== null) {
    return Math.max(0, priceCents - coupon.amountOffCents);
  }

  return priceCents;
};

const scheduleNextCycleTuition = async ({
  alunoId,
  cursoNome,
  valor,
}: {
  alunoId: string;
  cursoNome: string;
  valor: number;
}) => {
  if (valor <= 0) {
    return;
  }

  const existing = await listFaturas({alunoId, status: StatusFatura.PENDENTE});
  const hasLocalTuition = existing.some((fatura) => fatura.stripeInvoiceId === null);

  if (hasLocalTuition) {
    return;
  }

  await insertFatura({
    alunoId,
    descricao: `Mensalidade — ${cursoNome}`,
    valor,
    dataVencimento: dayjs().add(1, "month").format("YYYY-MM-DD"),
  });
};

const shouldActivateEnrollmentFromSession = (session: Stripe.Checkout.Session) => {
  return session.payment_status === "paid";
};

export const createEnrollmentCheckout = async (input: ICreateCheckoutInput) => {
  const aluno = await findAlunoById(input.studentId);

  if (!aluno) {
    throw new FinancialError("Aluno informado não existe.", 404);
  }

  const curso = await findCursoForCheckout(input.cursoModalidadeId);

  if (!curso) {
    throw new FinancialError("Curso/modalidade informado não existe.", 404);
  }

  const preco = await findPrecoCursoAtivoByCursoId(curso.id);

  if (!preco) {
    throw new FinancialError("Curso sem precificação ativa cadastrada.", 400);
  }

  const monthlyValue = toReais(preco.valor);
  const coupon = await retrieveEnrollmentCoupon(env.STRIPE_INSCRICAO_COUPON_ID);
  const amountDueNowCents = computeAmountDueNowCents({
    coupon,
    priceReais: monthlyValue,
  });

  if (amountDueNowCents <= 0) {
    await scheduleNextCycleTuition({
      alunoId: aluno.id,
      cursoNome: curso.nome,
      valor: monthlyValue,
    });

    return {
      url: null,
      sessionId: null,
      requiresCheckout: false,
      status: "PRE_MATRICULADO" as const,
      acesso: null,
    };
  }

  const session = await createStripeEnrollmentCheckoutSession({
    couponId: coupon?.id ?? null,
    cursoId: curso.id,
    email: input.email,
    stripePriceId: preco.stripePriceId,
    studentId: input.studentId,
  });

  if (!session.url) {
    throw new FinancialError("Não foi possível gerar a URL de checkout.", 400);
  }

  return {
    url: session.url,
    sessionId: session.sessionId,
    requiresCheckout: true,
    status: "AGUARDANDO_PAGAMENTO" as const,
    acesso: null,
  };
};

const inferTipoGraduacao = (nome: string, duracaoSemestres: number): ICatalogoCurso["tipoGraduacao"] => {
  const normalized = nome.toLowerCase();

  if (normalized.includes("pedagogia") || normalized.includes("licenciatura")) {
    return "LICENCIATURA";
  }

  if (
    duracaoSemestres <= 6 ||
    normalized.includes("análise e desenvolvimento") ||
    normalized.includes("gestão de ti") ||
    normalized.includes("marketing")
  ) {
    return "TECNOLOGO";
  }

  return "BACHARELADO";
};

export const fetchCatalogoCursos = async (): Promise<ICatalogoCurso[]> => {
  const ofertas = await listCatalogoCursos();

  return ofertas.map((oferta) => ({
    cursoId: oferta.curso.id,
    nome: oferta.curso.nome,
    modalidade: oferta.curso.modalidade,
    tipoGraduacao: inferTipoGraduacao(oferta.curso.nome, oferta.curso.duracaoSemestres),
    duracaoSemestres: oferta.curso.duracaoSemestres,
    campus: oferta.curso.campus,
    valor: toReais(oferta.valor),
    moeda: oferta.moeda,
    intervalo: oferta.intervalo,
  }));
};

export const createPublicInscricaoCheckout = async (input: ICreatePublicInscricaoInput) => {
  try {
    const candidate = await ensureCandidateForCheckout({
      nome: input.nome,
      email: input.email,
      cpf: input.cpf,
      telefone: input.telefone,
      dataNascimento: input.dataNascimento,
      cursoId: input.cursoModalidadeId,
    });

    const checkout = await createEnrollmentCheckout({
      studentId: candidate.alunoId,
      email: input.email,
      cursoModalidadeId: input.cursoModalidadeId,
    });

    return {
      ...checkout,
      acesso: {
        email: input.email.trim().toLowerCase(),
        ra: candidate.ra,
        senhaProvisoria: candidate.senhaProvisoria,
      },
    };
  } catch (error) {
    if (error instanceof EnrollmentError) {
      throw new FinancialError(error.message, error.statusCode);
    }

    throw error;
  }
};

export const markStudentAsEnrolled = async (metadata: Stripe.Metadata | null) => {
  const {studentId, cursoId} = readCheckoutMetadata(metadata);

  if (!studentId) {
    return;
  }

  await activateMatriculaByAlunoAndCurso({
    alunoId: studentId,
    cursoId,
  });
};

export const processStripeWebhookEvent = async (event: Stripe.Event) => {
  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object;

      if (!shouldActivateEnrollmentFromSession(session)) {
        return;
      }

      await markStudentAsEnrolled(session.metadata);
      return;
    }
    case "checkout.session.async_payment_succeeded": {
      const session = event.data.object;
      await markStudentAsEnrolled(session.metadata);
      return;
    }
    case "checkout.session.async_payment_failed": {
      return;
    }
    case "invoice.payment_succeeded": {
      await syncFaturaFromInvoice({
        invoice: event.data.object,
        status: StatusFatura.PAGA,
      });
      return;
    }
    case "invoice.payment_failed": {
      await syncFaturaFromInvoice({
        invoice: event.data.object,
        status: StatusFatura.ATRASADA,
      });
      return;
    }
    default:
      return;
  }
};

export const fetchPrecosCurso = async (query: IListPrecosQuery) => {
  const precos = await listPrecosCurso(query);
  return precos.map(mapPrecoCurso);
};

export const fetchPrecoCursoById = async (id: string) => {
  const preco = await findPrecoCursoById(id);

  if (!preco) {
    throw new FinancialError("Preço do curso não encontrado.", 404);
  }

  return mapPrecoCurso(preco);
};

export const createNewPrecoCurso = async (input: ICreatePrecoCursoInput) => {
  const curso = await findCursoForCheckout(input.cursoId);

  if (!curso) {
    throw new FinancialError("Curso informado não existe.", 404);
  }

  const existing = await findPrecoCursoByCursoId(input.cursoId);

  if (existing) {
    throw new FinancialError("Já existe precificação cadastrada para este curso/modalidade.", 409);
  }

  const catalog = await createStripeTuitionCatalog({
    cursoId: curso.id,
    modalidade: curso.modalidade,
    nome: curso.nome,
    valor: input.valor,
  });

  const preco = await insertPrecoCurso({
    cursoId: curso.id,
    valor: input.valor,
    stripeProductId: catalog.stripeProductId,
    stripePriceId: catalog.stripePriceId,
  });

  return mapPrecoCurso(preco);
};

export const changePrecoCurso = async ({id, data}: {id: string; data: IUpdatePrecoCursoInput}) => {
  const current = await findPrecoCursoById(id);

  if (!current) {
    throw new FinancialError("Preço do curso não encontrado.", 404);
  }

  let stripePriceId = current.stripePriceId;

  if (data.valor !== undefined && data.valor !== toReais(current.valor)) {
    const rotated = await rotateStripeTuitionPrice({
      cursoId: current.cursoId,
      modalidade: current.curso.modalidade,
      stripePriceId: current.stripePriceId,
      stripeProductId: current.stripeProductId,
      valor: data.valor,
    });
    stripePriceId = rotated.stripePriceId;
  }

  if (data.ativo !== undefined && data.ativo !== current.ativo) {
    await setStripeTuitionCatalogActive({
      ativo: data.ativo,
      stripePriceId,
      stripeProductId: current.stripeProductId,
    });
  }

  const preco = await updatePrecoCursoById({
    id,
    valor: data.valor,
    ativo: data.ativo,
    stripePriceId,
  });

  if (!preco) {
    throw new FinancialError("Preço do curso não encontrado.", 404);
  }

  return mapPrecoCurso(preco);
};

export const removePrecoCurso = async (id: string) => {
  const current = await findPrecoCursoById(id);

  if (!current) {
    throw new FinancialError("Preço do curso não encontrado.", 404);
  }

  await setStripeTuitionCatalogActive({
    ativo: false,
    stripePriceId: current.stripePriceId,
    stripeProductId: current.stripeProductId,
  });

  const deleted = await deletePrecoCursoById(id);

  if (!deleted) {
    throw new FinancialError("Preço do curso não encontrado.", 404);
  }

  return deleted;
};
