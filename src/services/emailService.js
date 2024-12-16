const nodemailer = require('nodemailer');

// 配置邮件发送器
const transporter = nodemailer.createTransport({
  host: 'smtp.qq.com',
  port: 465,
  secure: true,
  auth: {
    user: process.env.EMAIL_USER, // 从环境变量中获取邮箱账号
    pass: process.env.EMAIL_PASS  // 从环境变量中获取邮箱密码
  }
});

// 封装发送邮件函数
async function sendMail(to, subject, text) {
  const mailOptions = {
    from: process.env.EMAIL_USER,
    to,
    subject,
    text
  };
  try {
    const info = await transporter.sendMail(mailOptions);
    return info;
  } catch (error) {
    throw new Error('邮件发送失败');
  }
}

module.exports = {
  sendMail
};