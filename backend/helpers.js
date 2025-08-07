import { performActions } from "./scraper.js";

const getElementToBeCompared = (product) => {
  if (product.type === "proteine" || product.type === "weight_gainer") {
    return product.protein_per_100g;
  }
  if (product.type === "creatine") {
    return product.creatine_per_100g;
  }
};
export const makeCalculations = (product) => {
  const elementToBeCompared = getElementToBeCompared(product);
  const price_for_element_gram = getPriceByAHundredGrams(product, elementToBeCompared);
  product.price_for_element_gram = price_for_element_gram;
  if (product.type == "weight_gainer") {
    product.price_per_100_calories = getPriceByAHundredGrams(product, product.calories_per_100g);
  } else if (product.type == "preworkout" && product.dose && product.ammount && product.price) {
    product.price_per_dose = getPricePerDose(product);
  } else if (product.type === "weight_gainer" && product.calories_per_100g && product.ammount && product.price) {
    product.price_per_1000_calories = getPriceFor1000Calories(product);
  }
};

export const getPricePerDose = (product) => {
  const dose = Number.parseFloat(product.dose);
  const totalAmount = Number.parseFloat(product.ammount);
  const price = Number.parseFloat(product.price.toString());
  const totalDoses = totalAmount / dose;
  const pricePerDose = price / totalDoses;
  return pricePerDose.toFixed(2);
};

export const getPriceFor1000Calories = (product) => {
  const caloriesAmount = Number.parseFloat(product.calories_per_100g);
  const totalAmount = Number.parseFloat(product.ammount);
  const price = Number.parseFloat(product.price.toString());
  const totalCalories = (caloriesAmount * totalAmount) / 100;
  const pricePerCalories = (price / totalCalories) * 100;
  return pricePerCalories.toFixed(2);
}

export const getPriceByAHundredGrams = (product, element) => {
  const element_ammount = product.ammount * (element / 100);
  const element_price = product.price / element_ammount;
  return Number(element_price * 100).toFixed(2);
};

export const applyDiscount = (product) => {
  if (product.discount_value) {
    if (product.discount_type === "percentage") {
      product.price = product.price - product.price * (product.discount_value / 100);
    } else {
      product.price = product.price - product.discount_value;
    }

    try {
      product.price = Number(product.price).toFixed(2);
    } catch (e) { }
  }
};

export const getTrustPilotScore = async (url) => {
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
