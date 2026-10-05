import {FastifyInstance} from "fastify";

import {stripeWebhookHandler} from "./financial-controller.js";
import {errorResponseSchema, webhookReceivedResponseSchema} from "./financial-schemas.js";

export const stripeWebhookRoutes = async (app: FastifyInstance): Promise<void> => {
  app.removeContentTypeParser("application/json");
  app.addContentTypeParser("application/json", {parseAs: "buffer"}, (_request, body, done) => {
    done(null, body);
  });

  app.post(
    "/webhooks/stripe",
    {
      schema: {
        tags: ["Financeiro"],
        summary: "Receber eventos Stripe em payload raw; ativar matrícula só após pagamento (boleto assíncrono)",
        response: {
          200: webhookReceivedResponseSchema,
          400: errorResponseSchema,
          500: errorResponseSchema,
        },
      },
    },
    stripeWebhookHandler,
  );
};
