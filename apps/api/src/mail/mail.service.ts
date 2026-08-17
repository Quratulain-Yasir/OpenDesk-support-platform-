import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Resend } from 'resend';

@Injectable()
export class MailService {
  private resend: Resend;
  private fromEmail: string;
  private logger = new Logger(MailService.name);

  constructor(private configService: ConfigService) {
    const apiKey = this.configService.get<string>('RESEND_API_KEY');
    this.resend = new Resend(apiKey);
    this.fromEmail =
      this.configService.get<string>('RESEND_FROM_EMAIL') ||
      'onboarding@resend.dev';
  }

  async sendInviteEmail(params: {
    to: string;
    workspaceName: string;
    role: string;
    acceptLink: string;
  }) {
    const { to, workspaceName, role, acceptLink } = params;

    try {
      const result = await this.resend.emails.send({
        from: this.fromEmail,
        to,
        subject: `You're invited to join ${workspaceName} on OpenDesk`,
        html: `
          <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
            <h2>You've been invited!</h2>
            <p>You've been invited to join <strong>${workspaceName}</strong> as a <strong>${role}</strong>.</p>
            <p style="margin: 24px 0;">
              <a href="${acceptLink}" style="background:#111827;color:#fff;padding:12px 24px;border-radius:6px;text-decoration:none;">
                Accept Invitation
              </a>
            </p>
            <p style="color:#6b7280;font-size:12px;">This invite expires in 7 days. If you weren't expecting this, you can ignore this email.</p>
          </div>
        `,
      });

      this.logger.log(`Invite email sent to ${to}: ${JSON.stringify(result)}`);
      return result;
    } catch (err) {
      this.logger.error(`Failed to send invite email to ${to}`, err);
      // Don't throw — invite record already created, email failure shouldn't break the flow
      return null;
    }
  }
}