const nodemailer = require("nodemailer");
const config = require("../config.json");

const sendEmail = async ({ to, subject, html, from = config.emailFrom }) => {
  // create reusable transporter object using the default SMTP transport
  let transporter = nodemailer.createTransport({
    host: "smtp.gmail.com",
    service: "Gmail",
    secureConnection: true,
    port: 465,
    secure: true, // true for 465, false for other ports
    auth: {
      user: "multaniazaz@gmail.com", // generated ethereal user
      pass: "gj11nn50999", // generated ethereal password
    },
  });
  console.log({ from, to, subject, html });
  let info = await transporter
    .sendMail({ from, to, subject, html })
    .then((data) => {
      console.log("mail ---------", data);
    });
  // Message sent: <b658f8ca-6296-ccf4-8306-87d57a0b4321@example.com>
};

module.exports = sendEmail;
