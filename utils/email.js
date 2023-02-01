const nodemailer = require('nodemailer');

const sendEmail = async (options) => {
  // 1) 需要建造一個傳送器 create a transporter
  // 基本上是一項 實際發送電子郵件的服務
  const transporter = nodemailer.createTransport({
    // service: 'Gmail',
    host: process.env.EMAIL_HOST,
    port: process.env.EMAIL_PORT,
    auth: {
      user: process.env.EMAIL_USERNAME,
      pass: process.env.EMAIL_PASSWORD,
    },
    // Active in gmail "less secure app" option 如果你使用gmail 一天發送超過 500封郵件 那就完蛋了
    // 盡量使用 SendGrid or Mail gun
    // 使用Mailtrap 將那些郵件留著 進行開發模式測試
  });

  // 2) 需要定義電子郵件選項 define the email options
  const mailOptions = {
    from: 'LinZheHao <a8570870z@gmail.com>',
    to: options.email,
    subject: options.subject,
    text: options.message,
    // html:
  };
  // 3) 用 Nodemailer 發送出電子郵件
  // 這個函數返回 promises
  await transporter.sendMail(mailOptions);
};

module.exports = sendEmail;
