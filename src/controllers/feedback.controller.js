import { Feedback } from '../models/feedback.model.js';
import { sendEmail } from '../services/email.service.js';
import { validateEmail, validatePhone } from '../utils/validation.js';
import { User } from '../models/user.model.js';

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

export const getLatestFeedback = async (req, res) => {
  try {
    const feedbacks = await Feedback.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .exec();

    return res.status(200).json(feedbacks);
  } catch (error) {
    console.error('Error fetching feedback:', error);
    return res
      .status(500)
      .json({ message: 'An error occurred while fetching feedback' });
  }
};

export const getAllFeedback = async (req, res) => {
  try {
    const feedbacks = await Feedback.find().sort({ createdAt: -1 }).exec();
    return res.status(200).json(feedbacks);
  } catch (error) {
    console.error('Error fetching feedback:', error);
    return res
      .status(500)
      .json({ message: 'An error occurred while fetching feedback' });
  }
};

export const checkIfLoyalCustomer = async (req, res) => {
  try {
    const { senderEmail } = req.body;

    if (!senderEmail) {
      return res.status(400).json({
        error: 'Missing required email field',
      });
    }

    const user = await User.findOne({ email: senderEmail }).exec();

    if (user) {
      return res.status(200).json({
        message: 'This is a loyal customer',
        loyalCustomer: true,
      });
    } else {
      return res.status(200).json({
        message: 'This is not a loyal customer',
        loyalCustomer: false,
      });
    }
  } catch (error) {
    console.error('Error checking loyal customer:', error);
    return res
      .status(500)
      .json({ message: 'An error occurred while checking loyal customer' });
  }
};

export const replyEmail = async (req, res) => {
  try {
    const { feedbackId, answer } = req.body;

    const feedback = await Feedback.findById(feedbackId).exec();
    if (!feedback) {
      return res.status(404).json({
        error: 'Feedback not found',
      });
    }

    await sendEmail({
      from: 'clone.ct250@gmail.com',
      to: feedback.senderEmail,
      subject: 'Cảm ơn phản hồi của bạn',
      text: `Kính gửi ${feedback.senderName},\n\nChúng tôi đã nhận được phản hồi của bạn về: "${feedback.question}".\n\n${answer}\n\nThân,\nKPT Sport`,
      html: `
      <div style="font-family: Arial, sans-serif; line-height: 1.5; color: #333;">
        <p>Kính gửi ${feedback.senderName},</p>
        <p>Chúng tôi đã nhận được phản hồi của bạn về: <strong>"${feedback.question}"</strong>.</p>
        <p>${answer}</p>
        <p>Thân,<br>KPT Sport</p>
      </div>
      `,
    });

    feedback.answer = answer;
    await feedback.save();

    return res.status(200).json({
      message: 'Reply email sent successfully',
    });
  } catch (error) {
    console.error('Error sending email:', error);
    return res.status(500).json({
      message: 'An error occurred while sending reply email',
    });
  }
};
