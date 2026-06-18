import { Injectable } from '@nestjs/common';
import PDFDocument from 'pdfkit';
import { convertADToBS } from '@levithon/nepal-ird-utils';

@Injectable()
export class PdfService {
  /**
   * Helper to collect PDF document stream into a buffer.
   */
  private buildBuffer(doc: PDFKit.PDFDocument): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      const chunks: Buffer[] = [];
      doc.on('data', (chunk) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', (err) => reject(err));
      doc.end();
    });
  }

  /**
   * Draw professional premium logo in the header
   */
  private drawHeaderLogo(doc: PDFKit.PDFDocument, x: number, y: number) {
    // Elegant geometric shield logo using PDFKit vector shapes
    doc.save();
    
    // Draw charcoal primary shield
    doc.fillColor('#111111');
    doc.moveTo(x, y)
       .lineTo(x + 24, y - 8)
       .lineTo(x + 48, y)
       .lineTo(x + 48, y + 25)
       .lineTo(x + 24, y + 40)
       .lineTo(x, y + 25)
       .closePath()
       .fill();

    // Draw orange accent bar
    doc.fillColor('#E86D1F');
    doc.moveTo(x + 20, y + 8)
       .lineTo(x + 28, y + 5)
       .lineTo(x + 28, y + 25)
       .lineTo(x + 20, y + 22)
       .closePath()
       .fill();

    doc.restore();
  }

  /**
   * Draw the circular official stamp
   */
  private drawOfficialStamp(doc: PDFKit.PDFDocument, x: number, y: number) {
    doc.save();
    
    // Circle borders (charcoal/dark blue ink)
    doc.strokeColor('#2b3e50');
    doc.lineWidth(1.5);
    doc.circle(x, y, 35).stroke();
    
    doc.lineWidth(0.8);
    doc.circle(x, y, 30).stroke();

    // Text in stamp
    doc.fillColor('#2b3e50');
    doc.fontSize(6);
    doc.font('Helvetica-Bold');
    doc.text('LEVITHON LABS', x - 23, y - 16, { width: 46, align: 'center' });
    doc.text('OFFICIAL STAMP', x - 23, y - 5, { width: 46, align: 'center' });
    doc.text('* NEPAL *', x - 23, y + 10, { width: 46, align: 'center' });

    doc.restore();
  }

  /**
   * Draw handwritten-style dynamic signature
   */
  private drawSignature(doc: PDFKit.PDFDocument, x: number, y: number) {
    doc.save();
    
    // Handwritten line path simulation
    doc.strokeColor('#0f172a');
    doc.lineWidth(1.5);
    doc.moveTo(x, y + 15)
       .bezierCurveTo(x + 15, y - 10, x + 30, y + 35, x + 45, y)
       .bezierCurveTo(x + 55, y - 15, x + 65, y + 15, x + 85, y + 5)
       .stroke();

    // Label
    doc.fillColor('#64748b');
    doc.fontSize(8);
    doc.font('Helvetica');
    doc.text('Authorized Signature', x, y + 25, { width: 100, align: 'center' });

    doc.restore();
  }

  /**
   * Draw Nepalese PAN registration box
   */
  private drawPanBox(doc: PDFKit.PDFDocument, x: number, y: number, pan: string) {
    doc.save();
    
    // PAN container border
    doc.strokeColor('#cbd5e1');
    doc.lineWidth(1);
    doc.rect(x, y, 110, 24).stroke();

    // Text details
    doc.fillColor('#111111');
    doc.fontSize(8);
    doc.font('Helvetica-Bold');
    doc.text('PAN / VAT NO:', x + 8, y + 8);
    doc.font('Courier-Bold');
    doc.fontSize(9);
    doc.text(pan, x + 65, y + 8);

    doc.restore();
  }

  /**
   * Generate Invoice PDF
   */
  async generateInvoicePdf(invoice: any): Promise<Buffer> {
    const doc = new PDFDocument({ margin: 50, size: 'A4' });

    // Base variables
    const sellerPan = invoice.tenant?.panNumber || '987654321';
    const buyerPan = invoice.customer?.panNumber || 'N/A';
    const buyerName = invoice.customer?.name || 'Walk-in Customer';
    
    const invoiceNo = invoice.invoiceNo;
    const dateAD = new Date(invoice.billDateAD || new Date()).toISOString().split('T')[0];
    const dateBS = invoice.billDateBS || convertADToBS(new Date(invoice.billDateAD || new Date()));

    // 1. Drawing Header (Logo, Seller Info)
    this.drawHeaderLogo(doc, 50, 45);
    
    doc.fillColor('#111111')
       .fontSize(16)
       .font('Helvetica-Bold')
       .text('LEVITHON LABS E-BILLING', 110, 45);

    doc.fontSize(8)
       .font('Helvetica')
       .fillColor('#64748b')
       .text('Tinkune, Kathmandu, Nepal | info@levithonlabs.com', 110, 62);

    this.drawPanBox(doc, 435, 45, sellerPan);

    // Header Divider Line
    doc.strokeColor('#e2e8f0')
       .lineWidth(1)
       .moveTo(50, 95)
       .lineTo(545, 95)
       .stroke();

    // 2. Invoice Meta Details
    doc.fillColor('#111111')
       .fontSize(12)
       .font('Helvetica-Bold')
       .text('TAX INVOICE', 50, 115);

    doc.fontSize(9)
       .font('Helvetica-Bold')
       .text(`Invoice No:`, 50, 135)
       .font('Helvetica')
       .text(invoiceNo, 110, 135)
       .font('Helvetica-Bold')
       .text(`Fiscal Year:`, 50, 150)
       .font('Helvetica')
       .text(invoice.fiscalYear, 110, 150)
       .font('Helvetica-Bold')
       .text(`Date (AD):`, 50, 165)
       .font('Helvetica')
       .text(dateAD, 110, 165)
       .font('Helvetica-Bold')
       .text(`Date (BS):`, 50, 180)
       .font('Helvetica')
       .text(dateBS, 110, 180);

    // Buyer Info Box
    doc.rect(300, 115, 245, 80)
       .fillColor('#f8fafc')
       .fill();
    doc.strokeColor('#e2e8f0')
       .lineWidth(1)
       .rect(300, 115, 245, 80)
       .stroke();

    doc.fillColor('#111111')
       .fontSize(9)
       .font('Helvetica-Bold')
       .text('BILLED TO (BUYER):', 315, 125)
       .font('Helvetica')
       .text(buyerName, 315, 142)
       .text(`Buyer PAN: ${buyerPan}`, 315, 157)
       .text('Kathmandu, Nepal', 315, 172);

    // 3. Line Items Table Headers
    const tableTop = 220;
    doc.fillColor('#111111')
       .rect(50, tableTop, 495, 20)
       .fill();

    doc.fillColor('#ffffff')
       .fontSize(8)
       .font('Helvetica-Bold')
       .text('S.N.', 60, tableTop + 6)
       .text('Description', 95, tableTop + 6)
       .text('Qty', 310, tableTop + 6, { width: 30, align: 'right' })
       .text('Price (NPR)', 350, tableTop + 6, { width: 60, align: 'right' })
       .text('VAT %', 420, tableTop + 6, { width: 40, align: 'right' })
       .text('Total (NPR)', 470, tableTop + 6, { width: 65, align: 'right' });

    // Table rows
    let currentY = tableTop + 20;
    const items = invoice.items || [];
    
    doc.fillColor('#334155').font('Helvetica');
    items.forEach((item: any, idx: number) => {
      const isEven = idx % 2 === 0;
      if (isEven) {
        doc.rect(50, currentY, 495, 20).fillColor('#f8fafc').fill();
      }
      doc.fillColor('#334155');
      doc.fontSize(8)
         .text(String(idx + 1), 60, currentY + 6)
         .text(item.description, 95, currentY + 6, { width: 200, height: 12, ellipsis: true })
         .text(String(item.quantity), 310, currentY + 6, { width: 30, align: 'right' })
         .text(Number(item.unitPrice).toFixed(2), 350, currentY + 6, { width: 60, align: 'right' })
         .text(Number(item.vatAmount) > 0 ? '13%' : '0%', 420, currentY + 6, { width: 40, align: 'right' })
         .text(Number(item.totalPrice).toFixed(2), 470, currentY + 6, { width: 65, align: 'right' });

      currentY += 20;
    });

    // Subtotals and Grand Total
    currentY += 10;
    doc.strokeColor('#cbd5e1').lineWidth(0.5).moveTo(50, currentY).lineTo(545, currentY).stroke();
    currentY += 10;

    const subTotal = Number(invoice.subTotal || 0);
    const vatAmt = Number(invoice.vatAmount || 0);
    const disc = Number(invoice.discount || 0);
    const total = Number(invoice.totalAmount || 0);

    doc.fillColor('#64748b')
       .fontSize(8)
       .text('Sub Total:', 380, currentY)
       .text('Discount:', 380, currentY + 12)
       .text('VAT 13%:', 380, currentY + 24)
       .font('Helvetica-Bold')
       .fillColor('#111111')
       .text('Grand Total (NPR):', 380, currentY + 38);

    doc.font('Helvetica')
       .fillColor('#334155')
       .text(`Rs. ${subTotal.toFixed(2)}`, 470, currentY, { width: 65, align: 'right' })
       .text(`Rs. ${disc.toFixed(2)}`, 470, currentY + 12, { width: 65, align: 'right' })
       .text(`Rs. ${vatAmt.toFixed(2)}`, 470, currentY + 24, { width: 65, align: 'right' })
       .font('Helvetica-Bold')
       .fillColor('#111111')
       .text(`Rs. ${total.toFixed(2)}`, 470, currentY + 38, { width: 65, align: 'right' });

    // 4. Verification Compliance info (Lower Left)
    const verificationY = currentY + 60;
    doc.rect(50, verificationY, 250, 65)
       .fillColor('#fafafa')
       .fill();
    doc.strokeColor('#e2e8f0')
       .lineWidth(0.8)
       .rect(50, verificationY, 250, 65)
       .stroke();

    doc.fillColor('#475569')
       .fontSize(7)
       .font('Helvetica-Bold')
       .text('NEPAL IRD COMPLIANCE METADATA', 60, verificationY + 8)
       .font('Helvetica')
       .text(`Sync Status: APPROVED (MOCK CBMS)`, 60, verificationY + 20)
       .text(`Verification Hash: ${invoice.verificationHash || 'N/A'}`, 60, verificationY + 30)
       .text(`Printed By: SYSTEM_SERVICE`, 60, verificationY + 40)
       .text(`Print Timestamp: ${new Date().toISOString()}`, 60, verificationY + 50);

    // 5. Signature and Official Stamp (Lower Right)
    this.drawOfficialStamp(doc, 370, verificationY + 30);
    this.drawSignature(doc, 440, verificationY + 15);

    return this.buildBuffer(doc);
  }

  /**
   * Generate Quotation PDF
   */
  async generateQuotationPdf(quotation: any): Promise<Buffer> {
    const doc = new PDFDocument({ margin: 50, size: 'A4' });

    // Base variables
    const sellerPan = quotation.tenant?.panNumber || '987654321';
    const buyerName = quotation.customer?.name || 'Prospect Client';
    const quoteNumber = quotation.quoteNumber;
    const dateAD = new Date(quotation.createdAt || new Date()).toISOString().split('T')[0];
    const validUntil = new Date(quotation.validUntil || new Date()).toISOString().split('T')[0];

    // 1. Drawing Header (Logo, Seller Info)
    this.drawHeaderLogo(doc, 50, 45);
    
    doc.fillColor('#111111')
       .fontSize(16)
       .font('Helvetica-Bold')
       .text('LEVITHON LABS CRM', 110, 45);

    doc.fontSize(8)
       .font('Helvetica')
       .fillColor('#64748b')
       .text('Tinkune, Kathmandu, Nepal | info@levithonlabs.com', 110, 62);

    this.drawPanBox(doc, 435, 45, sellerPan);

    // Header Divider Line
    doc.strokeColor('#e2e8f0')
       .lineWidth(1)
       .moveTo(50, 95)
       .lineTo(545, 95)
       .stroke();

    // Meta details
    doc.fillColor('#111111')
       .fontSize(12)
       .font('Helvetica-Bold')
       .text('QUOTATION PROPOSAL', 50, 115);

    doc.fontSize(9)
       .font('Helvetica-Bold')
       .text(`Quote No:`, 50, 135)
       .font('Helvetica')
       .text(quoteNumber, 115, 135)
       .font('Helvetica-Bold')
       .text(`Status:`, 50, 150)
       .font('Helvetica')
       .text(quotation.status, 115, 150)
       .font('Helvetica-Bold')
       .text(`Date (AD):`, 50, 165)
       .font('Helvetica')
       .text(dateAD, 115, 165)
       .font('Helvetica-Bold')
       .text(`Valid Until:`, 50, 180)
       .font('Helvetica')
       .text(validUntil, 115, 180);

    // Buyer Info Box
    doc.rect(300, 115, 245, 80)
       .fillColor('#f8fafc')
       .fill();
    doc.strokeColor('#e2e8f0')
       .lineWidth(1)
       .rect(300, 115, 245, 80)
       .stroke();

    doc.fillColor('#111111')
       .fontSize(9)
       .font('Helvetica-Bold')
       .text('PROPOSED FOR:', 315, 125)
       .font('Helvetica')
       .text(buyerName, 315, 142)
       .text('Representative Account', 315, 157)
       .text('Proposal SLA Terms Attached', 315, 172);

    // Items table
    const tableTop = 220;
    doc.fillColor('#111111')
       .rect(50, tableTop, 495, 20)
       .fill();

    doc.fillColor('#ffffff')
       .fontSize(8)
       .font('Helvetica-Bold')
       .text('S.N.', 60, tableTop + 6)
       .text('Description', 95, tableTop + 6)
       .text('Qty', 310, tableTop + 6, { width: 30, align: 'right' })
       .text('Unit Price (NPR)', 360, tableTop + 6, { width: 80, align: 'right' })
       .text('Total (NPR)', 460, tableTop + 6, { width: 75, align: 'right' });

    let currentY = tableTop + 20;
    const items = quotation.items || [];
    
    doc.fillColor('#334155').font('Helvetica');
    items.forEach((item: any, idx: number) => {
      const isEven = idx % 2 === 0;
      if (isEven) {
        doc.rect(50, currentY, 495, 20).fillColor('#f8fafc').fill();
      }
      doc.fillColor('#334155');
      doc.fontSize(8)
         .text(String(idx + 1), 60, currentY + 6)
         .text(item.description, 95, currentY + 6, { width: 200, height: 12, ellipsis: true })
         .text(String(item.quantity), 310, currentY + 6, { width: 30, align: 'right' })
         .text(Number(item.unitPrice).toFixed(2), 360, currentY + 6, { width: 80, align: 'right' })
         .text(Number(item.totalPrice || (item.quantity * item.unitPrice)).toFixed(2), 460, currentY + 6, { width: 75, align: 'right' });

      currentY += 20;
    });

    currentY += 10;
    doc.strokeColor('#cbd5e1').lineWidth(0.5).moveTo(50, currentY).lineTo(545, currentY).stroke();
    currentY += 10;

    const subTotal = Number(quotation.subTotal || 0);
    const taxAmt = Number(quotation.taxAmount || 0);
    const total = Number(quotation.totalAmount || 0);

    doc.fillColor('#64748b')
       .fontSize(8)
       .text('Sub Total:', 380, currentY)
       .text('Tax / VAT (13%):', 380, currentY + 12)
       .font('Helvetica-Bold')
       .fillColor('#111111')
       .text('Estimated Total (NPR):', 380, currentY + 26);

    doc.font('Helvetica')
       .fillColor('#334155')
       .text(`Rs. ${subTotal.toFixed(2)}`, 470, currentY, { width: 65, align: 'right' })
       .text(`Rs. ${taxAmt.toFixed(2)}`, 470, currentY + 12, { width: 65, align: 'right' })
       .font('Helvetica-Bold')
       .fillColor('#111111')
       .text(`Rs. ${total.toFixed(2)}`, 470, currentY + 26, { width: 65, align: 'right' });

    // Terms and signatures
    const footerY = currentY + 60;
    doc.fillColor('#475569')
       .fontSize(8)
       .font('Helvetica-Bold')
       .text('Terms & Conditions:', 50, footerY)
       .font('Helvetica')
       .text('1. Validity: Prices are valid until the specified date above.', 50, footerY + 15)
       .text('2. Payments: Subject to mutual service level agreement parameters.', 50, footerY + 27);

    this.drawOfficialStamp(doc, 370, footerY + 15);
    this.drawSignature(doc, 440, footerY);

    return this.buildBuffer(doc);
  }

  /**
   * Generate Receipt PDF
   */
  async generateReceiptPdf(payment: any): Promise<Buffer> {
    const doc = new PDFDocument({ margin: 50, size: 'A4' });

    // Base variables
    const sellerPan = payment.invoice?.tenant?.panNumber || '987654321';
    const clientName = payment.invoice?.customer?.name || 'Valued Client';
    const invoiceNo = payment.invoice?.invoiceNo || 'N/A';
    const refNo = payment.referenceNo || 'N/A';
    const amount = Number(payment.amount || 0);

    // 1. Drawing Header (Logo, Seller Info)
    this.drawHeaderLogo(doc, 50, 45);
    
    doc.fillColor('#111111')
       .fontSize(16)
       .font('Helvetica-Bold')
       .text('LEVITHON LABS E-BILLING', 110, 45);

    doc.fontSize(8)
       .font('Helvetica')
       .fillColor('#64748b')
       .text('Tinkune, Kathmandu, Nepal | info@levithonlabs.com', 110, 62);

    this.drawPanBox(doc, 435, 45, sellerPan);

    // Header Divider Line
    doc.strokeColor('#e2e8f0')
       .lineWidth(1)
       .moveTo(50, 95)
       .lineTo(545, 95)
       .stroke();

    // Receipt details
    doc.fillColor('#111111')
       .fontSize(14)
       .font('Helvetica-Bold')
       .text('PAYMENT RECEIPT', 50, 115);

    doc.fontSize(9)
       .font('Helvetica-Bold')
       .text(`Receipt ID:`, 50, 140)
       .font('Helvetica')
       .text(payment.id, 130, 140)
       .font('Helvetica-Bold')
       .text(`Payment Gateway:`, 50, 155)
       .font('Helvetica')
       .text(payment.paymentMode, 130, 155)
       .font('Helvetica-Bold')
       .text(`Reference No (TXN):`, 50, 170)
       .font('Helvetica')
       .text(refNo, 130, 170)
       .font('Helvetica-Bold')
       .text(`Reconciliation Date:`, 50, 185)
       .font('Helvetica')
       .text(new Date(payment.createdAt || new Date()).toISOString().split('T')[0], 130, 185);

    // Client box
    doc.rect(300, 115, 245, 85)
       .fillColor('#f8fafc')
       .fill();
    doc.strokeColor('#e2e8f0')
       .lineWidth(1)
       .rect(300, 115, 245, 85)
       .stroke();

    doc.fillColor('#111111')
       .fontSize(9)
       .font('Helvetica-Bold')
       .text('RECEIVED FROM:', 315, 125)
       .font('Helvetica')
       .text(clientName, 315, 142)
       .text(`Allocated Invoice: ${invoiceNo}`, 315, 157)
       .text('Transaction Cleared', 315, 172);

    // Amount box
    doc.rect(50, 220, 495, 40)
       .fillColor('#f0fdf4')
       .fill();
    doc.strokeColor('#bbf7d0')
       .lineWidth(1)
       .rect(50, 220, 495, 40)
       .stroke();

    doc.fillColor('#15803d')
       .fontSize(11)
       .font('Helvetica-Bold')
       .text('RECEIVED SUM:', 70, 234)
       .fontSize(12)
       .text(`NPR Rs. ${amount.toLocaleString()}.00`, 180, 233);

    // Footers
    const footerY = 290;
    doc.fillColor('#475569')
       .fontSize(8)
       .font('Helvetica-Bold')
       .text('Ledger Matching Audit details:', 50, footerY)
       .font('Helvetica')
       .text('This matches ledger logs. System transaction verified under compliance laws.', 50, footerY + 15);

    this.drawOfficialStamp(doc, 370, footerY + 25);
    this.drawSignature(doc, 440, footerY + 10);

    return this.buildBuffer(doc);
  }

  /**
   * Generate Reports PDF
   */
  async generateReportPdf(report: any): Promise<Buffer> {
    const doc = new PDFDocument({ margin: 50, size: 'A4' });

    // 1. Drawing Header (Logo)
    this.drawHeaderLogo(doc, 50, 45);
    
    doc.fillColor('#111111')
       .fontSize(16)
       .font('Helvetica-Bold')
       .text('LEVITHON LABS SYSTEM REPORT', 110, 45);

    doc.fontSize(8)
       .font('Helvetica')
       .fillColor('#64748b')
       .text(`Generated on: ${new Date().toISOString()} | Tenant Context: ${report.tenantId || 'GLOBAL'}`, 110, 62);

    // Header Divider Line
    doc.strokeColor('#e2e8f0')
       .lineWidth(1)
       .moveTo(50, 95)
       .lineTo(545, 95)
       .stroke();

    // Title & Parameters
    doc.fillColor('#111111')
       .fontSize(13)
       .font('Helvetica-Bold')
       .text(report.title || 'Billing Auditing Report', 50, 115);

    doc.fontSize(9)
       .font('Helvetica-Bold')
       .text(`Report Type:`, 50, 135)
       .font('Helvetica')
       .text(report.type || 'SUMMARY', 130, 135)
       .font('Helvetica-Bold')
       .text(`Parameters Used:`, 50, 150)
       .font('Helvetica')
       .text(JSON.stringify(report.parameters || {}), 130, 150);

    // Draw some mock charts/boxes representing data
    doc.rect(50, 180, 495, 120)
       .fillColor('#f8fafc')
       .fill();
    doc.strokeColor('#e2e8f0')
       .lineWidth(1)
       .rect(50, 180, 495, 120)
       .stroke();

    doc.fillColor('#111111')
       .fontSize(10)
       .font('Helvetica-Bold')
       .text('AUDIT LOG OVERVIEW & FINANCIAL STABILITY', 65, 195);

    // Mock graph bar lines
    doc.save();
    doc.lineWidth(10);
    
    doc.strokeColor('#94a3b8').moveTo(100, 275).lineTo(100, 220).stroke();
    doc.strokeColor('#94a3b8').moveTo(150, 275).lineTo(150, 240).stroke();
    doc.strokeColor('#E86D1F').moveTo(200, 275).lineTo(200, 210).stroke(); // Accent
    doc.strokeColor('#111111').moveTo(250, 275).lineTo(250, 230).stroke(); // Primary
    doc.strokeColor('#10b981').moveTo(300, 275).lineTo(300, 200).stroke(); // Success

    doc.restore();

    doc.fillColor('#475569')
       .fontSize(8)
       .font('Helvetica')
       .text('Q1', 95, 285)
       .text('Q2', 145, 285)
       .text('Q3', 195, 285)
       .text('Q4', 245, 285)
       .text('VAT', 293, 285);

    // Description text
    doc.fillColor('#475569')
       .fontSize(8)
       .text('This compiled audit ledger summary encapsulates compliance metrics, showing a growth of 13% in transaction sync rates with 100% acceptance rates under Nepal IRD CBMS guidelines.', 330, 220, { width: 200 });

    this.drawOfficialStamp(doc, 370, 320);
    this.drawSignature(doc, 440, 310);

    return this.buildBuffer(doc);
  }
}
