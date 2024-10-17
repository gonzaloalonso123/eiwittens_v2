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
    subject: `(${warnings.length}) Proteins not found! ✔`,
    html: `
    <h1>Warnings</h1>
    ${generateWarningTable(warnings)}
    <h1>Comparison</h1>
    ${generateCompareTable(oldProducts, newProducts)}`,
  });
};

const generateWarningTable = (warnings) => {
  let table = `<table style="width:100%;border:1px solid black;border-collapse: collapse;"><tr><th style="border:1px solid black;padding:10px;">Product</th><th style="border:1px solid black;padding:10px;">URL</th></tr>`;
  for (const warning of warnings) {
    table += "<tr>";
    table += `<td style="border:1px solid black;padding:10px;">${warning.name}</td>`;
    table += `<td style="border:1px solid black;padding:10px;">${warning.url}</td>`;
    table += "</tr>";
  }
  table += "</table>";
  return table;
};

const generateCompareTable = (oldProducts, newProducts) => {
  console.log(oldProducts, newProducts);
  const sortedOldProducts = oldProducts
    .filter((p) => !p.warning)
    .sort((a, b) => a.priceForProteinGram - b.priceForProteinGram);
  const sortedNewProducts = newProducts
    .filter((p) => !p.warning)
    .sort((a, b) => a.priceForProteinGram - b.priceForProteinGram);
  let table = `<table style="width:100%;border:1px solid black;border-collapse: collapse;"><tr><th style="border:1px solid black;padding:10px;">Product</th><th style="border:1px solid black;padding:10px;">Old Price</th><th style="border:1px solid black;padding:10px;">New Price</th><th style="border:1px solid black;padding:10px;">Old price per 100g</th><th style="border:1px solid black;padding:10px;">New price per 100g</th><th style="border:1px solid black;padding:10px;">Fluctuation</th><th style="border:1px solid black;padding:10px;">Old rank</th><th style="border:1px solid black;padding:10px;">New rank</th></tr>`;
  for (let i = 0; i < oldProducts.length; i++) {
    table += "<tr>";
    table += `<td style="border:1px solid black;padding:10px;">${oldProducts[i].name}</td>`;
    table += `<td style="border:1px solid black;padding:10px;">${oldProducts[i].price}</td>`;
    table += `<td style="border:1px solid black;padding:10px;">${newProducts[i].price}</td>`;
    table += `<td style="border:1px solid black;padding:10px;">${oldProducts[i].priceForProteinGram}</td>`;
    table += `<td style="border:1px solid black;padding:10px;">${newProducts[i].priceForProteinGram}</td>`;
    table += `<td style="border:1px solid black;padding:10px;">${(
      (newProducts[i].priceForProteinGram -
        oldProducts[i].priceForProteinGram) /
      oldProducts[i].priceForProteinGram
    ).toFixed(2)}</td>`;
    table += `<td style="border:1px solid black;padding:10px;">${
      sortedOldProducts.findIndex(
        (product) => product.id === oldProducts[i].id
      ) + 1
    }</td>`;
    table += `<td style="border:1px solid black;padding:10px;">${
      sortedNewProducts.findIndex(
        (product) => product.id === newProducts[i].id
      ) + 1
    }</td>`;
    table += "</tr>";
  }
  table += "</table>";
  return table;
};
module.exports = { sendMail };
