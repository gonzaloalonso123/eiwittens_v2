import { Builder, By, until, Select } from "selenium-webdriver";
import chrome from "selenium-webdriver/chrome.js";
import OpenAI from "openai";
import { JSDOM } from "jsdom";
import { v4 as uuidv4 } from "uuid";
import { configDotenv } from "dotenv";

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

const DEFAULT_COOKIE_BANNER_XPATHS = [
  "//button[contains(text(), 'Accept')]",
  "//button[contains(text(), 'Accept All')]",
  "//button[contains(@class, 'cookie-accept')]",
  "//button[contains(@id, 'onetrust-accept-btn-handler')]",
  "//*[@id='onetrust-accept-btn-handler']",
];

export const performActions = async (
  actions,
  url,
  config = {},
  aiMode = "disabled"
) => {
  let driver = null;
  let price = 0;
  let generatedActions = [];
  let error = {
    text: "",
    index: -1,
    screenshot: null,
    details: null,
  };

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

    await Promise.race([
      driver.get(url),
      new Promise((_, reject) =>
        setTimeout(
          () => reject(new Error("Page load timeout")),
          SCRAPER_CONFIG.DEFAULT_TIMEOUT
        )
      ),
    ]);

    await handleCookieBanner(
      driver,
      [...(config.cookieBannerXPaths || []), ...DEFAULT_COOKIE_BANNER_XPATHS],
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
          (i) => (error.index = i)
        );
        logger.info(`Collected price -> [${price}] -> [${cleanPrice(price)}]`);
      } catch (actionError) {
        logger.error("Regular actions failed", actionError);
        error.text = actionError.message;
        try {
          error.screenshot = driver
            ? await takeScreenshot(driver)
            : "Driver unavailable";
        } catch (screenshotError) {
          logger.error("Screenshot capture failed", screenshotError);
        }
        throw actionError;
      }
    } else {
      throw new Error("Skipping regular actions");
    }
  } catch (mainError) {
    logger.error("Main error", mainError);
    if (aiMode !== "disabled") {
      logger.info("Attempting AI-powered extraction");
      try {
        const { actions: aiActions, price: aiPrice } =
          await attemptAIPriceExtraction(driver, url);
        generatedActions = aiActions;
        price = aiPrice;
      } catch (aiExtractionError) {
        logger.error("AI-powered extraction failed", aiExtractionError);
      }
    }
    error.text = mainError.message;
    error.index = 0;
  } finally {
    if (driver) {
      try {
        await driver.quit();
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
  options.addArguments(...SCRAPER_OPTIONS);
  const driver = await new Builder()
    .forBrowser("chrome")
    .setChromeOptions(options)
    .build();
  await driver.executeScript(
    "Object.defineProperty(navigator, 'webdriver', {get: () => undefined});"
  );
  return driver;
};

const performRegularActions = async (driver, actions, timeout, setIndex) => {
  let price = 0;
  for (const [index, action] of actions.entries()) {
    setIndex(index);
    const selector = action.selector || "xpath";
    price = await performActionWithRetry(
      driver,
      action,
      selector,
      price,
      timeout
    );
  }
  return price;
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
    } catch (e) {}
  }
};

const performActionWithRetry = async (
  driver,
  action,
  selector,
  price,
  timeout
) => {
  for (
    let attempt = 1;
    attempt <= SCRAPER_CONFIG.MAX_RETRY_ATTEMPTS;
    attempt++
  ) {
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
          price = await performSelectAction(
            driver,
            action,
            selector,
            price,
            timeout
          );
          break;
        case "wait":
          await driver.sleep(action.duration || 2000);
          break;
        default:
          throw new Error(`Unsupported action type: ${action.type}`);
      }

      return price;
    } catch (e) {
      logger.warn(
        `Attempt ${attempt} failed for action: ${action.type}`,
        e.message
      );

      if (attempt === SCRAPER_CONFIG.MAX_RETRY_ATTEMPTS) {
        throw e;
      }
      await driver.sleep(SCRAPER_CONFIG.RETRY_BACKOFF_BASE);
    }
  }
};

const performClickAction = async (driver, action, selector, timeout) => {
  const element = await driver.wait(
    until.elementLocated(By[selector](action.xpath)),
    timeout
  );
  await driver.wait(until.elementIsVisible(element), timeout);
  // await driver.executeScript("arguments[0].scrollIntoView(true);", element);
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

const openai = new OpenAI({
  apiKey: configDotenv().parsed.OPENAI_API_KEY,
});

const getPageHTML = async (driver) => {
  return await driver.executeScript(
    "return document.documentElement.outerHTML"
  );
};

const cleanHTML = (html) => {
  const dom = new JSDOM(html);
  const document = dom.window.document;
  const elementsToRemove = document.querySelectorAll(
    "script, style, iframe, img, svg, link, meta, noscript, footer"
  );
  elementsToRemove.forEach((element) => element.remove());
  return document.body.innerHTML;
};

const sendToOpenAI = async (html) => {
  const prompt = `Analyze this HTML and identify the product price. Return the price and how to select the element with selenium. Use the most reliable option for this case (xpath or css selector). Return a JSON with: price (string), selectorType (string: "xpath" or "css"), and selector (string).`;

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

  const element = await driver.findElement(
    By[selectorType || "xpath"](selector)
  );
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

  console.log(
    `AI extracted price: [${extractedPrice}] and scraping with xpath: [${selector}] return [${extractedText}]`
  );

  return {
    price: extractedPrice === price ? extractedPrice : 0,
    actions: extractedPrice === price ? actions : [],
  };
};

export default {
  performActions,
};
