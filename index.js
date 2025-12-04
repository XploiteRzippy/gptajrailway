import express from "express";
import fetch from "node-fetch";
const app = express();

const PORT = process.env.PORT || 5000;
const API_URL = "http://node68.lunes.host:3052/api/pets?min_money=10000000";
const REFRESH_RATE = 2000; // milliseconds

let jobIds = [];

// Root route to display job IDs
app.get("/", (req, res) => {
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>Job IDs</title>
      <meta http-equiv="refresh" content="2">
      <style>
        body { font-family: monospace; background: #1a1a1a; color: #0f0; padding: 20px; }
        h1 { color: #0f0; }
        .job-id { padding: 5px 0; font-size: 16px; }
      </style>
    </head>
    <body>
      <h1>Job IDs</h1>
      ${jobIds.length > 0 
        ? jobIds.map(id => `<div class="job-id">${id}</div>`).join('') 
        : '<p>Loading...</p>'}
    </body>
    </html>
  `;
  res.send(html);
});

// Route to return only job IDs
app.get("/jobids", (req, res) => {
  res.json(jobIds);
});

// Function to fetch API and extract jobIds
async function fetchJobIds() {
  try {
    const response = await fetch(API_URL);
    const data = await response.json();

    if (data && data.pets) {
      jobIds = data.pets.map(p => {
        const link = p.chillihubLink || "";
        const jobId = link.match(/gameInstanceId=([\w-]+)/);
        return jobId ? jobId[1] : null;
      }).filter(Boolean);

      // Log to console
      console.log("Job IDs:", jobIds);
    }
  } catch (err) {
    console.error("Error fetching API:", err.message);
  }
}

// Keep fetching every REFRESH_RATE milliseconds
setInterval(fetchJobIds, REFRESH_RATE);

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
