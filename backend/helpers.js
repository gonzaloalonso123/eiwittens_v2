import { performActions } from "./scraper.js";

const getElementToBeCompared = (product) => {
  if (product.type === "proteine" || product.type === "weight_gainer") {
    return product.protein_per_100g;
  }
  if (product.type === "creatine") {
    return product.creatine_per_100g;
  }
};
const makeCalculations = (product) => {
  const elementToBeCompared = getElementToBeCompared(product);
  const price_for_element_gram = getPriceByAHundredGrams(product, elementToBeCompared);
  product.price_for_element_gram = price_for_element_gram;
  if (product.type == "weight_gainer") {
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
    "https://www.trustpilot.com/review/" + url,
    {}
  );
  return trustpilot_score;
};

export const isLessByPercentOf = (newProduct, oldProduct, percent) => {
  const newElement = getElementToBeCompared(newProduct);
  const oldElement = getElementToBeCompared(oldProduct);
  if (!newElement || !oldElement) return false;

  const newPrice = getPriceByAHundredGrams(newProduct, newElement);
  const oldPrice = getPriceByAHundredGrams(oldProduct, oldElement);

  return newPrice < oldPrice * (1 - percent / 100);
};

module.exports = {
  makeCalculations,
  applyDiscount,
  getTrustPilotScore,
  is30PercentLess,
};
