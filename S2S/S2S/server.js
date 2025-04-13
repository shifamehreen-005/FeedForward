// server.js
const express = require("express");
const fetch = require("node-fetch");
const cors = require("cors");

const app = express();
app.use(cors()); 
const TRANSIT_API_KEY = process.env.TRANSIT_API_KEY || "d2075a8b39fe7d775cf2a672682dfa41ed554d531095786cfe030853c50e8675";
const EXTERNAL_TRANSIT_URL = "https://external.transitapp.com/v3/otp/plan";

// Add a simple test route
app.get("/", (req, res) => {
  res.send("Transit proxy server is running!");
});

// Add logging for incoming requests
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
  next();
});

app.get("/transitPlan", async (req, res) => {
  console.log("Received request to /transitPlan with query:", req.query);
  
  // Check if we have the minimum required parameters
  if (!req.query.fromPlace || !req.query.toPlace) {
    return res.status(400).json({
      error: "Missing required parameters. You must provide at least 'fromPlace' and 'toPlace'."
    });
  }
  
  try {
    const queryString = new URLSearchParams(req.query).toString();
    const finalUrl = `${EXTERNAL_TRANSIT_URL}?${queryString}`;
    console.log("Making request to:", finalUrl);

    const response = await fetch(finalUrl, {
      headers: {
        apiKey: TRANSIT_API_KEY,
      },
    });

    if (!response.ok) {
      throw new Error(`Upstream request failed with status ${response.status}`);
    }

    const data = await response.json();
    res.json(data);
  } catch (error) {
    console.error("Error proxying request:", error);
    res.status(500).json({ error: error.message });
  }
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`Proxy server listening on http://localhost:${PORT}`);
});