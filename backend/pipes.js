const {
  getProducts,
  addTimeInTopTenToProduct,
  updateProduct,
} = require("./database/database");
const { sendMail } = require("./email");
const {
  applyDiscount,
  getTrustPilotScore,
  toWordpressJson,
  calculateProteinPrice,
} = require("./helpers");
const { performActions } = require("./scraper");
const { deleteAllPosts, createPost } = require("./wordpress");

const ALLOWED_WARNINGS = 15;
const PRODUCT_NUMBER = null;
// const PRODUCT_NUMBER = 10;

const scrapeAndPush = async () => {
  try {
    const { warnings, newProducts } = await executeAllScrapers();
    if (warnings.length < ALLOWED_WARNINGS) {
      await updateWordPress(newProducts);
      console.log("EVERYTHING OK. PUSHED TO WORDPRESS");
    } else {
      console.log(
        `TOO MANY WARNINGS ${warnings.length}. NOT PUSHING TO WORDPRESS`
      );
    }
    return newProducts;
  } catch (e) {
    console.log("Error in scrapeAndPush", e);
  }
};

const retrieveAndPush = async () => {
  try {
    const products = await getProducts();
    await updateWordPress(products);
    console.log("EVERYTHING OK. PUSHED TO WORDPRESS");
  } catch (e) {
    console.log("Error in retrieveAndPush", e);
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
  addProteinPrice(newProducts);
  await updateFirebase(newProducts);
  await addTrustPilotScore(newProducts);
  addTopTenCounts(newProducts);
  const warnings = getWarningUrls(newProducts);
  sendMail(warnings, oldProducts, newProducts);
  return { warnings, newProducts };
};

const scrapeAll = async (products) => {
  const scrapedProducts = products;
  for (const product of products) {
    const { price } = await performActions(product.scraper, product.url);
    product.price = price;
  }
  return scrapedProducts;
};

const addWarnings = (products) => {
  for (const product of products) {
    if (product.price === 0 || !product.ammount || !product.protein_per_100g) {
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

const addProteinPrice = (products) => {
  for (const product of products) {
    calculateProteinPrice(product);
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

  console.log("retrieved trustpilot scores", scores);

  for (const product of products) {
    product.trustPilotScore = scores[product.trustpilot_url];
  }
};

const addTopTenCounts = (products) => {
  products = products.sort(
    (a, b) => a.priceForProteinGram - b.priceForProteinGram
  );
  for (let i = 0; i < 10; i++) {
    addTimeInTopTenToProduct(products[i].id);
  }
};

const updateFirebase = async (products) => {
  for (const product of products) {
    await updateProduct(product.id, product);
  }
};

const updateWordPress = async (products) => {
  await deleteAllPosts();
  for (const product of products) {
    if (!product.warning && product.enabled) {
      const productAsAString = toWordpressJson(product);
      await createPost({
        title: product.name,
        content: productAsAString,
        status: "publish",
      });
    }
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
        severity: product.count_clicked.length,
      });
    }
  }
  return urls;
};

module.exports = {
  scrapeAndPush,
  retrieveAndPush,
};
