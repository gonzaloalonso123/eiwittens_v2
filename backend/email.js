const nodemailer = require("nodemailer");
const { get } = require("selenium-webdriver/http");
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
  const { table, fluctuationsHappened } = generateCompareTable(
    oldProducts,
    newProducts
  );
  transporter.sendMail({
    from: '"Eiwitten Mailer 👻" <eiwittensmailer@gmail.com>',
    to: recipents,
    subject: `(${warnings.length}) Proteins not found! ✔ ${
      fluctuationsHappened ? "(🌝 Fluctuations happened)" : ""
    }`,
    html: `
    <h1>Warnings</h1>
    ${generateWarningTable(warnings)}
    <h1>Comparison</h1>
	${table}`,
  });
};

const generateWarningTable = (warnings) => {
  let table = `<table style="width:100%;border:1px solid black;border-collapse: collapse;"><tr><th style="border:1px solid black;padding:10px;">Product</th><th style="border:1px solid black;padding:10px;">URL</th><th style="border:1px solid black;padding:10px;">Severity (Times Clicked)</th></tr>`;
  for (const warning of warnings) {
    table += "<tr>";
    table += `<td style="border:1px solid black;padding:10px;">${warning.name}</td>`;
    table += `<td style="border:1px solid black;padding:10px;">${warning.url}</td>`;
    table += `<td style="border:1px solid black;padding:10px;">${warning.severity}</td>`;
    table += "</tr>";
  }
  table += "</table>";
  return table;
};

const generateCompareTable = (oldProducts, newProducts) => {
  const sortedOldProducts = oldProducts
    .filter((p) => !p.warning)
    .sort((a, b) => a.priceForProteinGram - b.priceForProteinGram);
  const sortedNewProducts = newProducts
    .filter((p) => !p.warning)
    .sort((a, b) => a.priceForProteinGram - b.priceForProteinGram);
  let table = `<table style="width:100%;border:1px solid black;border-collapse: collapse;"><tr><th style="border:1px solid black;padding:10px;">Product</th><th style="border:1px solid black;padding:10px;">Old Price</th><th style="border:1px solid black;padding:10px;">New Price</th><th style="border:1px solid black;padding:10px;">Old price per 100g</th><th style="border:1px solid black;padding:10px;">New price per 100g</th><th style="border:1px solid black;padding:10px;">Fluctuation</th><th style="border:1px solid black;padding:10px;">Old rank</th><th style="border:1px solid black;padding:10px;">New rank</th></tr>`;

  let fluctuationsHappened = false;
  for (let i = 0; i < sortedNewProducts.length; i++) {
    const oldProduct = oldProducts.find(
      (product) => product.id === sortedNewProducts[i].id
    );
    const fluctuation =
      ((sortedNewProducts[i].priceForProteinGram -
        oldProduct.priceForProteinGram) *
        100) /
      oldProduct.priceForProteinGram;
    const oldIndex =
      sortedOldProducts.findIndex(
        (product) => product.id === sortedNewProducts[i].id
      ) + 1;

    if (fluctuation !== 0) {
      fluctuationsHappened = true;
    }

    table += "<tr>";
    table += `<td style="border:1px solid black;padding:10px;">${oldProduct.name}</td>`;
    table += `<td style="border:1px solid black;padding:10px;">${oldProduct.price}</td>`;
    table += `<td style="border:1px solid black;padding:10px;">${sortedNewProducts[i].price}</td>`;
    table += `<td style="border:1px solid black;padding:10px;">${oldProduct.priceForProteinGram}</td>`;
    table += `<td style="border:1px solid black;padding:10px;">${sortedNewProducts[i].priceForProteinGram}</td>`;
    table += `<td style="border:1px solid black;padding:10px;background-color:${getColorByFluctuation(
      fluctuation
    )}">${fluctuation.toFixed(2) + "%"}</td>`;
    table += `<td style="border:1px solid black;padding:10px;">${oldIndex}</td>`;
    table += `<td style="border:1px solid black;padding:10px;background-color:${getColorByNewIndex(
      oldIndex - (i + 1)
    )}">${i + 1}</td>`;
    table += "</tr>";
  }
  table += "</table>";
  return { table, fluctuationsHappened };
};

const getColorByFluctuation = (fluctuation) => {
  if (fluctuation < 0) {
    return "red";
  } else if (fluctuation > 0) {
    return "green";
  } else {
    return "white";
  }
};

const getColorByNewIndex = (dif) => {
  if (dif < 0) {
    return "red";
  } else if (dif > 0) {
    return "green";
  } else {
    return "white";
  }
};
module.exports = { sendMail };
