import { IEmailService } from "@/domain/core/services/IEmailService";

export default class AccountDeletionEmailSender {
  constructor(
    private readonly emailService: IEmailService,
  ) {}

  /**
   * Send a confirmation email after an account has been deleted. MUST be called
   * only after the deletion transaction has committed; a Resend failure must
   * never revert the deletion nor surface as 500 to the client. Callers are
   * expected to wrap this in try/catch and log, never throw back to the user.
   */
  async sendDeletionConfirmationEmail(
    to: string,
    name: string,
    deletedCompanyCount: number,
  ): Promise<void> {
    const subject = `Tu cuenta en Delivo ha sido eliminada`;
    const greeting = name ? `Hola, ${name}` : "Hola";
    const companiesLine = deletedCompanyCount > 0
      ? `Se eliminaron ${deletedCompanyCount} empresa${deletedCompanyCount === 1 ? "" : "s"} asociada${deletedCompanyCount === 1 ? "" : "s"} a tu cuenta, junto con todos sus datos.`
      : "No había empresas asociadas a tu cuenta.";

    const text = [
      greeting + ":",
      "",
      "Te confirmamos que tu cuenta en Delivo y todos tus datos personales han sido eliminados.",
      companiesLine,
      "",
      "Esta acción es irreversible y no se puede deshacer.",
      "",
      "Si creaste esta cuenta por error o ya no la necesitas, no tienes que hacer nada más.",
      "",
      "Atentamente,",
      "El equipo de Delivo",
    ].join("\n");

    const html = `
      <div style="font-family: Arial, sans-serif; color: #1a1a1a;">
        <h2>${greeting}</h2>
        <p>Tu cuenta en <strong>Delivo</strong> y todos tus datos personales han sido eliminados.</p>
        <p>${companiesLine}</p>
        <p style="background-color:#fef2f2;border-left:4px solid #dc2626;padding:10px 14px;border-radius:4px;">
          Esta acción es <strong>irreversible</strong> y no se puede deshacer.
        </p>
        <p style="font-size:12px;color:#6b7280;">
          Si creaste esta cuenta por error o ya no la necesitas, no tienes que hacer nada más.
        </p>
        <p style="font-size:12px;color:#6b7280;">Atentamente,<br/>El equipo de Delivo</p>
      </div>
    `;

    await this.emailService.send({
      to,
      subject,
      html,
      text,
    });
  }
}