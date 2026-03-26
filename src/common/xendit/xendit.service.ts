import { BadRequestException, Injectable } from '@nestjs/common';
import Xendit from 'xendit-node';

const xendit = new Xendit({
  secretKey: process.env.XENDIT_SECRET_KEY || '',
});

const { Invoice } = xendit;

export interface XenditInvoice {
  id?: string;
  externalId?: string;
  external_id?: string;
  status: string;
  invoiceUrl?: string;
  invoice_url?: string;
  expiryDate: Date | string;
}

export type XenditInvoicePayload = {
  externalID?: string;
  externalId?: string;
  amount: number;
} & Record<string, unknown>;

@Injectable()
export class XenditService {
  async createInvoice(data: XenditInvoicePayload): Promise<XenditInvoice> {
    const externalId = data.externalId ?? data.externalID;

    if (!externalId) {
      throw new BadRequestException(
        'externalId is required to create an invoice',
      );
    }

    const normalizedData = {
      ...data,
      externalId,
    };

    return (await Invoice.createInvoice({
      data: normalizedData,
    })) as unknown as XenditInvoice;
  }
}
