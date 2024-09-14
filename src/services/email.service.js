import nodemailer from 'nodemailer';

import emailConfig from '../configs/emailConfig.js';

export const sendEmail = async (from, subject, text, html = null) => {
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
      to: process.env.EMAIL_USER,
      subject,
      text,
      ...(html && { html }),
    };

    console.log(mailOptions);

    const info = await transporter.sendMail(mailOptions);

    console.log(info);

    return {
      data: info.response,
      error: false,
    };
  } catch (error) {
    console.log(error);
    return { error };
  }
};
