import { Body, Controller, HttpCode, HttpStatus, Post, UseGuards } from "@nestjs/common";
import { JwtAuthGuard } from "../../../common/guards/jwt.auth.guard";
import { PushSubscriptionDTO } from "../../push/dtos/subscription.push.dto";
import { PushService } from "../../push/services/push.service";

@Controller(`push`)
export class PushController {
  constructor(private readonly pushService: PushService) {}

  @UseGuards(JwtAuthGuard)
  @Post()
  @HttpCode(HttpStatus.NO_CONTENT)
  async saveSubscription(@Body() subscription: PushSubscriptionDTO): Promise<void> {
    await this.pushService.registerSubscription({ subscription: subscription });
  }
}
