const nodemailer = require("nodemailer");
const config = require("../config.json");

const sendEmail = async ({ to, subject, html, from = config.emailFrom }) => {
  let transporter = nodemailer.createTransport(config.smtpOptions3);

  await transporter.sendMail({ from, to, subject, html }).then((err, data) => {
    console.log("mail ---------", err, data);
    if (!err) {
      return data;
    }
    return err;
  });
};

module.exports = sendEmail;
