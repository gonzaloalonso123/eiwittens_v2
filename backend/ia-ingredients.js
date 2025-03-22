const OpenAI = require("openai");
const { zodResponseFormat } = require("openai/helpers/zod");
const { z } = require("zod");
const { getProducts } = require("./database/database");

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const Ingredient = z.object({
  name: z.string(),
  amount: z.number(),
});

const IngredientArray = z.array(Ingredient);

const IngredientObject = z.object({
  ingredients: IngredientArray,
});

const getIngredients = async () =>
  getProducts().then((products) => {
    const allIngredients = products.flatMap((product) =>
      product.ingredients?.map((ingredient) => ingredient.name)
    );
    return Array.from(new Set(allIngredients));
  });

const sendToOpenAI = async (imageBuffer) => {
  const ingredients = await getIngredients();
  const prompt = `Analyze this image and identify ingredients present from this list: ${ingredients.join(
    ", "
  )}. 
  Return an array of objects, each with "name" (string) and "amount" (number, in mg per 100g) properties. 
  If the ingredients are not displayed as for a 100g, make the necessary calculations to make sure that you provide the amount of mg per 100g.
  Use the exact same naming as in the provided list for matching ingredients. 
  Return an empty array if no ingredients are found or if the image cannot be analyzed.`;

  // Convert the image buffer to base64
  const base64Image = imageBuffer.toString("base64");
  const mimeType = "image/jpeg";
  const image_url = `data:${mimeType};base64,${base64Image}`;

  try {
    const completion = await openai.beta.chat.completions.parse({
      model: "gpt-4o-2024-08-06",
      messages: [
        {
          role: "user",
          content: [
            { type: "text", text: prompt },
            {
              type: "image_url",
              image_url: {
                url: image_url,
              },
            },
          ],
        },
      ],
      response_format: zodResponseFormat(IngredientObject, "data"),
    });

    console.log("OpenAI usage:", completion.usage);
    const ingredientsResult = completion.choices[0].message.parsed;
    console.log("Parsed ingredients:", ingredientsResult);

    console.log("Ingredients found:", ingredientsResult);
    return ingredientsResult.ingredients;
  } catch (error) {
    console.error("Error calling OpenAI:", error);
    return [];
  }
};

module.exports = { sendToOpenAI };
