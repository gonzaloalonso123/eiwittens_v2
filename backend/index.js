const express = require("express");
const app = express();
const cors = require("cors");
const { performActions } = require("./scraper");
const schedule = require("node-schedule");
const { scrapeAndPush, refreshTrustPilot, addProductToTracking, getTrackingSummary, writeTrackingLogs } = require("./pipes");
const {
  addClickedTimeToProduct,
  getProducts,
  getRogiersFavorites,
  migrate,
  createCreapurePayment,
} = require("./database/database");
const { createBackupFile } = require("./backup");
const multer = require("multer");
const fs = require("fs");
const { sendToOpenAI } = require("./ia-ingredients");
const bodyParser = require('body-parser');
const { createMollieClient } = require('@mollie/api-client');


app.use(
  cors({
    origin: [
      "https://dashboard.gieriggroeien.nl",
      "http://localhost:3000",
      "http://localhost:3002",
      "https://eiwittens.web.app",
      "https://gieriggroeien.nl",
      "http://localhost:3001",
    ],
  })
);
app.use(express.json());

addProductToTracking("AzyO2U45IQMRvwXv9zJj");
addProductToTracking("BapCkr57CEKFu8QA3m1M");
app.post("/scrape-all", async (req, res) => {
  console.log("Tracking summary:", getTrackingSummary())
  const products = await scrapeAndPush();
  await writeTrackingLogs()
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

app.get("/rogiers-choice", async (req, res) => {
  const rogiersChoice = await getRogiersFavorites();
  res.json(rogiersChoice);
});

app.get("/execute-migration", async (req, res) => {
  migrate();
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

require('dotenv').config();

const mollieClient = createMollieClient({ apiKey: process.env.MOLLIE_API_KEY });
app.use(bodyParser.json());

app.post('/create-payment-creapure', async (req, res) => {

  console.log('Payment request hit the server:', req.body);
  const { amount, description } = req.body;

  const userId = req.query.userId || 'defaultUser';
  try {
    const payment = await mollieClient.payments.create({
      amount: {
        currency: 'EUR',
        value: Number(amount).toFixed(2),
      },
      description,
      redirectUrl: `https://gieriggroeien.nl/creapure-bedankt/${userId}`,
      webhookUrl: 'https://gierig-groeien.api-gollum.online/payment-webhook-creapure',
    });

    res.json({ paymentUrl: payment.getCheckoutUrl() });
  } catch (error) {
    console.error('Error creating payment:', error);
    res.status(500).send('Error initiating payment');
  }
});

app.post('/payment-webhook-creapure', async (req, res) => {
  const paymentId = req.body.id;
  console.log(req.body);
  try {
    const payment = await mollieClient.payments.get(paymentId);

    if (payment.isPaid()) {
      const amount = payment.amount.value;

      createCreapurePayment({
        amount,
        address: payment.details?.billingAddress,
        paymentId,
      });
    } else {
      console.log('Payment not completed:', payment.status);
    }

    res.sendStatus(200);
  } catch (error) {
    console.error('Webhook error:', error);
    res.status(500).send('Webhook error');
  }
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
