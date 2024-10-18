//express

const express = require("express");
const app = express();
const cors = require("cors");
const { performActions } = require("./scraper");
const schedule = require("node-schedule");
const { retrieveAndPush, scrapeAndPush } = require("./pipes");
const { addClickedTimeToProduct } = require("./database/database");
const { makeBackUp } = require("./wordpress");

app.use(
  cors({
    origin: [
      "http://localhost:3000",
      "https://eiwittens.web.app",
      "https://gieriggroeien.nl/",
      "http://localhost:3001",
    ],
  })
);
app.use(express.json());

app.post("/scrape-all", async (req, res) => {
  const products = await scrapeAndPush();
  res.json(products);
});

app.post("/push-to-wordpress", async (req, res) => {
  await retrieveAndPush();
  res.json({ message: "Flow completed" });
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

app.post("/product-clicked/:id", async (req, res) => {
  const id = req.params.id;
  await addClickedTimeToProduct(id);
  res.status(200).end();
});

schedule.scheduleJob({ hour: [6, 12, 18, 0], minute: 0 }, scrapeAndPush);

const port = 709;

app.listen(port, () => {
  console.log(`Server listening at http://localhost:${port}`);
});

// ------> LAUNCHING ACTIONS <------ //

// retrieveAndPush();
// scrapeAndPush();
// makeBackUp();
