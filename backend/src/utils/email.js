const nodemailer = require('nodemailer');

// 创建邮件传输器
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: process.env.SMTP_PORT,
  auth: {
    user: process.env.SMTP_USERNAME,
    pass: process.env.SMTP_PASSWORD
  }
});

// 发送邮件函数
const sendEmail = async (options) => {
  try {
    const mailOptions = {
      from: process.env.EMAIL_FROM,
      to: options.email,
      subject: options.subject,
      text: options.message
    };

    await transporter.sendMail(mailOptions);
    console.log(`邮件已发送至 ${options.email}`);
  } catch (error) {
    console.error('发送邮件失败:', error);
    throw new Error('发送邮件失败');
  }
};

module.exports = { sendEmail };
