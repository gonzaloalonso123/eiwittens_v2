const { performActions } = require("./scraper");

const getElementToBeCompared = (product) => {
  if (product.type === "proteine") {
    return product.protein_per_100g;
  }
  if (product.type === "creatine") {
    return product.creatine_per_100g;
  }
};
const makeCalculations = (product) => {
  const elementToBeCompared = getElementToBeCompared(product);
  const priceForElementGram = getPriceByAHundredGrams(product, elementToBeCompared);
  product.priceForElementGram = priceForElementGram;
  if (product.subtypes.includes("weight_gainer")) {
    product.price_per_100_calories = getPriceByAHundredGrams(product, product.calories_per_100g);
  }
};

const getPriceByAHundredGrams = (product, element) => {
  const element_ammount = product.ammount * (element / 100);
  const element_price = product.price / element_ammount;
  return Number(element_price * 100).toFixed(2);
};

const applyDiscount = (product) => {
  if (product.discount_value) {
    if (product.discount_type === "percentage") {
      product.price = product.price - product.price * (product.discount_value / 100);
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

module.exports = {
  makeCalculations,
  applyDiscount,
  getTrustPilotScore,
};
