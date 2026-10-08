import Stripe from "stripe";

import {env} from "./env.js";

let stripeClient: Stripe | undefined;

const getStripe = () => {
  if (env.STRIPE_SECRET_KEY.length === 0) {
    throw new Error("Stripe não configurado. Defina STRIPE_SECRET_KEY.");
  }

  stripeClient ??= new Stripe(env.STRIPE_SECRET_KEY);
  return stripeClient;
};

export const constructStripeWebhookEvent = (payload: Buffer, signature: string) => {
  return getStripe().webhooks.constructEvent(payload, signature, env.STRIPE_WEBHOOK_SECRET);
};

const toCents = (valor: number) => Math.round(valor * 100);

export const createStripeTuitionCatalog = async ({
  cursoId,
  modalidade,
  nome,
  valor,
}: {
  cursoId: string;
  modalidade: string;
  nome: string;
  valor: number;
}) => {
  const product = await getStripe().products.create({
    name: `${nome} — ${modalidade}`,
    metadata: {cursoId, modalidade},
  });

  const price = await getStripe().prices.create({
    product: product.id,
    currency: "brl",
    unit_amount: toCents(valor),
    recurring: {interval: "month"},
    metadata: {cursoId, modalidade},
  });

  await getStripe().products.update(product.id, {default_price: price.id});

  return {
    stripeProductId: product.id,
    stripePriceId: price.id,
  };
};

export const rotateStripeTuitionPrice = async ({
  cursoId,
  modalidade,
  stripePriceId,
  stripeProductId,
  valor,
}: {
  cursoId: string;
  modalidade: string;
  stripePriceId: string;
  stripeProductId: string;
  valor: number;
}) => {
  const price = await getStripe().prices.create({
    product: stripeProductId,
    currency: "brl",
    unit_amount: toCents(valor),
    recurring: {interval: "month"},
    metadata: {cursoId, modalidade},
  });

  await getStripe().prices.update(stripePriceId, {active: false});
  await getStripe().products.update(stripeProductId, {default_price: price.id});

  return {stripePriceId: price.id};
};

export const setStripeTuitionCatalogActive = async ({
  ativo,
  stripePriceId,
  stripeProductId,
}: {
  ativo: boolean;
  stripePriceId: string;
  stripeProductId: string;
}) => {
  await getStripe().prices.update(stripePriceId, {active: ativo});
  await getStripe().products.update(stripeProductId, {active: ativo});
};

export const retrieveEnrollmentCoupon = async (couponId: string) => {
  try {
    const coupon = await getStripe().coupons.retrieve(couponId);

    if (!coupon.valid) {
      return null;
    }

    return {
      id: coupon.id,
      percentOff: coupon.percent_off ?? null,
      amountOffCents: coupon.amount_off ?? null,
    };
  } catch {
    return null;
  }
};

export const createStripeEnrollmentCheckoutSession = async ({
  couponId,
  cursoId,
  email,
  stripePriceId,
  studentId,
}: {
  couponId: string | null;
  cursoId: string;
  email: string;
  stripePriceId: string;
  studentId: string;
}) => {
  const metadata = {studentId, cursoId};

  const session = await getStripe().checkout.sessions.create({
    mode: "subscription",
    customer_email: email,
    client_reference_id: studentId,
    line_items: [{price: stripePriceId, quantity: 1}],
    ...(couponId ? {discounts: [{coupon: couponId}]} : {}),
    allowed_payment_method_types: ["card", "boleto"],
    payment_method_options: {
      boleto: {
        expires_after_days: 3,
      },
    },
    billing_address_collection: "required",
    tax_id_collection: {enabled: true},
    locale: "pt-BR",
    success_url: `${env.FRONTEND_URL}/inscricao?checkout=success`,
    cancel_url: `${env.FRONTEND_URL}/inscricao?checkout=cancel`,
    metadata,
    subscription_data: {
      metadata,
    },
  });

  return {
    url: session.url,
    sessionId: session.id,
  };
};

export const retrieveStripeSubscriptionMetadata = async (subscriptionId: string) => {
  const subscription = await getStripe().subscriptions.retrieve(subscriptionId);
  return subscription.metadata;
};
