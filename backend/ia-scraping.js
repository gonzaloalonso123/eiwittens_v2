import OpenAI from "openai";
import { JSDOM } from "jsdom";
import { v4 as uuidv4 } from "uuid";
import { configDotenv } from "dotenv";

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

export const attemptAIPriceExtraction = async (driver, url) => {
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