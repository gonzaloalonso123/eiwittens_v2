const nodemailer = require("nodemailer");
require("dotenv").config();

const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 587,
  secure: false,
  auth: {
    user: "eiwittensmailer@gmail.com",
    pass: process.env.EMAIL_PASSWORD,
  },
});

const recipents = ["huntymonster@gmail.com", "gieriggroeien.nl@gmail.com"];

const sendMail = async (warnings, oldProducts, newProducts) => {
  transporter.sendMail({
    from: '"Eiwitten Mailer 👻" <eiwittensmailer@gmail.com>',
    to: recipents,
    subject: `(${warnings.length}) Proteins not found!`,
    html: `<html>
    ${generateBigFluctuationTable(newProducts)}
      </html>
    `,
  });
};

const generateBigFluctuationTable = (newProducts) => {
  return `
    <table>
      <tr>
        <th>Product</th>
        <th>Old Price</th>
        <th>New Price</th>
      </tr>
      ${newProducts
        .filter((p) => p.provisionalPrice)
        .map(
          (p) =>
            `<tr>
          <td>${p.name}</td>
          <td>${p.price}</td>
          <td>${p.provisionalPrice}</td>
        </tr>`
        )}
    </table>
    <a href="https://dashboard.gieriggroeien.nl/verify-provisional-prices">
      Verify Provisional Prices
    </a>
  `;
};

const sendErrorMail = (type, error) => {
  transporter.sendMail({
    from: '"Eiwitten Mailer 👻" <eiwittensmailer@gmail.com>',
    to: recipents,
    subject: "ERROR in Eiwitten Mailer",
    html: `Some error has ocurred, please check the server | type: ${type}`,
  });
};

module.exports = { sendMail, sendErrorMail };
