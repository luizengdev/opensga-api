import {FastifyReply, FastifyRequest} from "fastify";

import type {IDashboardPeriodQuery} from "./dashboard-schemas.js";
import {fetchAdminDashboard, fetchProfessorDashboard} from "./dashboard-service.js";

export const getAdminDashboardHandler = async (
  request: FastifyRequest<{Querystring: IDashboardPeriodQuery}>,
  reply: FastifyReply,
) => {
  const dashboard = await fetchAdminDashboard(request.query);
  return reply.status(200).send(dashboard);
};

export const getProfessorDashboardHandler = async (
  request: FastifyRequest<{Querystring: IDashboardPeriodQuery}>,
  reply: FastifyReply,
) => {
  const dashboard = await fetchProfessorDashboard({
    ...request.query,
    actorUserId: request.user.sub,
  });
  return reply.status(200).send(dashboard);
};
