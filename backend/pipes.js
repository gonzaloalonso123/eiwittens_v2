const { getProducts, updateProduct } = require("./database/database")
const { sendMail, sendErrorMail } = require("./email")
const { applyDiscount, getTrustPilotScore, makeCalculations, isLessByPercentOf } = require("./helpers")
const { performActions } = require("./scraper")
const { productTracker } = require("./tracking-logger")

const ALLOWED_WARNINGS = 15
const PRODUCT_NUMBER = null
let isScraping = false

const addProductToTracking = (productId) => {
  productTracker.addToTracking(productId)
  console.log(`Product ${productId} added to tracking`)
}

const removeProductFromTracking = (productId) => {
  productTracker.removeFromTracking(productId)
  console.log(`Product ${productId} removed from tracking`)
}

const getTrackingSummary = () => {
  return productTracker.getTrackingSummary()
}

const writeTrackingLogs = async () => {
  await productTracker.writeAllLogsToFiles()
}

const scrapeAndPush = async () => {
  try {
    if (!isScraping) {
      isScraping = true

      // Log scraping session start
      for (const productId of productTracker.trackingProducts) {
        productTracker.log(productId, "SCRAPING_SESSION_START", "Starting new scraping session")
      }

      const { warnings, newProducts } = await executeAllScrapers()

      if (warnings.length < ALLOWED_WARNINGS) {
        sendErrorMail(`There are many warnings (${warnings.length})`)
      }

      // Log scraping session end and write logs
      for (const productId of productTracker.trackingProducts) {
        productTracker.log(productId, "SCRAPING_SESSION_END", "Scraping session completed")
      }

      // Write logs to files after each scraping session
      await writeTrackingLogs()

      isScraping = false
      return newProducts
    }
  } catch (e) {
    // Log errors for tracked products
    for (const productId of productTracker.trackingProducts) {
      productTracker.log(productId, "ERROR", "Scraping session failed", { error: e.message })
    }
    sendErrorMail(`catch error in scrapeAndPush: ${e}`)
  }
}

const executeAllScrapers = async () => {
  let oldProducts = (await getProducts()).filter((p) => p.enabled && p.scrape_enabled)

  if (PRODUCT_NUMBER) {
    oldProducts = oldProducts.slice(0, PRODUCT_NUMBER)
  }

  // Log which products are being processed
  for (const product of oldProducts) {
    if (productTracker.isTracking(product.id)) {
      productTracker.log(product.id, "PRODUCT_SELECTED", "Product selected for scraping", {
        enabled: product.enabled,
        scrape_enabled: product.scrape_enabled,
      })
    }
  }

  const newProducts = await scrapeAll(oldProducts)
  const productsWithSecurity = withSecurity(newProducts, oldProducts)
  addWarnings(productsWithSecurity)
  addDiscounts(productsWithSecurity)
  calculations(productsWithSecurity)
  await updateFirebase(productsWithSecurity)

  const warnings = getWarningUrls(productsWithSecurity)
  sendMail(warnings, oldProducts, productsWithSecurity)

  return { warnings, productsWithSecurity }
}

const refreshTrustPilot = async () => {
  const products = await getProducts()

  // Log TrustPilot refresh start for tracked products
  for (const product of products) {
    if (productTracker.isTracking(product.id)) {
      productTracker.logProcessStart(product.id, "TRUSTPILOT_REFRESH", product)
    }
  }

  await addTrustPilotScore(products)
  updateFirebase(products)

  // Log TrustPilot refresh end for tracked products
  for (const product of products) {
    if (productTracker.isTracking(product.id)) {
      productTracker.logProcessEnd(product.id, "TRUSTPILOT_REFRESH", {}, product)
    }
  }
}

const scrapeAll = async (products) => {
  const scrapedProducts = products.map((p) => ({ ...p }))

  for (let i = 0; i < products.length; i++) {
    const product = products[i]
    const beforeState = { ...product }

    if (productTracker.isTracking(product.id)) {
      productTracker.logProcessStart(product.id, "SCRAPING", beforeState)
    }

    const { price } = await performActions(
      product.scraper,
      product.url,
      {
        cookieBannerXPaths: product.cookieBannerXPaths,
      },
      "disabled",
    )

    scrapedProducts[i].price = price

    if (productTracker.isTracking(product.id)) {
      productTracker.logProcessEnd(product.id, "SCRAPING", beforeState, scrapedProducts[i])
    }
  }

  return scrapedProducts
}

const addWarnings = (products) => {
  for (const product of products) {
    const beforeState = { ...product }

    if (productTracker.isTracking(product.id)) {
      productTracker.logProcessStart(product.id, "WARNING_CHECK", beforeState)
    }

    if (product.price === 0 || !product.ammount) {
      product.warning = true
    } else {
      product.warning = false
    }

    if (productTracker.isTracking(product.id)) {
      productTracker.logProcessEnd(product.id, "WARNING_CHECK", beforeState, product)
    }
  }
}

const addDiscounts = (products) => {
  for (const product of products) {
    const beforeState = { ...product }

    if (productTracker.isTracking(product.id)) {
      productTracker.logProcessStart(product.id, "DISCOUNT_APPLICATION", beforeState)
    }

    applyDiscount(product)

    if (productTracker.isTracking(product.id)) {
      productTracker.logProcessEnd(product.id, "DISCOUNT_APPLICATION", beforeState, product)
    }
  }
}

const calculations = (products) => {
  for (const product of products) {
    const beforeState = { ...product }

    if (productTracker.isTracking(product.id)) {
      productTracker.logProcessStart(product.id, "CALCULATIONS", beforeState)
    }

    makeCalculations(product)

    if (productTracker.isTracking(product.id)) {
      productTracker.logProcessEnd(product.id, "CALCULATIONS", beforeState, product)
    }
  }
}

const addTrustPilotScore = async (products) => {
  const scores = {}

  for (const product of products) {
    if (product.trustpilot_url && !scores[product.trustpilot_url]) {
      if (productTracker.isTracking(product.id)) {
        productTracker.log(product.id, "TRUSTPILOT_FETCH", "Fetching TrustPilot score", {
          url: product.trustpilot_url,
        })
      }
      scores[product.trustpilot_url] = await getTrustPilotScore(product.trustpilot_url)
    }
  }

  for (const product of products) {
    if (scores[product.trustpilot_url]) {
      const beforeState = { ...product }
      product.trustPilotScore = scores[product.trustpilot_url]

      if (productTracker.isTracking(product.id)) {
        productTracker.log(product.id, "TRUSTPILOT_SCORE_APPLIED", "TrustPilot score applied", {
          score: product.trustPilotScore,
          url: product.trustpilot_url,
        })
      }
    }
  }
}

const withSecurity = (newProducts, allProducts) => {
  const newProductsWithSecurity = newProducts.map((newProduct) => {
    const oldProduct = allProducts.find((p2) => p2.id === newProduct.id)
    const beforeState = { ...newProduct }

    if (productTracker.isTracking(newProduct.id)) {
      productTracker.logProcessStart(newProduct.id, "SECURITY_CHECK", beforeState)
    }

    const isSignificantlyLess = isLessByPercentOf(newProduct, oldProduct, 30)

    const result = {
      ...newProduct,
      price: isSignificantlyLess ? oldProduct.price : newProduct.price,
      provisional_price: isSignificantlyLess ? newProduct.price : null,
    }

    if (productTracker.isTracking(newProduct.id)) {
      productTracker.logProcessEnd(newProduct.id, "SECURITY_CHECK", beforeState, result)

      if (isSignificantlyLess) {
        productTracker.log(newProduct.id, "SECURITY_ALERT", "Price significantly lower - using old price", {
          oldPrice: oldProduct.price,
          newPrice: newProduct.price,
          provisionalPrice: newProduct.price,
        })
      }
    }

    return result
  })

  return newProductsWithSecurity
}

const updateFirebase = async (products) => {
  for (const product of products) {
    const beforeState = { ...product }

    if (productTracker.isTracking(product.id)) {
      productTracker.logProcessStart(product.id, "DATABASE_UPDATE", beforeState)
    }

    await updateProduct(product.id, product)

    if (productTracker.isTracking(product.id)) {
      productTracker.logProcessEnd(product.id, "DATABASE_UPDATE", beforeState, product)
    }
  }
}

const getWarningUrls = (products) => {
  const urls = []
  const dashboardUrl = "https://eiwittens.web.app/products"

  for (const product of products) {
    if (product.warning) {
      urls.push({
        url: `${dashboardUrl}/${product.id}`,
        name: product.name,
        severity: product.count_clicked?.length,
      })

      if (productTracker.isTracking(product.id)) {
        productTracker.log(product.id, "WARNING_GENERATED", "Product added to warning list", {
          url: `${dashboardUrl}/${product.id}`,
          severity: product.count_clicked?.length,
        })
      }
    }
  }

  return urls
}

module.exports = {
  scrapeAndPush,
  refreshTrustPilot,
  // New tracking functions
  addProductToTracking,
  removeProductFromTracking,
  getTrackingSummary,
  writeTrackingLogs,
  productTracker,
}
