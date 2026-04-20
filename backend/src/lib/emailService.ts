import nodemailer from 'nodemailer';
import prisma from './prisma';

export const sendEmail = async (to: string, subject: string, html: string) => {
  const settings = await prisma.settings.findFirst();

  const host = settings?.smtpHost || process.env.SMTP_HOST;
  const port = settings?.smtpPort || parseInt(process.env.SMTP_PORT || '587');
  const secure = settings ? settings.smtpSecure : (process.env.SMTP_SECURE === 'true');
  const user = settings?.smtpUser || process.env.SMTP_USER;
  const pass = settings?.smtpPass || process.env.SMTP_PASS;
  const appName = settings?.appName || 'Chamado TI';

  if (!user || !pass) {
    console.log('--- EMAIL NOT SENT (SMTP NOT CONFIGURED) ---');
    console.log('To:', to);
    console.log('Subject:', subject);
    console.log('Content:', html);
    console.log('-------------------------------------------');
    return;
  }

  const transporter = nodemailer.createTransport({
    host,
    port,
    secure,
    auth: { user, pass },
  });

  try {
    await transporter.sendMail({
      from: `"${appName}" <${user}>`,
      to,
      subject,
      html,
    });
    console.log(`Email sent to ${to}`);
  } catch (error) {
    console.error('Failed to send email:', error);
  }
};
