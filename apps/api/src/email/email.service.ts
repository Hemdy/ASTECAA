import { Injectable, Logger } from '@nestjs/common';
import { Resend } from 'resend';

export interface EmailResult {
  success: boolean;
  id?: string;
  simulated?: boolean;
  error?: string;
}

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private resend: Resend | null = null;
  private readonly fromEmail: string;

  constructor() {
    const apiKey = process.env.RESEND_API_KEY;
    this.fromEmail = process.env.RESEND_FROM_EMAIL || 'ASTECAA <notifications@astecaa.org>';

    if (apiKey && apiKey.trim().length > 0 && !apiKey.startsWith('placeholder')) {
      this.resend = new Resend(apiKey.trim());
      this.logger.log(`Resend email client initialized with sender: ${this.fromEmail}`);
    } else {
      this.logger.warn(
        'RESEND_API_KEY is not configured. Outgoing emails will be simulated and logged in the console.',
      );
    }
  }

  async sendEmail(to: string, subject: string, html: string, text?: string): Promise<EmailResult> {
    if (!this.resend) {
      this.logger.log(`[SIMULATED EMAIL DISPATCH]
To: ${to}
From: ${this.fromEmail}
Subject: ${subject}
Text snippet: ${text ? text.slice(0, 150) : '(HTML email)'}`);
      return { success: true, simulated: true, id: `sim_${Date.now()}` };
    }

    try {
      const response = await this.resend.emails.send({
        from: this.fromEmail,
        to: [to],
        subject,
        html,
        text: text || html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim(),
      });

      if (response.error) {
        this.logger.error(`Failed to send email to ${to}: ${response.error.message}`);
        return { success: false, error: response.error.message };
      }

      this.logger.log(`Email successfully dispatched via Resend to ${to} (ID: ${response.data?.id})`);
      return { success: true, id: response.data?.id };
    } catch (err: any) {
      this.logger.error(`Exception sending email to ${to}: ${err.message}`);
      return { success: false, error: err.message };
    }
  }

  async sendInvitation(to: string, role: string, token: string): Promise<EmailResult> {
    const baseUrl = process.env.WEBSITE_URL || 'http://localhost:4200';
    const inviteUrl = `${baseUrl}/register?token=${encodeURIComponent(token)}`;

    const subject = 'You have been invited to join the ASTECAA Alumni Community';
    const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #faf7f2; margin: 0; padding: 24px; color: #2e2620; }
    .container { max-width: 560px; margin: 0 auto; background: #ffffff; border-radius: 12px; padding: 36px; border: 1px solid #e8dfd5; }
    .header { text-align: center; border-bottom: 2px solid #f0e9df; padding-bottom: 20px; margin-bottom: 24px; }
    .brand { font-size: 24px; font-weight: 800; letter-spacing: 0.12em; color: #5a1827; }
    .badge { display: inline-block; background: #fef5e7; color: #9c6c18; padding: 4px 12px; border-radius: 999px; font-size: 13px; font-weight: 600; margin-top: 8px; }
    h2 { font-size: 20px; color: #2e2620; margin-top: 0; }
    p { line-height: 1.6; font-size: 15px; color: #4a3e35; }
    .cta-wrap { text-align: center; margin: 32px 0; }
    .btn { display: inline-block; background: #c49a45; color: #ffffff !important; text-decoration: none; padding: 14px 28px; border-radius: 8px; font-weight: 700; font-size: 15px; }
    .footer { text-align: center; font-size: 12px; color: #8a7c70; margin-top: 36px; border-top: 1px solid #f0e9df; padding-top: 20px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="brand">ASTECAA</div>
      <div class="badge">Official Invitation</div>
    </div>
    <h2>Welcome to the Alumni Network</h2>
    <p>You have been formally invited to join the <strong>ASTECAA Alumni Platform</strong> as <strong>${role}</strong>.</p>
    <p>Connect with your graduating set, register for upcoming events, cast your vote in executive council elections, and leave your mark on the alumni community wall.</p>
    <div class="cta-wrap">
      <a href="${inviteUrl}" class="btn">Accept Invitation & Register</a>
    </div>
    <p style="font-size: 13px; color: #8a7c70;">If the button does not work, copy and paste this link into your browser:<br><a href="${inviteUrl}" style="color: #c49a45; word-break: break-all;">${inviteUrl}</a></p>
    <div class="footer">
      &copy; ${new Date().getFullYear()} ASTECAA Alumni Association. All rights reserved.
    </div>
  </div>
</body>
</html>`;

    return this.sendEmail(to, subject, html);
  }

  async sendEventConfirmation(
    to: string,
    event: { title: string; date: string; venue: string },
    attendeeName: string,
  ): Promise<EmailResult> {
    const subject = `RSVP Confirmed: ${event.title}`;
    const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #faf7f2; margin: 0; padding: 24px; color: #2e2620; }
    .container { max-width: 560px; margin: 0 auto; background: #ffffff; border-radius: 12px; padding: 36px; border: 1px solid #e8dfd5; }
    .brand { font-size: 22px; font-weight: 800; color: #5a1827; margin-bottom: 20px; }
    .ticket { background: #fdfaf6; border: 1px dashed #c49a45; border-radius: 8px; padding: 20px; margin: 24px 0; }
    .ticket-title { font-size: 18px; font-weight: 700; color: #5a1827; margin: 0 0 10px; }
    .ticket-row { font-size: 14px; margin: 6px 0; color: #4a3e35; }
    .footer { text-align: center; font-size: 12px; color: #8a7c70; margin-top: 30px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="brand">ASTECAA</div>
    <h2>Your place is reserved, ${attendeeName}!</h2>
    <p>Thank you for registering for the upcoming alumni event. Here are your reservation details:</p>
    <div class="ticket">
      <div class="ticket-title">${event.title}</div>
      <div class="ticket-row"><strong>Date:</strong> ${event.date}</div>
      <div class="ticket-row"><strong>Venue:</strong> ${event.venue}</div>
      <div class="ticket-row"><strong>Status:</strong> Confirmed RSVP</div>
    </div>
    <p>We look forward to seeing you there! If your plans change, you can update your registration from your alumni dashboard.</p>
    <div class="footer">
      &copy; ${new Date().getFullYear()} ASTECAA Alumni Association.
    </div>
  </div>
</body>
</html>`;

    return this.sendEmail(to, subject, html);
  }

  async sendVotingOtp(to: string, otp: string, electionTitle: string): Promise<EmailResult> {
    const subject = `Your Secure Ballot Verification Code: ${otp}`;
    const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #faf7f2; margin: 0; padding: 24px; color: #2e2620; }
    .container { max-width: 520px; margin: 0 auto; background: #ffffff; border-radius: 12px; padding: 36px; border: 1px solid #e8dfd5; text-align: center; }
    .brand { font-size: 22px; font-weight: 800; color: #5a1827; margin-bottom: 20px; }
    .otp-box { background: #fdf6ec; border: 2px dashed #c49a45; border-radius: 8px; padding: 18px; margin: 24px auto; font-size: 32px; font-weight: 800; letter-spacing: 0.25em; color: #5a1827; max-width: 260px; }
    .footer { font-size: 12px; color: #8a7c70; margin-top: 30px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="brand">ASTECAA ELECTION PORTAL</div>
    <h2>Voter Verification Code</h2>
    <p>You requested a secure verification code to cast your ballot in:</p>
    <p style="font-weight: 700; color: #5a1827;">${electionTitle}</p>
    <div class="otp-box">${otp}</div>
    <p style="font-size: 13px; color: #7a6e65;">This code expires in 15 minutes. Never share this code with anyone.</p>
    <div class="footer">
      &copy; ${new Date().getFullYear()} ASTECAA Electoral Committee.
    </div>
  </div>
</body>
</html>`;

    return this.sendEmail(to, subject, html);
  }
}
