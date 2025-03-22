import { Builder, By, until, Select } from "selenium-webdriver";
import chrome from "selenium-webdriver/chrome.js";
import { attemptAIPriceExtraction } from "./ia-scraping.js";

const DEFAULT_TIMEOUT = 1000;
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
const defaultCookieBannerXPaths = [
  "//button[contains(text(), 'Accept')]",
  "//button[contains(text(), 'Accept All')]",
  "//button[contains(@class, 'cookie-accept')]",
  "//button[contains(@id, 'onetrust-accept-btn-handler')]",
  "//button[contains(@id, 'CybotCookiebotDialogBodyLevelButtonLevelOptinAllowAll')]",
];

export const performActions = async (actions, url, config = {}) => {
  let driver;
  let price = 0;
  const error = { text: "", index: -1, screenshot: null };
  let index = 0;
  const {
    cookieBannerXPaths = [
      ...defaultCookieBannerXPaths,
      ...config.cookieBannerXPaths,
    ],
    timeout = DEFAULT_TIMEOUT,
  } = config;

  try {
    console.log("Performing actions on ->", url);
    const options = new chrome.Options();
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
    if (cleanPrice(price) === 0) {
      console.log(
        "Regular scraping failed to extract price. Attempting AI-powered extraction..."
      );
      const aiResult = await attemptAIPriceExtraction(driver, url);

      if (aiResult.price > 0) {
        return {
          price: aiResult.price,
          error: { text: "", index: -1, screenshot: null },
          generatedActions: aiResult.actions,
        };
      }
    }

    return {
      price: cleanPrice(price),
      error,
      generatedActions: null,
    };
  } catch (e) {
    console.error("[ERROR EXECUTING ACTION]", e);
    error.text = e.toString();
    error.index = index;
    price = 0;

    try {
      error.screenshot = await takeScreenshot(driver);
      console.log(
        "Regular scraping failed with error. Attempting AI-powered extraction..."
      );
      const aiResult = await attemptAIPriceExtraction(driver, url);

      if (aiResult.price > 0) {
        return {
          price: aiResult.price,
          error: { text: "", index: -1, screenshot: null },
          generatedActions: aiResult.actions,
        };
      }
    } catch (screenshotError) {
      console.error("Error taking screenshot", screenshotError);
    }

    return {
      price: 0,
      error,
      generatedActions: null,
    };
  } finally {
    await driver?.quit();
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
        await driver.sleep(1000);
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
      await driver.sleep(1000 * attempt);
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
    const parentXPath = action.xpath.replace("/text()", "");
    const parentElement = await driver.findElement(By[selector](parentXPath));
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
  const final = Number.parseFloat(
    price
      .replace(/[€£$]/g, "")
      .replace(",", ".")
      .replace(" ", "")
      .replace(/[^0-9.]/g, "")
  );
  return isNaN(final) ? 0 : final;
};

export default {
  performActions,
};
