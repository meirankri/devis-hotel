import { TransactionalEmailsApi, SendSmtpEmail } from "@getbrevo/brevo";
import env from "./env";
import { logger } from "@/utils/logger";

type SendEmailProps = {
  to: string;
  subject: string;
  html: string;
};

export async function sendEmail({ to, subject, html }: SendEmailProps) {
  try {
    // Configuration globale de l'API key
    let api = new TransactionalEmailsApi();
    api.setApiKey(0, env.BREVO_API_KEY!);

    const sendSmtpEmail = new SendSmtpEmail();

    sendSmtpEmail.subject = subject;
    sendSmtpEmail.htmlContent = html;
    sendSmtpEmail.sender = {
      name: "Devis hotel",
      email: env.EMAIL_FROM!,
    };
    sendSmtpEmail.to = [
      {
        email: to,
      },
    ];

    const response = await api.sendTransacEmail(sendSmtpEmail);

    return response;
  } catch (error) {
    logger({
      message: "Error sending email with Brevo",
      context: { error, to, subject },
    }).error();
    throw error;
  }
}
