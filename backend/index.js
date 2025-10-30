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
  checkIfNicknameExists,
  addNicknameToUser,
  getReferralCounts,
  getCreapureUser,
  getAllCreapureUsers,
} = require("./database/database");
const { createBackupFile } = require("./backup");
const multer = require("multer");
const fs = require("fs");
const { sendToOpenAI } = require("./ia-ingredients");
const { createMollieClient } = require('@mollie/api-client');
const { generateNickname } = require("./utils");
const { randomUUID } = require("crypto");
const { sendCreapureInvoice, sendCreapureUpdateEmail, sendCreapureLeaderboardEmail, sendCreapureThankYouEmail } = require("./resend");
const bodyParser = require("body-parser");

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
app.use(
  (req, res, next) => {
    if (req.originalUrl.startsWith("/payment-webhook-creapure")) {
      next();
    } else {
      express.json()(req, res, next);
    }
  }
);
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


///STRIPE IMPLEMENTATION///

// const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

// const amounts = {
//   1: 2800,  // Stripe wants cents
//   2: 4900,
//   3: 6800,
//   4: 8800,
//   5: 11000,
// };


// app.post("/create-payment-creapure", async (req, res) => {
//   console.log("Payment request hit the server:", req.body);

//   const {
//     amount,
//     description,
//     ref,
//     firstName,
//     lastName,
//     phone,
//     country,
//     street,
//     houseNumber,
//     addition,
//     city,
//     postal,
//     offers,
//     email,
//   } = req.body;

//   if (!amounts[amount]) {
//     return res.status(400).send("Invalid amount selected");
//   }

//   const isTest = firstName === "testing tester";

//   try {
//     const userId = randomUUID();
//     const fullStreetAndNumber = `${street} ${houseNumber}${addition ? " " + addition : ""
//       }`;
//     const amountAsNumber = parseFloat(amount);
//     const session = await stripe.checkout.sessions.create({
//       payment_method_types: ["ideal"],
//       mode: "payment",
//       line_items: [
//         {
//           price_data: {
//             currency: "eur",
//             product_data: {
//               name: description || "Creapure Payment",
//             },
//             unit_amount: isTest ? 1 : amounts[amountAsNumber],
//           },
//           quantity: 1,
//         },
//       ],
//       customer_email: email,
//       success_url: `https://gieriggroeien.nl/creapure-bedankt?userId=${userId}&session_id={CHECKOUT_SESSION_ID}`,
//       cancel_url: "https://gieriggroeien.nl/creapure-annuleren",
//       metadata: {
//         referralCode: ref || null,
//         firstName,
//         lastName,
//         phone,
//         country,
//         street,
//         houseNumber,
//         addition: addition || null,
//         city,
//         postal,
//         email,
//         userId,
//         amount: amountAsNumber,
//         offers: !!offers,
//       },
//       // shipping_address_collection: {
//       //   allowed_countries: ["NL", "BE", "DE"], // adjust as needed
//       // },
//     });

//     res.json({ paymentUrl: session.url });
//   } catch (error) {
//     console.error("Error creating Stripe session:", error);
//     res.status(500).send("Error initiating payment");
//   }
// });



// app.post(
//   "/payment-webhook-creapure",
//   bodyParser.raw({ type: "application/json" }),
//   async (req, res) => {
//     const sig = req.headers["stripe-signature"];
//     let event;

//     try {
//       event = stripe.webhooks.constructEvent(
//         req.body,
//         sig,
//         process.env.STRIPE_WEBHOOK_SECRET
//       );
//     } catch (err) {
//       console.error("Webhook signature verification failed:", err.message);
//       return res.sendStatus(400);
//     }

//     if (event.type === "checkout.session.completed") {
//       const session = event.data.object;
//       const meta = { ...session.metadata, amount: parseFloat(session.metadata.amount) }
//       try {
//         const address = session.shipping_details?.address || {
//           line1: `${meta.street} ${meta.houseNumber}${meta.addition ? " " + meta.addition : ""
//             }`,
//           city: meta.city,
//           postal_code: meta.postal,
//           country: meta.country,
//         };

//         await createCreapurePayment({
//           amount_money: session.amount_total / 100,
//           amount_kilograms: meta.amount,
//           address: {
//             streetAndNumber: address.line1,
//             city: address.city,
//             postalCode: address.postal_code,
//             country: address.country,
//           },
//           paymentId: session.id,
//           firstName: meta.firstName,
//           lastName: meta.lastName,
//           phone: meta.phone,
//           country: meta.country,
//           street: meta.street,
//           houseNumber: meta.houseNumber,
//           addition: meta.addition,
//           city: meta.city,
//           postal: meta.postal,
//           email: meta.email,
//           offers: meta.offers,
//           referralCode: meta.referralCode,
//           userId: meta.userId,
//         });

//         await createCreapureUser(meta.userId, {
//           firstName: meta.firstName,
//           lastName: meta.lastName,
//           phone: meta.phone,
//           email: meta.email,
//         });

//         addAmountToGoal(meta.amount);
//         sendCreapureInvoice({
//           email: meta.email,
//           address: `${address.line1}, ${address.postal_code} ${address.city}, ${address.country}`,
//           name: `${meta.firstName} ${meta.lastName}`,
//           amount: meta.amount,
//           id: meta.userId,
//         });
//       } catch (err) {
//         console.error("Error handling Stripe webhook:", err);
//       }
//     }

//     res.sendStatus(200);
//   }
// );

///STRIPE IMPLEMENTATION

// const mollieClient = createMollieClient({ apiKey: process.env.MOLLIE_API_KEY });

// const amounts = {
//   1: "28.00",
//   2: "49.00",
//   3: "68.00",
//   4: "88.00",
//   5: "110.00"
// }

// app.post('/create-payment-creapure', async (req, res) => {
//   console.log('Payment request hit the server:', req.body);

//   const {
//     amount,
//     description,
//     ref,
//     firstName,
//     lastName,
//     phone,
//     country,
//     street,
//     houseNumber,
//     addition,
//     city,
//     postal,
//     offers,
//     email
//   } = req.body;

//   if (!amounts[amount]) {
//     return res.status(400).send('Invalid amount selected');
//   }

//   try {
//     const userId = randomUUID();
//     const amountAsNumber = parseFloat(amount);
//     const fullStreetAndNumber = `${street} ${houseNumber}${addition ? ' ' + addition : ''}`;

//     const payment = await mollieClient.payments.create({
//       amount: {
//         currency: 'EUR',
//         value: amounts[amountAsNumber] || '0.00',
//       },
//       metadata: {
//         referralCode: ref || null,
//         firstName,
//         lastName,
//         phone,
//         country,
//         street,
//         houseNumber,
//         addition,
//         city,
//         postal,
//         email,
//         userId,
//         amount: amountAsNumber,
//         offers: !!offers
//       },
//       description: description || 'Creapure Payment',
//       redirectUrl: `https://gieriggroeien.nl/creapure-bedankt?userId=${userId}`,
//       webhookUrl: 'https://gierig-groeien.api-gollum.online/payment-webhook-creapure',
//       billingAddress: {
//         givenName: firstName,
//         familyName: lastName,
//         streetAndNumber: fullStreetAndNumber,
//         city,
//         postalCode: postal,
//         country: "NL"
//       },
//       shippingAddress: {
//         givenName: firstName,
//         familyName: lastName,
//         streetAndNumber: fullStreetAndNumber,
//         city,
//         postalCode: postal,
//         country: "NL"
//       }
//     });

//     res.json({ paymentUrl: payment.getCheckoutUrl() });
//   } catch (error) {
//     console.error('Error creating payment:', error);
//     res.status(500).send('Error initiating payment');
//   }
// });



// app.post('/payment-webhook-creapure', async (req, res) => {
//   const paymentId = req.body.id;

//   if (!paymentId) {
//     res.sendStatus(400);
//     return;
//   }

//   try {
//     const payment = await mollieClient.payments.get(paymentId);
//     console.log(`Payment ${paymentId} status:`, payment.status);

//     if (payment.status === 'paid') {
//       const meta = payment.metadata || {};
//       const address = payment.details?.shippingAddress || payment.shippingAddress || {
//         givenName: meta.firstName,
//         familyName: meta.lastName,
//         streetAndNumber: `${meta.street} ${meta.houseNumber}${meta.addition ? ' ' + meta.addition : ''}`,
//         city: meta.city,
//         postalCode: meta.postal,
//         country: meta.country
//       };

//       await createCreapurePayment({
//         amount_money: payment.amount.value,
//         amount_kilograms: meta.amount,
//         address,
//         paymentId: payment.id,
//         firstName: meta.firstName,
//         lastName: meta.lastName,
//         phone: meta.phone,
//         country: meta.country,
//         street: meta.street,
//         houseNumber: meta.houseNumber,
//         addition: meta.addition || null,
//         city: meta.city,
//         postal: meta.postal,
//         email: meta.email,
//         offers: meta.offers,
//         referralCode: meta.referralCode || null,
//         userId: meta.userId
//       });

//       await createCreapureUser(meta.userId, {
//         firstName: meta.firstName,
//         lastName: meta.lastName,
//         phone: meta.phone,
//         email: meta.email,
//       });

//       addAmountToGoal(meta.amount);
//       sendCreapureInvoice({
//         email: meta.email,
//         address: `${address.streetAndNumber}, ${address.postalCode} ${address.city}, ${address.country}`,
//         name: `${meta.firstName} ${meta.lastName}`,
//         amount: meta.amount,
//         id: meta.userId,
//       });
//     }

//     res.sendStatus(200);
//   } catch (err) {
//     console.error('Error handling Mollie webhook:', err);
//     res.sendStatus(500);
//   }
// });


// const GOAL = 500;
// app.get('/creapure-progress', async (req, res) => {
//   try {
//     const { totalKilograms } = await getAmountGoal();
//     res.json({
//       goalKg: GOAL,
//       claimedKg: totalKilograms,
//     });
//   } catch (error) {
//     console.error('Error fetching Creapure amount:', error);
//     res.status(500).send('Error fetching Creapure amount');
//   }
// });

// app.post('/add-nickname', async (req, res) => {
//   const { userId, nickname } = req.body;
//   if (!userId || !nickname) {
//     return res.status(400).send('User ID and nickname are required');
//   }
//   try {
//     const exists = await checkIfNicknameExists(nickname);
//     if (exists) {
//       return res.status(400).send('Nickname already exists');
//     }
//     const updatedNickname = await addNicknameToUser(userId, nickname.replace(/[^a-zA-Z0-9_-]/g, ''));
//     res.json({ nickname: updatedNickname });
//   } catch (error) {
//     console.error('Error adding nickname:', error);
//     res.status(500).send('Error adding nickname');
//   }
// });

// app.get("/creapure-user/:id", async (req, res) => {
//   const userId = req.params.id;
//   if (!userId) {
//     return res.status(400).send('User ID is required');
//   }
//   try {
//     const user = await getCreapureUser(userId);
//     if (!user) {
//       return res.status(404).send('User not found');
//     }
//     res.json(user);
//   } catch (error) {
//     console.error('Error fetching user:', error);
//     res.status(500).send('Error fetching user');
//   }
// })

// app.get('/referral-counts', async (req, res) => {
//   try {
//     const referralCounts = await getReferralCounts();
//     res.json(referralCounts);
//   } catch (error) {
//     console.error('Error fetching referral counts:', error);
//     res.status(500).send('Error fetching referral counts');
//   }
// });

// app.post('/send-creapure-update-email', async (req, res) => {
//   try {
//     console.log('Starting to send Creapure update emails to all users...');

//     // Get all users from the creapure-users collection
//     const users = await getAllCreapureUsers();

//     if (users.length === 0) {
//       return res.status(404).json({ message: 'No users found' });
//     }

//     console.log(`Found ${users.length} users. Sending emails...`);

//     let emailsSent = 0;
//     let emailsFailed = 0;
//     const failedEmails = [];

//     // Send emails to all users
//     for (const user of users) {
//       try {
//         if (user.email && user.firstName) {
//           await sendCreapureUpdateEmail({
//             firstName: user.firstName,
//             email: user.email,
//             id: user.id,
//             nickname: user.nickname
//           });
//           emailsSent++;
//           console.log(`Email sent to ${user.email}`);
//         } else {
//           console.log(`Skipping user ${user.id} - missing email or firstName`);
//           emailsFailed++;
//           failedEmails.push({ id: user.id, reason: 'Missing email or firstName' });
//         }
//       } catch (error) {
//         console.error(`Failed to send email to ${user.email}:`, error);
//         emailsFailed++;
//         failedEmails.push({ email: user.email, reason: error.message });
//       }
//     }

//     res.json({
//       message: 'Bulk email sending completed',
//       totalUsers: users.length,
//       emailsSent,
//       emailsFailed,
//       failedEmails
//     });

//   } catch (error) {
//     console.error('Error sending bulk emails:', error);
//     res.status(500).json({
//       error: 'Error sending bulk emails',
//       details: error.message
//     });
//   }
// });

// app.post('/send-creapure-leaderboard-email', async (req, res) => {
//   try {
//     console.log('Starting to send Creapure leaderboard emails to all users...');

//     // Get all users and current referral counts
//     const [users, referralCounts] = await Promise.all([
//       getAllCreapureUsers(),
//       getReferralCounts()
//     ]);

//     if (!users || users.length === 0) {
//       return res.status(404).json({ message: 'No users found' });
//     }

//     // Build top-5 array in the form { name, count }
//     const entries = Object.entries(referralCounts || {});
//     const top5 = entries
//       .sort((a, b) => (b[1] || 0) - (a[1] || 0))
//       .slice(0, 5)
//       .map(([nickname, count]) => ({ name: nickname, count: count || 0 }));

//     console.log('Computed leaderboard top 5:', top5);

//     let emailsSent = 0;
//     let emailsFailed = 0;
//     const failed = [];


//     const mockusers = [{ firstName: 'test', email: 'huntymonster@gmail.com', id: 'mockid', nickname: 'mocknick' }]; // --- IGNORE ---
//     for (const user of users) {
//       try {
//         if (user.email && user.firstName) {
//           await sendCreapureLeaderboardEmail({
//             firstName: user.firstName,
//             email: user.email,
//             id: user.id,
//             nickname: user.nickname,
//           }, top5);
//           emailsSent++;
//         } else {
//           emailsFailed++;
//           failed.push({ id: user.id, reason: 'Missing email or firstName' });
//         }
//       } catch (err) {
//         emailsFailed++;
//         failed.push({ email: user.email, reason: err?.message || String(err) });
//       }
//     }

//     res.json({
//       message: 'Leaderboard bulk emails completed',
//       totalUsers: users.length,
//       emailsSent,
//       emailsFailed,
//       failed,
//       top5
//     });
//   } catch (error) {
//     console.error('Error sending leaderboard bulk emails:', error);
//     res.status(500).json({ error: 'Error sending leaderboard bulk emails', details: error.message });
//   }
// });

// app.post('/send-creapure-thankyou-email', async (req, res) => {
//   try {
//     const dryRun = String(req.query.dryRun || '').toLowerCase() === '1' || String(req.query.dryRun || '').toLowerCase() === 'true';
//     console.log('Starting thank-you emails to all users...', { dryRun });

//     const users = await getAllCreapureUsers();
//     if (!users || users.length === 0) {
//       return res.status(404).json({ message: 'No users found' });
//     }

//     let emailsSent = 0;
//     let emailsFailed = 0;
//     const failed = [];

//     for (const user of users) {
//       try {
//         if (user.email && user.firstName) {
//           if (!dryRun) {
//             await sendCreapureThankYouEmail({
//               firstName: user.firstName,
//               email: user.email,
//             });
//           }
//           emailsSent++;
//         } else {
//           emailsFailed++;
//           failed.push({ id: user.id, reason: 'Missing email or firstName' });
//         }
//       } catch (err) {
//         emailsFailed++;
//         failed.push({ email: user.email, reason: err?.message || String(err) });
//       }
//     }

//     res.json({
//       message: dryRun ? 'Thank-you bulk emails DRY-RUN completed' : 'Thank-you bulk emails completed',
//       totalUsers: users.length,
//       emailsSent,
//       emailsFailed,
//       failed,
//       dryRun,
//     });
//   } catch (error) {
//     console.error('Error sending thank-you bulk emails:', error);
//     res.status(500).json({ error: 'Error sending thank-you bulk emails', details: error.message });
//   }
// });

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
