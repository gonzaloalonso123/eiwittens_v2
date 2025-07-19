import { Builder, By, until, Select } from "selenium-webdriver";
import chrome from "selenium-webdriver/chrome.js";
import OpenAI from "openai";
import { JSDOM } from "jsdom";
import { v4 as uuidv4 } from "uuid";
import { configDotenv } from "dotenv";
import fs from "fs/promises";
import os from "os";
import path from "path";

const logger = {
  info: (message, ...args) => {
    console.log(`[INFO] ${message}`, ...args);
  },
  warn: (message, ...args) => {
    console.warn(`[WARN] ${message}`, ...args);
  },
  error: (message, error, ...args) => {
    console.error(`[ERROR] ${message}`, error, ...args);
  },
};

const SCRAPER_CONFIG = {
  DEFAULT_TIMEOUT: 1000,
  MAX_RETRY_ATTEMPTS: 3,
  RETRY_BACKOFF_BASE: 1000,
  AI_EXTRACTION_TIMEOUT: 2000,
};

const SCRAPER_OPTIONS = [
  "--disable-popups",
  "--window-size=1920,1080",
  "--no-sandbox",
  "--disable-dev-shm-usage",
  "--disable-gpu",
  "--disable-extensions",
  "--remote-debugging-port=9230",
  "--disable-search-engine-choice-screen",
  // "--headless",
];

const DEFAULT_COOKIE_BANNERS = [
  { by: "xpath", selector: "//button[contains(text(), 'Accept')]" },
  { by: "xpath", selector: "//button[contains(text(), 'Accept All')]" },
  { by: "xpath", selector: "//button[contains(text(), 'Alles accepteren')]" },
  { by: "xpath", selector: "//button[contains(@class, 'accept-cookies')]" },
  { by: "xpath", selector: "//button[contains(@id, 'onetrust-accept-btn-handler')]" },
  { by: "xpath", selector: '//*[@id="CybotCookiebotDialogBodyLevelButtonLevelOptinAllowAll"]' },
  { by: "xpath", selector: "//*[@id='onetrust-accept-btn-handler']" },
  { by: "xpath", selector: "/html/body/div[2]/div/div/div/button[3]" },
];

let profileDir;

export const performActions = async (actions, url, config = {}, aiMode = "disabled") => {
  let driver = null;
  let price = 0;
  let generatedActions = [];
  let error = {
    text: "",
    index: -1,
    screenshot: null,
    details: null,
  };
  let tempErrorIndex = -1;

  try {
    if (!url) {
      throw new Error("URL is required");
    }
    if (!Array.isArray(actions) || actions.length === 0) {
      throw new Error("Actions must be a non-empty array");
    }
    driver = await initializeDriver().catch((driverError) => {
      logger.error("Failed to initialize WebDriver", driverError);
      throw new Error(`Driver Initialization Failed: ${driverError.message}`);
    });

    await driver.get(url);
    await handleCookieBanner(
      driver,
      [...(config.cookieBannerXPaths || []), ...DEFAULT_COOKIE_BANNERS],
      config.timeout || SCRAPER_CONFIG.DEFAULT_TIMEOUT
    ).catch((cookieBannerError) => {
      logger.warn("Cookie banner handling failed", cookieBannerError);
    });

    if (aiMode !== "prefered") {
      try {
        price = await performRegularActions(
          driver,
          actions,
          config.timeout || SCRAPER_CONFIG.DEFAULT_TIMEOUT,
          (i) => (tempErrorIndex = i)
        );
        logger.info(`Collected price -> [${price}] -> [${cleanPrice(price)}]`);
      } catch (actionError) {
        logger.error("Regular actions failed", actionError);
        try {
          error.screenshot = driver ? await takeScreenshot(driver) : "Driver unavailable";
        } catch (screenshotError) {
          logger.error("Screenshot capture failed", screenshotError);
        }
        throw actionError;
      }
    } else {
      throw new Error("Skipping regular actions");
    }
  } catch (mainError) {
    if (aiMode !== "disabled") {
      logger.info("Attempting AI-powered extraction");
      try {
        const { actions: aiActions, price: aiPrice } = await attemptAIPriceExtraction(driver, url);
        generatedActions = aiActions;
        price = aiPrice;
      } catch (aiExtractionError) {
        logger.error("AI-powered extraction failed", aiExtractionError);
      }
    }
    error.index = tempErrorIndex;
    error.text = mainError.message;
  } finally {
    if (driver) {
      try {
        await driver.quit();
        if (profileDir) await fs.rm(profileDir, { recursive: true, force: true });
      } catch (quitError) {
        logger.error("Error quitting WebDriver", quitError);
      }
    }
    return {
      price: cleanPrice(price),
      error,
      generatedActions,
    };
  }
};

const initializeDriver = async () => {
  const options = new chrome.Options();
  profileDir = await makeProfileDir();
  options.addArguments(...SCRAPER_OPTIONS, `--user-data-dir=${profileDir}`);
  const driver = await new Builder().forBrowser("chrome").setChromeOptions(options).build();
  await driver.executeScript("Object.defineProperty(navigator, 'webdriver', {get: () => undefined});");
  return driver;
};

const performRegularActions = async (driver, actions, timeout, setIndex) => {
  let price = 0;
  for (const [index, action] of actions.entries()) {
    setIndex(index);
    const selector = action.selector || "xpath";
    price = await performActionWithRetry(driver, action, selector, price, timeout);
  }
  return price;
};

const handleCookieBanner = async (driver, banners, timeout) => {
  for (const banner of banners) {
    try {
      console.log(`Trying to handle cookie banner: ${JSON.stringify(banner)}`);
      const element = await driver.wait(until.elementLocated(By[banner.by ?? "xpath"](banner.selector)), timeout / 2);
      if (await element.isDisplayed()) {
        await element.click();
        await driver.sleep(1000);
        return;
      }
    } catch (e) {}
  }
};

const performActionWithRetry = async (driver, action, selector, price, timeout) => {
  for (let attempt = 1; attempt <= SCRAPER_CONFIG.MAX_RETRY_ATTEMPTS; attempt++) {
    try {
      if (!action || !action.type) {
        throw new Error("Invalid action: Missing type");
      }

      switch (action.type) {
        case "click":
          await performClickAction(driver, action, selector, timeout);
          break;
        case "selectOption":
          await performSelectOptionAction(driver, action, selector, timeout);
          break;
        case "select":
          price = await performSelectAction(driver, action, selector, price, timeout);
          break;
        case "wait":
          await driver.sleep(action.duration || 2000);
          break;
        default:
          throw new Error(`Unsupported action type: ${action.type}`);
      }

      return price;
    } catch (e) {
      logger.warn(`Attempt ${attempt} failed for action: ${action.type}`, e.message);

      if (attempt === SCRAPER_CONFIG.MAX_RETRY_ATTEMPTS) {
        throw e;
      }
      await driver.sleep(SCRAPER_CONFIG.RETRY_BACKOFF_BASE);
    }
  }
};

const performClickAction = async (driver, action, selector, timeout) => {
  const element = await driver.wait(until.elementLocated(By[selector](action.xpath)), timeout);
  await driver.wait(until.elementIsVisible(element), timeout);
  // await driver.executeScript("arguments[0].scrollIntoView(true);", element);
  await element.click();
};

const performSelectOptionAction = async (driver, action, selector, timeout) => {
  const element = await driver.wait(until.elementLocated(By[selector](action.xpath)), timeout);
  const select = new Select(element);
  await select.selectByVisibleText(action.optionText);
};

const performSelectAction = async (driver, action, selector, price, timeout) => {
  let selectedText = null;
  const element = await driver.wait(until.elementLocated(By[selector](action.xpath)), timeout);

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

const openai = new OpenAI({
  apiKey: configDotenv().parsed.OPENAI_API_KEY,
});

const getPageHTML = async (driver) => {
  return await driver.executeScript("return document.documentElement.outerHTML");
};

const cleanHTML = (html) => {
  const dom = new JSDOM(html);
  const document = dom.window.document;
  const elementsToRemove = document.querySelectorAll("script, style, iframe, img, svg, link, meta, noscript, footer");
  elementsToRemove.forEach((element) => element.remove());
  return document.body.innerHTML;
};

const sendToOpenAI = async (html) => {
  const prompt = `Analyze this HTML and identify the product price. Return the price and how to select the element with selenium. Use the most robust option for this case (xpath or css selector). Return a JSON with: price (string), selectorType (string: "xpath" or "css"), and selector (string). Take into account that if the price changes, the selector should still work. Make sure to use the most reliable selector and selectorType.`;

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content:
            "You are an expert in web scraping and HTML analysis. Your task is to identify product prices and create reliable selectors for them.",
        },
        {
          role: "user",
          content: prompt,
        },
        {
          role: "user",
          content: html,
        },
      ],
      response_format: {
        type: "json_object",
      },
    });

    console.log("OpenAI usage:", completion.usage);
    const content = completion.choices[0].message.content;
    return JSON.parse(content);
  } catch (error) {
    console.error("Error calling OpenAI:", error);
    throw error;
  }
};

export const attemptAIPriceExtraction = async (driver, url) => {
  const html = await getPageHTML(driver);
  const cleanedHTML = cleanHTML(html);
  const aiResponse = await sendToOpenAI(cleanedHTML);
  const { price, selectorType, selector } = aiResponse;

  const element = await driver.findElement(By[selectorType || "xpath"](selector));
  const extractedText = await element.getText();
  const extractedPrice = cleanPrice(extractedText);
  const actions = [
    {
      id: uuidv4(),
      type: "select",
      selector: selectorType || "xpath",
      xpath: selector,
    },
  ];

  return {
    price: extractedPrice,
    actions: actions,
  };
};

const makeProfileDir = () => {
  const dir = path.join(os.tmpdir(), `chrome-profile-${uuidv4()}`);
  return fs.mkdir(dir).then(() => dir);
};

export default {
  performActions,
};
