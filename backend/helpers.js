const { performActions } = require("./scraper");

const calculateProteinPrice = (product) => {
  const protein_ammount = product.ammount * (product.protein_per_100g / 100);
  const protein_price = product.price / protein_ammount;
  product.priceForProteinGram = Number(protein_price * 100).toFixed(2);
};

const applyDiscount = (product) => {
  if (product.discount_value) {
    if (product.discount_type === "percentage") {
      product.price =
        product.price - product.price * (product.discount_value / 100);
    } else {
      product.price = product.price - product.discount_value;
    }

    try {
      product.price = Number(product.price).toFixed(2);
    } catch (e) {}
  }
};

const getTrustPilotScore = async (url) => {
  const { price: trustpilot_score } = await performActions(
    [
      {
        selector: "xpath",
        xpath: '//*[@id="business-unit-title"]/div/div/p',
        type: "select",
      },
    ],
    "https://www.trustpilot.com/review/" + url
  );
  return trustpilot_score;
};

const toWordpressJson = (product) => {
  const entries = [];
  Object.entries(product)
    .filter(
      ([key, _]) =>
        ![
          "price_history",
          "scraper",
          "warning",
          "count_top10",
          "count_clicked",
        ].includes(key)
    )
    .forEach(([key, value]) => {
      const val =
        typeof value === "string" 
          ? `$${value}$`
          : JSON.stringify(value)?.replace(/"/g, "$") || '$$';
      entries.push(`$${key}$: ${val}`);
    });
  const productAsAString = `{${entries.join(",")}}`;

  console.log(productAsAString);
  return productAsAString;
};

module.exports = {
  calculateProteinPrice,
  applyDiscount,
  getTrustPilotScore,
  toWordpressJson,
};
