//express

const express = require("express");
const app = express();
const cors = require("cors");
const { performActions } = require("./scraper");
const schedule = require("node-schedule");
const {
  retrieveAndPush,
  scrapeAndPush,
  refreshTrustPilot,
} = require("./pipes");
const { addClickedTimeToProduct, getProducts } = require("./database/database");
const { makeBackUp, getAllPosts, deleteAllPosts } = require("./wordpress");
const { createBackupFile } = require("./backup");

app.use(
  cors({
    origin: [
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
  const { price, error } = await performActions(req.body.actions, req.body.url);
  res.json({ price, error });
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

app.post("/product-clicked/:id", async (req, res) => {
  const id = req.params.id;
  const extra = req.query.extra || null

  console.log("extra", extra);
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
