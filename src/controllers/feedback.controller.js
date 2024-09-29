import { Feedback } from '../models/feedback.model.js';
import { sendEmail } from '../services/email.service.js';
import { validateEmail, validatePhone } from '../utils/validation.js';

export const createFeedback = async (req, res) => {
  try {
    const { senderName, senderEmail, senderPhone, question } = req.body;

    if (!senderName || !senderEmail || !senderPhone || !question) {
      return res.status(400).json({
        error: 'Missing required fields',
      });
    }

    if (!validateEmail(senderEmail)) {
      return res.status(400).json({
        error: 'Invalid email format',
      });
    }

    if (!validatePhone(senderPhone)) {
      return res.status(400).json({
        error: 'Invalid phone number format',
      });
    }

    const newFeedback = await Feedback.create({
      senderName,
      senderEmail,
      senderPhone,
      question,
    });

    const emailText = `
    Khách hàng: ${senderName},
    SĐT Khách hàng: ${senderPhone},`;

    const emailHtml = `
    <div style="font-family: Arial, sans-serif; line-height: 1.5; color: #333;">
      <h2 style="color: #EA580C;">Thông tin phản hồi từ khách hàng</h2>
      <p><strong>Khách hàng:</strong> ${senderName}</p>
      <p><strong>Số điện thoại:</strong> ${senderPhone}</p>
      <p><strong>Email:</strong> ${senderEmail}</p>
      <hr style="border: 1px solid #ddd;">
      <h3 style="color: #EA580C;">Nội dung phản hồi:</h3>
      <p style="background-color: #f9f9f9; padding: 10px; border-radius: 5px; border: 1px solid #eee;">
        ${question}
      </p>
    </div>
  `;

    const { data, error } = await sendEmail({
      from: senderEmail,
      subject: `Phản hồi từ ${senderName}`,
      text: emailText,
      html: emailHtml,
    });

    if (error) {
      return res.status(500).json({
        error: `email service error: ${error}`,
      });
    }

    res.status(201).json({
      data: {
        feedback: newFeedback,
        email: data,
      },
      error: false,
    });
  } catch (error) {
    logError(error, res);
  }
};
