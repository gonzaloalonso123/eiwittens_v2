const { Builder, By, until, Select } = require("selenium-webdriver");
const chrome = require("selenium-webdriver/chrome");
const path = require("path");
const fs = require("fs");

const DEFAULT_TIMEOUT = 5000;
const RETRY_ATTEMPTS = 3;
const scraperOptions = [
  "--disable-popups",
  "--window-size=1920,1080",
  "--no-sandbox",
  "--disable-dev-shm-usage",
  "--disable-gpu",
  "--disable-extensions",
  "--remote-debugging-port=9230",
  "--disable-search-engine-choice-screen",
];

const performActions = async (actions, url, config = {}) => {
  let driver;
  let price = 0;
  let error = { text: "", index: -1, screenshot: null };
  let index = 0;
  const { cookieBannerXPaths = [], timeout = DEFAULT_TIMEOUT } = config;

  try {
    console.log("Performing actions on ->", url);
    let options = new chrome.Options();
    options.addArguments(...scraperOptions);

    driver = await new Builder()
      .forBrowser("chrome")
      .setChromeOptions(options)
      .build();

    await driver.executeScript(
      "Object.defineProperty(navigator, 'webdriver', {get: () => undefined});"
    );

    await driver.get(url);

    await handleCookieBanner(driver, cookieBannerXPaths, timeout);

    for (const action of actions) {
      const selector = action.selector || "xpath";
      price = await performActionWithRetry(
        driver,
        action,
        selector,
        price,
        timeout
      );
      index++;
    }
    console.log(`Collected price -> [${price}] -> [${cleanPrice(price)}]`);
  } catch (e) {
    console.error("[ERROR EXECUTING ACTION]", e);
    error.text = e.toString();
    error.index = index;
    price = 0;
    try {
      error.screenshot = await takeScreenshot(driver);
    } catch (screenshotError) {
      console.error("Error taking screenshot", screenshotError);
    }
  } finally {
    await driver?.quit();
    return { price: cleanPrice(price), error };
  }
};

const handleCookieBanner = async (driver, xpaths, timeout) => {
  for (const xpath of xpaths) {
    try {
      const element = await driver.wait(
        until.elementLocated(By.xpath(xpath)),
        timeout / 2
      );
      if (await element.isDisplayed()) {
        await element.click();
        await driver.sleep(1000); // Give time for banner to disappear
        console.log("Cookie banner handled");
        return;
      }
    } catch (e) {
      console.log("No cookie banner found with xpath:", xpath);
    }
  }
};

const performActionWithRetry = async (
  driver,
  action,
  selector,
  price,
  timeout
) => {
  for (let attempt = 1; attempt <= RETRY_ATTEMPTS; attempt++) {
    try {
      if (action.type === "click") {
        await performClickAction(driver, action, selector, timeout);
      } else if (action.type === "selectOption") {
        await performSelectOptionAction(driver, action, selector, timeout);
      } else if (action.type === "select") {
        price = await performSelectAction(
          driver,
          action,
          selector,
          price,
          timeout
        );
      } else if (action.type === "wait") {
        await driver.sleep(action.duration || 2000);
      }
      return price;
    } catch (e) {
      console.warn(
        `Attempt ${attempt} failed for action: ${action.type}`,
        e.message
      );
      if (attempt === RETRY_ATTEMPTS) throw e;
      await driver.sleep(1000 * attempt); // Exponential backoff
    }
  }
};

const performClickAction = async (driver, action, selector, timeout) => {
  const element = await driver.wait(
    until.elementLocated(By[selector](action.xpath)),
    timeout
  );
  await driver.wait(until.elementIsVisible(element), timeout);
  await driver.executeScript("arguments[0].scrollIntoView(true);", element);
  await element.click();
};

const performSelectOptionAction = async (driver, action, selector, timeout) => {
  const element = await driver.wait(
    until.elementLocated(By[selector](action.xpath)),
    timeout
  );
  const select = new Select(element);
  await select.selectByVisibleText(action.optionText);
};

const performSelectAction = async (
  driver,
  action,
  selector,
  price,
  timeout
) => {
  let selectedText = null;
  const element = await driver.wait(
    until.elementLocated(By[selector](action.xpath)),
    timeout
  );

  if (action.xpath.endsWith("/text()")) {
    let parentXPath = action.xpath.replace("/text()", "");
    let parentElement = await driver.findElement(By[selector](parentXPath));
    selectedText = await driver.executeScript(
      `
      return Array.from(arguments[0].childNodes)
        .filter(node => node.nodeType === Node.TEXT_NODE)
        .map(node => node.textContent.trim())
        .join("");
      `,
      parentElement
    );
  } else {
    selectedText = await element.getText();
  }
  price = price === 0 ? selectedText : price + "." + selectedText;
  return price;
};

const takeScreenshot = async (driver) => {
  return await driver.takeScreenshot();
};

const cleanPrice = (price) => {
  price = String(price);
  const final = parseFloat(
    price
      .replace(/[€£$]/g, "")
      .replace(",", ".")
      .replace(" ", "")
      .replace(/[^0-9.]/g, "")
  );
  return isNaN(final) ? 0 : final;
};

module.exports = { performActions };
