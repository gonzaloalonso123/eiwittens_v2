import { Builder, By, until, Select } from "selenium-webdriver";
import chrome from "selenium-webdriver/chrome.js";
import OpenAI from "openai";
import { JSDOM } from "jsdom";
import { v4 as uuidv4 } from "uuid";
import { configDotenv } from "dotenv";

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

const openai = new OpenAI({
  apiKey: configDotenv().parsed.OPENAI_API_KEY,
});

export const performActions = async (actions, url, config = {}) => {
  let driver;
  let price = 0;
  const error = { text: "", index: -1, screenshot: null };
  let index = 0;
  const { cookieBannerXPaths = [], timeout = DEFAULT_TIMEOUT } = config;

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
const getPageHTML = async (driver) => {
  return await driver.executeScript(
    "return document.documentElement.outerHTML"
  );
};

const cleanHTML = (html) => {
  const dom = new JSDOM(html);
  const document = dom.window.document;
  const elementsToRemove = document.querySelectorAll(
    "script, style, iframe, img, svg, link, meta, noscript, footer, header, nav, aside"
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

const attemptAIPriceExtraction = async (driver, url) => {
  try {
    const html = await getPageHTML(driver);
    const cleanedHTML = cleanHTML(html);
    const aiResponse = await sendToOpenAI(cleanedHTML);
    const { price, selectorType, selector } = aiResponse;

    console.log(aiResponse);

    try {
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

      return {
        price: extractedPrice > 0 ? extractedPrice : cleanPrice(price),
        actions: actions,
      };
    } catch (error) {
      console.error("Error verifying AI-extracted price:", error);
      return {
        price: cleanPrice(price),
        actions: [
          {
            id: uuidv4(),
            type: "select",
            selector: selectorType || "xpath",
            xpath: selector,
          },
        ],
      };
    }
  } catch (error) {
    console.error("Error in AI price extraction:", error);
    return { price: 0, actions: [] };
  }
};

export default {
  performActions,
};
