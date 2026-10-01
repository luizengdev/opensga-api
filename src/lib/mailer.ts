import "dotenv/config";

import nodemailer from "nodemailer";

import {env} from "./env.js";

const mailTransporter = nodemailer.createTransport({
  host: env.SMTP_HOST,
  port: env.SMTP_PORT,
  secure: env.SMTP_PORT === 465,
  auth: {
    user: env.SMTP_USER,
    pass: env.SMTP_PASS,
  },
});

interface ISendCredentialsEmailInput {
  toEmail: string;
  nome: string;
  identificador: string;
  senhaProvisoria: string;
  identificadorLabel?: string;
  introducao?: string;
}

export const sendCredentialsEmail = async ({
  toEmail,
  nome,
  identificador,
  senhaProvisoria,
  identificadorLabel = "Registro Acadêmico (RA)",
  introducao = "Sua matrícula institucional foi efetivada com sucesso.",
}: ISendCredentialsEmailInput): Promise<void> => {
  await mailTransporter.sendMail({
    from: `Secretaria Acadêmica <${env.SMTP_FROM}>`,
    to: toEmail,
    subject: "🎓 Credenciais de Acesso ao Portal Acadêmico",
    html: `
      <div style="font-family: Arial, sans-serif; color: #0f172a; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 8px; padding: 24px;">
        <h2 style="color: #1e3a8a;">Olá, ${nome}!</h2>
        <p>${introducao}</p>
        <div style="background-color: #f1f5f9; padding: 16px; border-radius: 6px; margin: 20px 0;">
          <p style="margin: 0 0 8px;"><strong>${identificadorLabel}:</strong> ${identificador}</p>
          <p style="margin: 0;"><strong>Senha Provisória:</strong> <code style="color: #2563eb; font-size: 16px;">${senhaProvisoria}</code></p>
        </div>
        <p>Acesse o Portal do Aluno para alterar sua senha e acessar a grade horária:</p>
        <a href="${env.FRONTEND_URL}/login" style="display: inline-block; background-color: #1d4ed8; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">Entrar no Portal do Aluno</a>
      </div>
    `,
  });
};
