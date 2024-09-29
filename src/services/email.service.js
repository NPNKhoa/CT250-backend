import nodemailer from 'nodemailer';

import emailConfig from '../configs/emailConfig.js';

export const sendEmail = async ({
  from,
  to = process.env.EMAIL_USER,
  subject,
  text,
  html = null,
}) => {
  try {
    const transporter = nodemailer.createTransport({
      service: emailConfig.service,
      auth: {
        user: emailConfig.user,
        pass: emailConfig.pass,
      },
    });

    const mailOptions = {
      from: `"${from}" <${emailConfig.user}>`,
      to,
      subject,
      text,
      ...(html && { html }),
    };

    const info = await transporter.sendMail(mailOptions);

    return {
      data: info.response,
      error: false,
    };
  } catch (error) {
    console.log(error);
    return { error };
  }
};
