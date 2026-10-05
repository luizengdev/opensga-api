import Stripe from "stripe";

import {env} from "./env.js";

export const stripe = new Stripe(env.STRIPE_SECRET_KEY);

export const constructStripeWebhookEvent = (payload: Buffer, signature: string) => {
  return stripe.webhooks.constructEvent(payload, signature, env.STRIPE_WEBHOOK_SECRET);
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
  const product = await stripe.products.create({
    name: `${nome} — ${modalidade}`,
    metadata: {cursoId, modalidade},
  });

  const price = await stripe.prices.create({
    product: product.id,
    currency: "brl",
    unit_amount: toCents(valor),
    recurring: {interval: "month"},
    metadata: {cursoId, modalidade},
  });

  await stripe.products.update(product.id, {default_price: price.id});

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
  const price = await stripe.prices.create({
    product: stripeProductId,
    currency: "brl",
    unit_amount: toCents(valor),
    recurring: {interval: "month"},
    metadata: {cursoId, modalidade},
  });

  await stripe.prices.update(stripePriceId, {active: false});
  await stripe.products.update(stripeProductId, {default_price: price.id});

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
  await stripe.prices.update(stripePriceId, {active: ativo});
  await stripe.products.update(stripeProductId, {active: ativo});
};
