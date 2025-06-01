const { getProducts, updateProduct } = require("./database/database");
const { sendMail, sendErrorMail } = require("./email");
const {
  applyDiscount,
  getTrustPilotScore,
  makeCalculations,
  is30PercentLess,
} = require("./helpers");
const { performActions } = require("./scraper");

const ALLOWED_WARNINGS = 15;
const PRODUCT_NUMBER = null;
let isScraping = false;
// const PRODUCT_NUMBER = 10;

const scrapeAndPush = async () => {
  try {
    if (!isScraping) {
      isScraping = true;
      const { warnings, newProducts } = await executeAllScrapers();
      if (warnings.length < ALLOWED_WARNINGS) {
        sendErrorMail(`There are many warnings (${warnings.length})`);
      }
      isScraping = false;
      return newProducts;
    }
  } catch (e) {
    console.log("Error in scrapeAndPush", e);
    sendErrorMail(`catch error in scrapeAndPush: ${e}`);
  }
};

const executeAllScrapers = async () => {
  let oldProducts = (await getProducts()).filter((p) => p.enabled);
  if (PRODUCT_NUMBER) {
    oldProducts = oldProducts.slice(0, PRODUCT_NUMBER);
  }
  const newProducts = await scrapeAll(oldProducts);
  addWarnings(newProducts);
  addDiscounts(newProducts);
  calculations(newProducts);
  await updateFirebase(withSecurity(newProducts, oldProducts));
  const warnings = getWarningUrls(newProducts);
  sendMail(warnings, oldProducts, newProducts);
  return { warnings, newProducts };
};

const refreshTrustPilot = async () => {
  const products = await getProducts();
  await addTrustPilotScore(products);
  updateFirebase(products);
};

const scrapeAll = async (products) => {
  const scrapedProducts = products.map((p) => ({ ...p }));
  for (let i = 0; i < products.length; i++) {
    const product = products[i];
    if (product.scrape_enabled) {
      const { price } = await performActions(
        product.scraper,
        product.url,
        {
          cookieBannerXPaths: product.cookieBannerXPaths,
        },
        "disabled"
      );
      scrapedProducts[i].price = price;
    }
  }
  return scrapedProducts;
};

const addWarnings = (products) => {
  for (const product of products) {
    if (
      product.price === 0 ||
      !product.ammount ||
      (!product.protein_per_100g && !product.creatine_per_100g)
    ) {
      product.warning = true;
    } else {
      product.warning = false;
    }
  }
};

const addDiscounts = (products) => {
  for (const product of products) {
    applyDiscount(product);
  }
};

const calculations = (products) => {
  for (const product of products) {
    makeCalculations(product);
  }
};

const addTrustPilotScore = async (products) => {
  const scores = {};

  for (const product of products) {
    if (product.trustpilot_url && !scores[product.trustpilot_url]) {
      scores[product.trustpilot_url] = await getTrustPilotScore(
        product.trustpilot_url
      );
    }
  }

  for (const product of products) {
    if (scores[product.trustpilot_url]) {
      product.trustPilotScore = scores[product.trustpilot_url];
    }
  }
};

const withSecurity = (newProducts, allProducts) => {
  // this function is to check if the price is significantly less than the old price, if so, we set the price to the old price,
  // and set the provisional_price to the new price, so the user will have to manually check it, and then approve it.
  const newProductsWithSecurity = newProducts.map((p) => {
    const oldProduct = allProducts.find((p2) => p2.id === p.id);
    const isSignificantlyLess = is30PercentLess(p, oldProduct);
    return {
      ...p,
      price: isSignificantlyLess ? oldProduct.price : p.price,
      provisional_price: isSignificantlyLess ? p.price : null,
    };
  });
  return newProductsWithSecurity;
};

const updateFirebase = async (products) => {
  for (const product of products) {
    await updateProduct(product.id, product);
  }
};

const getWarningUrls = (products) => {
  const urls = [];
  const dashboardUrl = "https://eiwittens.web.app/products";
  for (const product of products) {
    if (product.warning) {
      urls.push({
        url: `${dashboardUrl}/${product.id}`,
        name: product.name,
        severity: product.count_clicked?.length,
      });
    }
  }
  return urls;
};

module.exports = {
  scrapeAndPush,
  refreshTrustPilot,
};
