const express = require("express");
const app = express();
const cors = require("cors");
const { performActions } = require("./scraper");
const schedule = require("node-schedule");
const { scrapeAndPush, refreshTrustPilot } = require("./pipes");
const { addClickedTimeToProduct, getProducts } = require("./database/database");
const { createBackupFile } = require("./backup");
const multer = require("multer");
const fs = require("fs");
const { sendToOpenAI } = require("./ia-ingredients");

app.use(
  cors({
    origin: [
      "https://dashboard.gieriggroeien.nl",
      "http://localhost:3000",
      "https://eiwittens.web.app",
      "https://gieriggroeien.nl",
      "http://localhost:3001",
    ],
  })
);
app.use(express.json());

app.post("/scrape-all", async (req, res) => {
  const products = await scrapeAndPush();
  res.json(products);
});

app.post("/test-scraper", async (req, res) => {
  const { price, error, generatedActions } = await performActions(
    req.body.actions,
    req.body.url,
    { cookieBannerXPaths: req.body.cookieBannerXPaths },
    "enabled"
  );
  res.json({ price, error, generatedActions });
});

app.post("/test-ai", async (req, res) => {
  const result = await performActions(
    null,
    req.body.url,
    {
      cookieBannerXPaths: req.body.cookieBannerXPaths,
    },
    "prefered"
  );
  res.json(result);
});

app.post("/status", async (req, res) => {
  res.status(200).end();
});

app.get("/status", async (req, res) => {
  res.status(200).send("OK");
});

app.get("/posts", async (req, res) => {
  const posts = await getProducts();
  res.json(posts);
});

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith("image/")) {
      cb(null, true);
    } else {
      cb(new Error("Only image files are allowed!"), false);
    }
  },
});

app.post("/analyze-image", upload.single("image"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No image provided" });
    }
    const result = await sendToOpenAI(req.file.buffer);
    return res.json({ ingredients: result });
  } catch (error) {
    console.error("Error processing image:", error);
    return res.status(500).json({ error: "Failed to process image" });
  }
});

app.post("/product-clicked/:id", async (req, res) => {
  const id = req.params.id;
  const extra = req.query.extra;
  await addClickedTimeToProduct(id, extra);
  res.status(200).send("ok");
});

schedule.scheduleJob({ hour: [6, 12, 18, 0], minute: 0 }, scrapeAndPush);
schedule.scheduleJob({ hour: 13, minute: 10, dayOfWeek: 0 }, refreshTrustPilot);
schedule.scheduleJob({ hour: 13, minute: 0, dayOfWeek: 0 }, createBackupFile);

const port = 709;

app.listen(port, () => {
  console.log(`Server listening at http://localhost:${port}`);
});

// ------> LAUNCHING ACTIONS <------ //

// retrieveAndPush();
// scrapeAndPush();
// deleteAllPosts();
// refreshTrustPilot();
// makeBackUp();
