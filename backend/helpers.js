const { performActions } = require("./scraper");

const getElementToBeCompared = (product) => {
  if (product.type === "proteine") {
    return product.protein_per_100g;
  }
  if (product.type === "creatine") {
    return product.creatine_per_100g;
  }
};
const calculateProteinPrice = (product) => {
  const elementToBeCompared = getElementToBeCompared(product);
  const element_ammount = product.ammount * (elementToBeCompared / 100);
  const element_price = product.price / element_ammount;
  product.priceForElementGram = Number(element_price * 100).toFixed(2);
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
  calculateProteinPrice,
  applyDiscount,
  getTrustPilotScore,
};
