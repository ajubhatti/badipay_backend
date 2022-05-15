const nodemailer = require("nodemailer");
const config = require("../config.json");

const sendEmail = async ({ to, subject, html, from = config.emailFrom }) => {
  let transporter = nodemailer.createTransport(config.smtpOptions2);

  await transporter.sendMail({ from, to, subject, html }).then((data) => {
    console.log("mail ---------", data);
  });
};

module.exports = sendEmail;
