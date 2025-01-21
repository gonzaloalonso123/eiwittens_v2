export const formatDate = (raw) => {
  const { seconds, nanoseconds } = raw;
  const date = new Date(seconds * 1000 + nanoseconds / 1000000);
  const year = date.getFullYear();
  const month = date.getMonth() + 1;
  const day = date.getDate();

  return `${year}-${month < 10 ? "0" + month : month}-${day < 10 ? "0" + day : day}`;
};

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
  }

  console.log(product);
};

const getPriceByAHundredGrams = (product, element) => {
  const element_ammount = product.ammount * (element / 100);
  const element_price = product.price / element_ammount;
  return Number(element_price * 100).toFixed(2);
};
