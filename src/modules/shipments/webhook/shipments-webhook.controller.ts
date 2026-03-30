import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { ShipmentsService } from '../shipments.service';
import { XenditWebhookDto } from '../dto/xendit-webhook.dto';

@Controller('shipments/webhook')
export class ShipmentsWebhookController {
  constructor(private readonly shipmentsService: ShipmentsService) {}

  @Post('xendit')
  @HttpCode(HttpStatus.OK)
  async handleXenditWebhook(
    @Body() webhookData: XenditWebhookDto,
  ): Promise<{ message: string }> {
    // Implementation for handling Xendit webhook
    await this.shipmentsService.handlePaymentWebhook(webhookData);
    return { message: 'Webhook received successfully' };
  }
}
