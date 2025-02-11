import * as process from 'process';
import { createTransport } from 'nodemailer';
import { BadRequestError } from '../errors';

type MailOptions = {
  to: string;
  subject: string;
  html: string;
};

export async function sendEmail({
  to,
  subject,
  html,
}: MailOptions): Promise<void> {
  try {
    const transporter = createTransport({
      host: process.env.BREVO_HOST as string,
      port: Number(process.env.BREVO_PORT),
      auth: {
        user: process.env.BREVO_USER as string,
        pass: process.env.BREVO_TOKEN as string,
      },
    });

    const mailOptions = {
      from: process.env.BREVO_FROM as string,
      to,
      subject,
      html,
    };

    await transporter.sendMail(mailOptions);
  } catch (error) {
    console.log(error);
    throw new BadRequestError('Could not send email');
  }
}
