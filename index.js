import express from "express";
import fetch from "node-fetch";
const app = express();

const PORT = process.env.PORT || 5000;
const API_URL = "http://node68.lunes.host:3052/api/pets?min_money=10000000";
const REFRESH_RATE = 2000;

let jobIds = [];
let servers = [];

app.get("/", (req, res) => {
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>Pet Servers</title>
      <style>
        body { font-family: monospace; background: #1a1a1a; color: #0f0; padding: 20px; }
        h1 { color: #0f0; }
        .server { background: #2a2a3a; padding: 10px; margin: 8px 0; border-radius: 8px; position: relative; }
        .name { color: #4ade80; font-weight: bold; font-size: 16px; }
        .money { color: #fbbf24; font-size: 14px; }
        .players { color: #60a5fa; font-size: 12px; }
        .jobid { color: #94a3b8; font-size: 12px; }
        .timer { color: #f87171; font-size: 12px; margin-top: 2px; }
        .join-btn { 
          position: absolute; 
          right: 10px; 
          bottom: 10px; 
          background: #3b82f6; 
          color: #fff; 
          padding: 4px 8px; 
          border-radius: 6px; 
          text-decoration: none; 
          font-size: 12px;
        }
      </style>
    </head>
    <body>
      <h1>Pet Servers (${servers.length})</h1>
      ${servers.length > 0 
        ? servers.map(s => `
          <div class="server" data-added="${s.addedAt || Date.now()}">
            <div class="name">${s.name}</div>
            <div class="money">$${s.money}</div>
            <div class="players">Players: ${s.players}</div>
            <div class="jobid">JobId: ${s.jobId}</div>
            <div class="timer">Seen: 0s</div>
            <a class="join-btn" href="roblox://place-launch/?placeId=109983668079237&gameInstanceId=${s.jobId}">JOIN</a>
          </div>
        `).join('') 
        : '<p>Loading...</p>'}
      <script>
        function updateTimers() {
          const servers = document.querySelectorAll('.server');
          const now = Date.now();
          servers.forEach(server => {
            const added = parseInt(server.dataset.added);
            if (!isNaN(added)) {
              const diff = Math.floor((now - added) / 1000); // seconds
              const mins = Math.floor(diff / 60);
              const secs = diff % 60;
              server.querySelector('.timer').innerText = \`Seen: \${mins}m \${secs}s\`;
            }
          });
        }
        setInterval(updateTimers, 1000);
      </script>
    </body>
    </html>
  `;
  res.send(html);
});

app.get("/jobids", (req, res) => {
  res.json(jobIds);
});

app.get("/servers", (req, res) => {
  res.json(servers);
});

async function fetchJobIds() {
  try {
    const response = await fetch(API_URL);
    const data = await response.json();

    if (data && data.pets) {
      const serverMap = new Map();
      const now = Date.now();
      
      data.pets.forEach(p => {
        const link = p.chillihubLink || "";
        const match = link.match(/gameInstanceId=([\w-]+)/);
        if (match) {
          const jobId = match[1];
          if (!serverMap.has(jobId)) {
            const moneyStr = p.money || "0M/s";
            const moneyNum = parseFloat(moneyStr.replace(/[^\d.]/g, '')) || 0;
            
            serverMap.set(jobId, {
              name: p.name || "Unknown",
              money: moneyStr,
              moneyNum: moneyNum,
              players: p.players || "?/?",
              jobId: jobId,
              addedAt: now // store when server first seen
            });
          }
        }
      });
      
      servers = Array.from(serverMap.values());
      servers.sort((a, b) => b.moneyNum - a.moneyNum);
      jobIds = servers.map(s => s.jobId);

      console.log("Servers:", servers.length, "| Jobs:", jobIds.length);
    }
  } catch (err) {
    console.error("Error fetching API:", err.message);
  }
}

setInterval(fetchJobIds, REFRESH_RATE);

app.listen(PORT, "0.0.0.0", () => {
  console.log(`Server running on port ${PORT}`);
  fetchJobIds();
});
