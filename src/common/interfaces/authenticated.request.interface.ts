import { FastifyRequest } from "fastify";

export interface AuthenticatedUser {
  userId: string;
  companyId: string;
  roles: string[];
  language?: string;
}

export interface AuthenticatedRequest extends FastifyRequest {
  user: AuthenticatedUser;
}

export interface OptionalAuthenticatedRequest extends FastifyRequest {
  user?: AuthenticatedUser;
}
