import { Injectable } from '@nestjs/common';
import * as nodemailer from 'nodemailer';
import { readFileSync } from 'fs';
import { compile } from 'handlebars';
import path from 'path';

@Injectable()
export class EmailService {
  private readonly transporter: nodemailer.Transporter;
  private templatePath: string;

  constructor() {
    this.transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT || '587', 10),
      secure: false,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASSWORD,
      },
    });
    this.templatePath = path.join('./src/common/email/templates');
  }

  private loadTemplate(templateName: string): string {
    const templatePath = path.join(this.templatePath, `${templateName}.hbs`);
    return readFileSync(templatePath, 'utf-8');
  }

  private compileTemplate(
    templateName: string,
    data: Record<string, unknown>,
  ): string {
    const templateSource = this.loadTemplate(templateName);
    const compiledTemplate = compile(templateSource);
    return compiledTemplate(data);
  }

  async testingEmail(to: string): Promise<void> {
    const templateData = {
      title: 'Test Email',
      message: 'This is a test email sent from the EmailService.',
    };

    const htmlContent = this.compileTemplate('test-email', templateData);

    await this.transporter.sendMail({
      from: process.env.SMTP_EMAIL_SENDER,
      to,
      subject: 'Test Email from EmailService',
      html: htmlContent,
    });
  }

  async sendEmailPaymentNotification(
    to: string,
    paymentUrl: string,
    shipmentId: number,
    amount: number,
    expiryDate: Date,
  ): Promise<void> {
    const templateData = {
      shipmentId,
      paymentUrl,
      amount: amount.toLocaleString('id-ID'),
      expiryDate: expiryDate.toDateString(),
    };

    const htmlContent = this.compileTemplate(
      'payment-notification',
      templateData,
    );

    const mailOptions = {
      from: process.env.SMTP_EMAIL_SENDER || '',
      to,
      subject: `Payment Notification for Shipment #${shipmentId}`,
      html: htmlContent,
    };

    await this.transporter.sendMail(mailOptions);
  }

  async sendPaymentSuccess(
    to: string,
    shipmentId: number,
    amount: number,
    trackingNumber?: string,
  ): Promise<void> {
    const templateData = {
      shipmentId,
      amount: amount.toLocaleString('id-ID'),
      paymentDate: new Date().toDateString(),
      trackingNumber,
    };

    const html = this.compileTemplate('payment-success', templateData);

    const mailOptions = {
      from: process.env.SMTP_EMAIL_SENDER || '',
      to,
      subject: `Payment Success for Shipment #${shipmentId}`,
      html,
    };
    await this.transporter.sendMail(mailOptions);
  }
}
