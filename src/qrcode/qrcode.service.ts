import { Injectable } from '@nestjs/common';
import { existsSync, mkdirSync } from 'fs';
import { join } from 'path';
import * as QRCode from 'qrcode';

@Injectable()
export class QrCodeService {
  private readonly uploadPath = 'public/uploads/qrcodes';

  constructor() {
    if (!existsSync(this.uploadPath)) {
      mkdirSync(this.uploadPath, { recursive: true });
    }
  }

  async generateQrCode(trackingNumber: string): Promise<string> {
    try {
      const fileName = `${trackingNumber}_${Date.now()}.png`;
      const filePath = join(this.uploadPath, fileName);

      await QRCode.toFile(filePath, trackingNumber);

      return `uploads/qrcodes/${fileName}`;
    } catch (error) {
      console.error('Error generating QR code:', error);
      throw new Error(
        'Failed to generate QR code for tracking number: ' + trackingNumber,
      );
    }
  }
}
