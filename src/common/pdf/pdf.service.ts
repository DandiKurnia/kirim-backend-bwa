import { Injectable } from '@nestjs/common';
import puppeteer from 'puppeteer-core';
import * as Handlebars from 'handlebars';
import fs from 'fs';
import path from 'path';

export interface ShipmentPdfData {
  trackingNumber: string;
  shipmentId: number;
  createdAt: Date;
  deliveryType: string;
  packageType: string;
  weight: number;
  price: number;
  distance: number;
  paymentStatus: string;
  deliveryStatus: string;

  basePrice?: number;
  weightPrice?: number;
  distancePrice?: number;

  senderName: string;
  senderPhone: string;
  pickupAddress: string;
  seederEmail: string;

  recipientName: string;
  recipientPhone: string;
  destinationAddress: string;

  qrCodePath?: string;
}

@Injectable()
export class PdfService {
  private templateCache = new Map<string, HandlebarsTemplateDelegate>();

  async generateShipmentPdf(data: ShipmentPdfData): Promise<Buffer> {
    const executablePath = this.resolveChromeExecutablePath();
    const browser = await puppeteer.launch({
      executablePath,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
      headless: true,
    });

    try {
      const page = await browser.newPage();
      const htmlContent = await this.generateShipmentPdfHtml(data);
      await page.setContent(htmlContent, { waitUntil: 'networkidle0' });
      const pdfBuffer = await page.pdf({
        format: 'A4',
        printBackground: true,
        margin: {
          top: '20px',
          right: '10px',
          bottom: '20px',
          left: '10px',
        },
      });

      return Buffer.from(pdfBuffer);
    } catch (error) {
      console.error('Error generating PDF:', error);
      throw error;
    } finally {
      await browser.close();
    }
  }

  async generateShipmentPdfHtml(data: ShipmentPdfData): Promise<string> {
    const template = await this.loadTemplate('shipping-pdf.hbs');
    const css = await this.loadCssFile('shipping-pdf.css');
    const qrCodeBase64 = data.qrCodePath
      ? this.getBase64Image(`public/${data.qrCodePath}`)
      : '';

    const templateData = {
      trankingNumber: data.trackingNumber,
      shipmentId: data.shipmentId,
      createdDate: new Date(data.createdAt).toLocaleDateString('id-ID'),
      deliveryType: data.deliveryType,
      packageType: data.packageType,
      weight: data.weight,
      price: data.price.toLocaleString('id-ID'),
      distance: data.distance,
      paymentStatus: data.paymentStatus,
      deliveryStatus: data.deliveryStatus,
      basePrice: data.basePrice?.toLocaleString('id-ID') || '0',
      weightPrice: data.weightPrice?.toLocaleString('id-ID') || '0',
      distancePrice: data.distancePrice?.toLocaleString('id-ID') || '0',
      senderName: data.senderName,
      senderPhone: data.senderPhone,
      pickupAddress: data.pickupAddress,
      seederEmail: data.seederEmail,
      recipientName: data.recipientName,
      recipientPhone: data.recipientPhone,
      destinationAddress: data.destinationAddress,
      qrCodeBase64,
      generatedDate: new Date().toLocaleDateString('id-ID'),
      styles: css,
    };

    return template(templateData);
  }

  private async loadTemplate(
    templateName: string,
  ): Promise<HandlebarsTemplateDelegate> {
    if (this.templateCache.has(templateName)) {
      return this.templateCache.get(templateName)!;
    }

    const templatePath = path.join(
      './src/common/pdf',
      'templates',
      templateName,
    );

    const templateSource = await fs.promises.readFile(templatePath, 'utf-8');
    const template = Handlebars.compile(templateSource);
    this.templateCache.set(templateName, template);
    return template;
  }

  private async loadCssFile(cssFileName: string): Promise<string> {
    const cssPath = path.join('./src/common/pdf', 'templates', cssFileName);
    return fs.promises.readFile(cssPath, 'utf-8');
  }

  private getBase64Image(imagePath: string): string {
    try {
      if (fs.existsSync(imagePath)) {
        const imageBuffer = fs.readFileSync(imagePath);
        const base64String = imageBuffer.toString('base64');
        return base64String;
      } else {
        console.warn(`QR code file not found: ${imagePath}`);
        return '';
      }
    } catch (error) {
      console.error(`Error reading QR code file: ${imagePath}`, error);
      return '';
    }
  }

  private resolveChromeExecutablePath(): string {
    const envPath =
      process.env.PUPPETEER_EXECUTABLE_PATH ||
      process.env.CHROME_EXECUTABLE_PATH;
    if (envPath && fs.existsSync(envPath)) {
      return envPath;
    }

    const candidates = [
      'C:/Program Files/Google/Chrome/Application/chrome.exe',
      'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe',
      'C:/Program Files/Microsoft/Edge/Application/msedge.exe',
      'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
      '/usr/bin/google-chrome',
      '/usr/bin/chromium-browser',
      '/usr/bin/chromium',
    ];

    const foundPath = candidates.find((candidate) => fs.existsSync(candidate));
    if (foundPath) {
      return foundPath;
    }

    throw new Error(
      'Chrome executable not found. Set PUPPETEER_EXECUTABLE_PATH (or CHROME_EXECUTABLE_PATH) to your Chrome/Chromium binary path.',
    );
  }
}
