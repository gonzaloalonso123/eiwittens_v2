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
  addAmountToGoal,
  getAmountGoal,
  createCreapureUser,
} = require("./database/database");
const { createBackupFile } = require("./backup");
const multer = require("multer");
const fs = require("fs");
const { sendToOpenAI } = require("./ia-ingredients");
const { createMollieClient } = require('@mollie/api-client');
const { generateNickname } = require("./utils");
const { randomUUID } = require("crypto");


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
app.use(express.urlencoded({ extended: true }));

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

const amounts = {
  "1": "28.00",
  "2": "50.00",
  "3": "70.00",
}

app.post('/create-payment-creapure', async (req, res) => {
  console.log('Payment request hit the server:', req.body);
  const {
    amount,
    description,
    ref,
    firstName,
    lastName,
    phone,
    country,
    street,
    city,
    postal,
    offers,
    email
  } = req.body;
  if (!amounts[amount]) {
    return res.status(400).send('Invalid amount selected');
  }
  try {
    const userId = randomUUID();
    const payment = await mollieClient.payments.create({
      amount: {
        currency: 'EUR',
        value: amounts[amount] || '0.00',
      },
      metadata: {
        referralCode: ref || null,
        firstName,
        lastName,
        phone,
        country,
        street,
        city,
        postal,
        email,
        userId,
        offers: !!offers
      },
      description: description || 'Creapure Payment',
      redirectUrl: `https://gieriggroeien.nl/creapure-bedankt?userId=${userId}`,
      webhookUrl: 'https://gierig-groeien.api-gollum.online/payment-webhook-creapure',
      billingAddress: {
        givenName: firstName,
        familyName: lastName,
        streetAndNumber: street,
        city,
        postalCode: postal,
        country: "NL"
      },
      shippingAddress: {
        givenName: firstName,
        familyName: lastName,
        streetAndNumber: street,
        city,
        postalCode: postal,
        country: "NL"
      }
    });

    res.json({ paymentUrl: payment.getCheckoutUrl() });
  } catch (error) {
    console.error('Error creating payment:', error);
    res.status(500).send('Error initiating payment');
  }
});


app.post('/payment-webhook-creapure', async (req, res) => {
  const paymentId = req.body.id;

  if (!paymentId) {
    res.sendStatus(400);
    return;
  }

  try {
    const payment = await mollieClient.payments.get(paymentId);
    console.log(`Payment ${paymentId} status:`, payment.status);

    if (payment.status === 'paid') {
      const meta = payment.metadata || {};
      const address = payment.details?.shippingAddress || payment.shippingAddress || {
        givenName: meta.firstName,
        familyName: meta.lastName,
        streetAndNumber: meta.street,
        city: meta.city,
        postalCode: meta.postal,
        country: meta.country
      };

      await createCreapurePayment({
        amount: payment.amount.value,
        address,
        paymentId: payment.id,
        firstName: meta.firstName,
        lastName: meta.lastName,
        phone: meta.phone,
        country: meta.country,
        street: meta.street,
        city: meta.city,
        postal: meta.postal,
        email: meta.email,
        offers: meta.offers,
        referralCode: meta.referralCode || null,
        userId: meta.userId
      });

      await createCreapureUser(userId, {
        firstName: meta.firstName,
        lastName: meta.lastName,
        phone: meta.phone,
        email: meta.email,
      });

      addAmountToGoal(parseFloat(payment.amount.value))
    }

    res.sendStatus(200);
  } catch (err) {
    console.error('Error handling Mollie webhook:', err);
    res.sendStatus(500);
  }
});


const GOAL = 200;
app.get('/creapure-amount', async (req, res) => {
  try {
    const { totalKilograms } = await getAmountGoal();
    res.json({
      goalKg: GOAL,
      claimedKg: totalKilograms,
    });
  } catch (error) {
    console.error('Error fetching Creapure amount:', error);
    res.status(500).send('Error fetching Creapure amount');
  }
});

app.post('add-nickname', async (req, res) => {
  const { userId, nickname } = req.body;
  if (!userId || !nickname) {
    return res.status(400).send('User ID and nickname are required');
  }
  try {
    const exists = await checkIfNicknameExists(nickname);
    if (exists) {
      return res.status(400).send('Nickname already exists');
    }
    const updatedNickname = await addNicknameToUser(userId, nickname);
    res.json({ nickname: updatedNickname });
  } catch (error) {
    console.error('Error adding nickname:', error);
    res.status(500).send('Error adding nickname');
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
