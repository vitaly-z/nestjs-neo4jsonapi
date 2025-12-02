import { Controller, Get, Param, Query, Req, Res } from "@nestjs/common";
import { FastifyReply } from "fastify";

import { AuthenticatedRequest } from "../../../common/interfaces/authenticated.request.interface";
import { auditMeta } from "../../audit/entities/audit.meta";
import { AuditService } from "../../audit/services/audit.service";
import { userMeta } from "../../user/entities/user.meta";

@Controller()
export class AuditController {
  constructor(private readonly auditService: AuditService) {}

  @Get(`${userMeta.endpoint}/:userId/${auditMeta.endpoint}`)
  async findAccounts(
    @Req() req: AuthenticatedRequest,
    @Res() reply: FastifyReply,
    @Query() query: any,
    @Param("userId") userId: string,
  ) {
    const response = await this.auditService.findByUser({
      userId: userId,
      query: query,
    });

    reply.send(response);
  }
}
