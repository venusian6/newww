const path = require("path");
const express = require("express");
const OS = require("os");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const app = express();
const cors = require("cors");
const fs = require('fs').promises;

// Middleware setup
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, "/")));
app.use(cors());

// MongoDB connection
async function connectToDatabase() {
  try {
    await mongoose.connect(process.env.MONGO_URI, {
      user: process.env.MONGO_USERNAME,
      pass: process.env.MONGO_PASSWORD,
    });
    console.log("MongoDB Connection Successful");
  } catch (err) {
    console.log("Error connecting to MongoDB: " + err);
  }
}

connectToDatabase();

// Define Schema
var Schema = mongoose.Schema;

var dataSchema = new Schema({
  name: String,
  id: Number,
  description: String,
  image: String,
  velocity: String,
  distance: String,
});

// Define Model
var planetModel = mongoose.model("planets", dataSchema);

// POST route to get planet data
app.post("/planet", async (req, res) => {
  try {
    // Log the ID (you can remove this if not necessary)
    // console.log("Received Planet ID " + req.body.id);

    // Use async/await to fetch planet data by ID
    const planetData = await planetModel.findOne({ id: req.body.id });

    // If no planet data is found, send an appropriate message
    if (!planetData) {
      return res.status(404).send("No planet found with the given ID");
    }

    res.send(planetData); // Send the found planet data as the response
  } catch (err) {
    console.error("Error in fetching planet data: ", err);
    res.status(500).send("Error in Planet Data");
  }
});




app.get('/api-docs', async (req, res) => {
    try {
        const data = await fs.readFile('oas.json', 'utf8');
        res.json(JSON.parse(data));
    } catch (err) {
        console.error('Error reading file:', err);
        res.status(500).send('Error reading file');
    }
});


// GET route to serve index.html
app.get("/", async (req, res) => {
  res.sendFile(path.join(__dirname, "/", "index.html"));
});

// GET route to get OS info
app.get("/os", (req, res) => {
  res.setHeader("Content-Type", "application/json");
  res.send({
    os: OS.hostname(),
    env: process.env.NODE_ENV,
  });
});

// GET route to check if the server is live
app.get("/live", (req, res) => {
  res.setHeader("Content-Type", "application/json");
  res.send({
    status: "live",
  });
});

// GET route to check if the server is ready
app.get("/ready", (req, res) => {
  res.setHeader("Content-Type", "application/json");
  res.send({
    status: "ready",
  });
});

// Start the server
app.listen(3000, () => {
  console.log("Server successfully running on port - " + 3000);
});

module.exports = app;
