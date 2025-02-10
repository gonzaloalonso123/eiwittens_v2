const { Builder, By, until, Select } = require("selenium-webdriver");
const chrome = require("selenium-webdriver/chrome");
const path = require('path');
const fs = require('fs');

const scraperOptions = [
  "--disable-popups",
//   "--headless",
  "--window-size=1920,1080",
  "--start-maximized",
  "--no-sandbox",
  "--disable-dev-shm-usage",
  "--disable-gpu",
  "--disable-extensions",
  "--remote-debugging-port=9230",
  "--disable-search-engine-choice-screen",
];

const performActions = async (actions, url) => {
  let driver;
  let price = 0;
  let error = {
    text: "",
    index: -1,
  };
  let index = 0;
  try {
    console.log("Performing actions on ->", url);
    let options = new chrome.Options();
    options.addArguments(...scraperOptions);

    driver = await new Builder()
      .forBrowser("chrome")
      .setChromeOptions(options)
      .build();

	await driver.executeScript("Object.defineProperty(navigator, 'webdriver', {get: () => undefined});");

    await driver.get(url);

    for (const action of actions) {
      const selector = action.selector || "xpath";
      price = await performAction(driver, action, selector, price);
      index++;
    }
    console.log(`Collected price -> [${price}] -> [${cleanPrice(price)}]`);
  } catch (e) {
    console.log("[ERROR EXECUTING ACTION]");
    error.text = e.toString();
    error.index = index;
    price = 0;
    try {
	  const screenshotBase64 = await takeScreenshot(driver);
	  error.screenshot = screenshotBase64;
    } catch (e) {
      console.log("error taking screenshot", e);
    }
  } finally {
    await driver?.quit();
    return { price: cleanPrice(price), error };
  }
};

const performAction = async (driver, action, selector, price) => {
  if (action.type === "click") {
    await performClickAction(driver, action, selector);
  } else if (action.type === "selectOption") {
    await performSelectOptionAction(driver, action, selector);
  } else if (action.type === "select") {
    price = await performSelectAction(driver, action, selector, price);
  } else if (action.type === "wait") {
    await driver.sleep(2000);
  }
  return price;
};

const performClickAction = async (driver, action, selector) => {
  await driver.wait(until.elementLocated(By[selector](action.xpath)), 4000);
  await driver.findElement(By[selector](action.xpath)).click();
};

const performSelectOptionAction = async (driver, action, selector) => {
  const selectElement = await driver.findElement(By[selector](action.xpath));
  const select = new Select(selectElement);
  await select.selectByVisibleText(action.optionText);
};

const performSelectAction = async (driver, action, selector, price) => {
  let selectedText = null;
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
    console.log(action);
    const element = await driver.findElement(By[selector](action.xpath));
    selectedText = await element.getText();
  }
  price = price == 0 ? selectedText : price + "." + selectedText;
  return price;
};

const takeScreenshot = async (driver, filePath) => {
	return await driver.takeScreenshot();
};

const cleanPrice = (price) => {
  price += "";
  const final = parseFloat(
    price
      .replace("€", "")
      .replace(",", ".")
      .replace(" ", "")
      .replace(/[^0-9.]/g, "")
  );

  if (isNaN(final)) {
    return 0;
  }
  return final;
};

module.exports = { performActions };
