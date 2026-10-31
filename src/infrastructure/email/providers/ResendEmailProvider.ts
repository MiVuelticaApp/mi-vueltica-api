import { Resend } from "resend";
import { IEmailService, SendEmailParams } from "@/domain/core/services/IEmailService";
import EmailError from "@/infrastructure/core/errors/EmailError";

export default class ResendEmailProvider implements IEmailService {
  private readonly resend: Resend;
  private readonly from: string;

  constructor(apiKey: string, from: string) {
    this.resend = new Resend(apiKey);
    this.from = from;
  }

  async send(params: SendEmailParams): Promise<void> {
    try {
      const { error } = await this.resend.emails.send({
        from: this.from,
        to: params.to,
        subject: params.subject,
        html: params.html,
        text: params.text,
      });

      if (error) {
        throw new EmailError(`Failed to send email: ${error.message}`);
      }
    } catch (err) {
      if (err instanceof EmailError) throw err;
      throw new EmailError("Failed to send email");
    }
  }
}