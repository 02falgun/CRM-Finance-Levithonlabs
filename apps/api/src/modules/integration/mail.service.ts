import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import nodemailer from 'nodemailer';

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  private transporter: nodemailer.Transporter | null = null;

  constructor(private readonly config: ConfigService) {
    this.initializeTransporter();
  }

  /**
   * Initializes the SMTP transporter or maps it to SendGrid's SMTP Relay.
   */
  private initializeTransporter() {
    const sendgridApiKey = this.config.get<string>('SENDGRID_API_KEY');
    const sendgridFromEmail = this.config.get<string>('SENDGRID_FROM_EMAIL');

    const smtpHost = this.config.get<string>('SMTP_HOST');
    const smtpPort = this.config.get<number>('SMTP_PORT', 587);
    const smtpUser = this.config.get<string>('SMTP_USER');
    const smtpPass = this.config.get<string>('SMTP_PASS');

    if (sendgridApiKey) {
      this.logger.log('MailService: Configuring SendGrid SMTP transport relay');
      this.transporter = nodemailer.createTransport({
        host: 'smtp.sendgrid.net',
        port: 587,
        auth: {
          user: 'apikey',
          pass: sendgridApiKey,
        },
      });
    } else if (smtpHost && smtpUser && smtpPass) {
      this.logger.log(`MailService: Configuring SMTP transport using host ${smtpHost}`);
      this.transporter = nodemailer.createTransport({
        host: smtpHost,
        port: smtpPort,
        secure: smtpPort === 465,
        auth: {
          user: smtpUser,
          pass: smtpPass,
        },
      });
    } else {
      this.logger.warn('MailService: No SMTP or SendGrid credentials configured. Running in MOCK development print mode.');
    }
  }

  /**
   * Shared helper to send mail, falling back to mock logging if credentials aren't set.
   */
  private async sendMail(options: nodemailer.SendMailOptions): Promise<void> {
    const fromAddress = this.config.get<string>('SMTP_FROM_EMAIL') || this.config.get<string>('SENDGRID_FROM_EMAIL') || 'no-reply@levithonlabs.com';
    const mailOptions = {
      from: `"LevithonLabs Billing" <${fromAddress}>`,
      ...options,
    };

    if (this.transporter) {
      try {
        await this.transporter.sendMail(mailOptions);
        this.logger.log(`Email successfully dispatched to ${options.to} via transporter`);
      } catch (err: any) {
        this.logger.error(`Failed to dispatch email to ${options.to}: ${err.message}`);
        throw err;
      }
    } else {
      this.logger.log('--- [MOCK EMAIL DISPATCH SIMULATION] ---');
      this.logger.log(`TO: ${mailOptions.to}`);
      this.logger.log(`FROM: ${mailOptions.from}`);
      this.logger.log(`SUBJECT: ${mailOptions.subject}`);
      this.logger.log(`TEXT BODY: ${mailOptions.text}`);
      this.logger.log(`ATTACHMENTS COUNT: ${mailOptions.attachments?.length || 0}`);
      this.logger.log('------------------------------------------');
    }
  }

  /**
   * Email 1: Quotation Sent to Prospect Customer
   */
  async sendQuotationEmail(recipient: string, quote: any, pdfBuffer: Buffer): Promise<void> {
    const subject = `Sales Quotation Proposal - ${quote.quoteNumber}`;
    const text = `Dear ${quote.customer?.name || 'Prospect Client'},\n\nWe have generated quotation proposal ${quote.quoteNumber} for your consideration.\nTotal Sum: Rs. ${Number(quote.totalAmount).toLocaleString()}\n\nPlease review the attached proposal details.\n\nWarm regards,\nLevithonLabs Sales Team`;
    
    const html = `
      <div style="font-family: Arial, sans-serif; background-color: #F8F8F8; padding: 30px; color: #111111;">
        <div style="max-width: 600px; margin: 0 auto; bg-color: #ffffff; padding: 25px; border-radius: 12px; border: 1px solid #e2e8f0; background: #ffffff;">
          <div style="border-bottom: 2px solid #E86D1F; padding-bottom: 15px; margin-bottom: 20px;">
            <h2 style="margin: 0; color: #111111; font-size: 20px;">Sales Proposal Details</h2>
            <p style="margin: 5px 0 0 0; color: #64748b; font-size: 12px;">LevithonLabs eBilling CRM Portal</p>
          </div>
          <p style="font-size: 14px; line-height: 1.6;">Dear <strong>${quote.customer?.name || 'Prospect Client'}</strong>,</p>
          <p style="font-size: 14px; line-height: 1.6;">We have prepared quotation proposal <strong>${quote.quoteNumber}</strong> representing our system development & support SLAs.</p>
          
          <div style="background-color: #f8fafc; padding: 15px; border-radius: 8px; border: 1px solid #e2e8f0; margin: 20px 0;">
            <table style="width: 100%; font-size: 13px;">
              <tr>
                <td style="font-weight: bold; color: #64748b;">Proposal Number:</td>
                <td style="text-align: right; font-weight: bold;">${quote.quoteNumber}</td>
              </tr>
              <tr>
                <td style="font-weight: bold; color: #64748b;">Subtotal:</td>
                <td style="text-align: right;">Rs. ${Number(quote.subTotal).toLocaleString()}</td>
              </tr>
              <tr>
                <td style="font-weight: bold; color: #64748b;">VAT (13%):</td>
                <td style="text-align: right;">Rs. ${Number(quote.taxAmount).toLocaleString()}</td>
              </tr>
              <tr style="border-top: 1px solid #cbd5e1;">
                <td style="font-weight: bold; color: #111111; padding-top: 10px;">Proposed Estimate:</td>
                <td style="text-align: right; font-weight: bold; color: #E86D1F; font-size: 15px; padding-top: 10px;">Rs. ${Number(quote.totalAmount).toLocaleString()}</td>
              </tr>
            </table>
          </div>

          <p style="font-size: 12px; color: #64748b; line-height: 1.6;">Please review the attached PDF copy for formal approvals and line items breakups.</p>
          <div style="margin-top: 25px; padding-top: 15px; border-top: 1px solid #cbd5e1; font-size: 11px; color: #94a3b8; text-align: center;">
            This email represents a digital notification. Attached file complies with Nepal compliance regulations.
          </div>
        </div>
      </div>
    `;

    await this.sendMail({
      to: recipient,
      subject,
      text,
      html,
      attachments: [
        {
          filename: `Quotation_${quote.quoteNumber}.pdf`,
          content: pdfBuffer,
        },
      ],
    });
  }

  /**
   * Email 2: Invoice Sent to Customer
   */
  async sendInvoiceEmail(recipient: string, invoice: any, pdfBuffer: Buffer): Promise<void> {
    const subject = `Tax Invoice - ${invoice.invoiceNo}`;
    const text = `Dear ${invoice.customer?.name || 'Valued Customer'},\n\nWe have issued Tax Invoice ${invoice.invoiceNo} against registered services.\nTotal Due: Rs. ${Number(invoice.totalAmount).toLocaleString()}\n\nPlease find the attached invoice copy containing the IRD Verification Hash.\n\nWarm regards,\nLevithonLabs Billing Desk`;

    const html = `
      <div style="font-family: Arial, sans-serif; background-color: #F8F8F8; padding: 30px; color: #111111;">
        <div style="max-width: 600px; margin: 0 auto; bg-color: #ffffff; padding: 25px; border-radius: 12px; border: 1px solid #e2e8f0; background: #ffffff;">
          <div style="border-bottom: 2px solid #111111; padding-bottom: 15px; margin-bottom: 20px;">
            <h2 style="margin: 0; color: #111111; font-size: 20px;">Official Tax Invoice</h2>
            <p style="margin: 5px 0 0 0; color: #64748b; font-size: 12px;">Nepal IRD CBMS Synchronized Bill</p>
          </div>
          <p style="font-size: 14px; line-height: 1.6;">Dear <strong>${invoice.customer?.name || 'Valued Customer'}</strong>,</p>
          <p style="font-size: 14px; line-height: 1.6;">Please find issued Tax Invoice <strong>${invoice.invoiceNo}</strong> details below.</p>
          
          <div style="background-color: #f8fafc; padding: 15px; border-radius: 8px; border: 1px solid #e2e8f0; margin: 20px 0;">
            <table style="width: 100%; font-size: 13px;">
              <tr>
                <td style="font-weight: bold; color: #64748b;">Invoice Number:</td>
                <td style="text-align: right; font-weight: bold; font-family: monospace;">${invoice.invoiceNo}</td>
              </tr>
              <tr>
                <td style="font-weight: bold; color: #64748b;">Nepali Date (BS):</td>
                <td style="text-align: right; font-family: monospace;">${invoice.billDateBS}</td>
              </tr>
              <tr>
                <td style="font-weight: bold; color: #64748b;">Grand Total:</td>
                <td style="text-align: right; font-weight: bold; color: #111111;">Rs. ${Number(invoice.totalAmount).toLocaleString()}</td>
              </tr>
              <tr>
                <td style="font-weight: bold; color: #64748b;">Verification Hash:</td>
                <td style="text-align: right; font-family: monospace; font-size: 11px; color: #0369a1;">${invoice.verificationHash || 'N/A'}</td>
              </tr>
            </table>
          </div>

          <p style="font-size: 12px; color: #64748b; line-height: 1.6;">A print copy containing the verification hash is attached to this email.</p>
          <div style="margin-top: 25px; padding-top: 15px; border-top: 1px solid #cbd5e1; font-size: 11px; color: #94a3b8; text-align: center;">
            This bill is synchronized with the CBMS system of the Inland Revenue Department of Nepal.
          </div>
        </div>
      </div>
    `;

    await this.sendMail({
      to: recipient,
      subject,
      text,
      html,
      attachments: [
        {
          filename: `TaxInvoice_${invoice.invoiceNo}.pdf`,
          content: pdfBuffer,
        },
      ],
    });
  }

  /**
   * Email 3: Password Reset Token link
   */
  async sendPasswordResetEmail(recipient: string, token: string): Promise<void> {
    const subject = 'Reset Your LevithonLabs Account Password';
    const resetUrl = `https://crm.levithonlabs.com/auth/reset-password?token=${token}`;
    const text = `You have requested to reset your password. Click the link to reset: ${resetUrl}\n\nIf you did not request this, please ignore this email.`;

    const html = `
      <div style="font-family: Arial, sans-serif; background-color: #F8F8F8; padding: 30px; color: #111111;">
        <div style="max-width: 500px; margin: 0 auto; bg-color: #ffffff; padding: 25px; border-radius: 12px; border: 1px solid #e2e8f0; background: #ffffff;">
          <h2 style="margin: 0 0 15px 0; color: #111111; font-size: 18px; border-bottom: 2px solid #E86D1F; padding-bottom: 10px;">Password Reset Request</h2>
          <p style="font-size: 13px; line-height: 1.6; color: #334155;">We received a request to reset your password. Click the button below to update your credentials:</p>
          
          <div style="text-align: center; margin: 25px 0;">
            <a href="${resetUrl}" style="background-color: #111111; color: #ffffff; text-decoration: none; padding: 12px 24px; font-weight: bold; border-radius: 8px; font-size: 13px; display: inline-block;">Reset Password</a>
          </div>

          <p style="font-size: 11px; color: #64748b; line-height: 1.6;">If the button doesn't work, copy and paste this link in your browser:<br/><span style="color: #0369a1; font-family: monospace;">${resetUrl}</span></p>
          <p style="font-size: 11px; color: #94a3b8; margin-top: 20px;">If you did not initiate this request, you can safely discard this email.</p>
        </div>
      </div>
    `;

    await this.sendMail({
      to: recipient,
      subject,
      text,
      html,
    });
  }

  /**
   * Email 4: Invite User to Join Tenant Account
   */
  async sendUserInvitationEmail(recipient: string, invitationLink: string, tenantName: string): Promise<void> {
    const subject = `Invitation to Join ${tenantName} workspace on LevithonLabs`;
    const text = `You have been invited to join the ${tenantName} workspace on LevithonLabs eBilling CRM. Register here: ${invitationLink}`;

    const html = `
      <div style="font-family: Arial, sans-serif; background-color: #F8F8F8; padding: 30px; color: #111111;">
        <div style="max-width: 500px; margin: 0 auto; bg-color: #ffffff; padding: 25px; border-radius: 12px; border: 1px solid #e2e8f0; background: #ffffff;">
          <h2 style="margin: 0 0 15px 0; color: #111111; font-size: 18px; border-bottom: 2px solid #E86D1F; padding-bottom: 10px;">Workspace Invitation</h2>
          <p style="font-size: 13px; line-height: 1.6; color: #334155;">You have been invited to join the <strong>${tenantName}</strong> organization as a team member.</p>
          
          <div style="text-align: center; margin: 25px 0;">
            <a href="${invitationLink}" style="background-color: #E86D1F; color: #ffffff; text-decoration: none; padding: 12px 24px; font-weight: bold; border-radius: 8px; font-size: 13px; display: inline-block;">Accept Invitation</a>
          </div>

          <p style="font-size: 11px; color: #64748b; line-height: 1.6;">If the button doesn't work, copy and paste this link in your browser:<br/><span style="color: #0369a1; font-family: monospace;">${invitationLink}</span></p>
          <p style="font-size: 11px; color: #94a3b8; margin-top: 20px;">Welcome to LevithonLabs eBilling CRM.</p>
        </div>
      </div>
    `;

    await this.sendMail({
      to: recipient,
      subject,
      text,
      html,
    });
  }
}
