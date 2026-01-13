import { CONFIG } from "./config.js";

/* ================= STAR BACKGROUND ================= */
const canvas = document.getElementById("stars");
const ctx = canvas.getContext("2d");

let stars = [];
const STAR_COUNT = 140;

function resize() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
}
window.addEventListener("resize", resize);
resize();

function initStars() {
  stars = Array.from({ length: STAR_COUNT }, () => ({
    x: Math.random() * canvas.width,
    y: Math.random() * canvas.height,
    r: Math.random() * 1.3 + 0.2,
    dx: (Math.random() - 0.5) * 0.15,
    dy: (Math.random() - 0.5) * 0.15
  }));
}

function animateStars() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = "#94a3b8";

  stars.forEach(s => {
    s.x += s.dx;
    s.y += s.dy;

    if (s.x < 0) s.x = canvas.width;
    if (s.x > canvas.width) s.x = 0;
    if (s.y < 0) s.y = canvas.height;
    if (s.y > canvas.height) s.y = 0;

    ctx.beginPath();
    ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
    ctx.fill();
  });

  requestAnimationFrame(animateStars);
}

initStars();
animateStars();

/* ================= HELPER: Create 53x7 heatmap ================= */
function createHeatmap(root, dataMap) {
  const now = new Date();
  const weeks = 53;
  const days = 7;

  // Start from last Sunday 53 weeks ago
  const start = new Date(now);
  start.setDate(start.getDate() - weeks * 7);
  start.setHours(0, 0, 0, 0);

  for (let w = 0; w < weeks; w++) {
    for (let d = 0; d < days; d++) {
      const date = new Date(start);
      date.setDate(start.getDate() + w * 7 + d);
      const key = Math.floor(date.getTime() / 1000);

      const dayDiv = document.createElement("div");
      dayDiv.classList.add("day");

      // Check dataMap for this date
      let count = 0;
      Object.keys(dataMap).forEach(ts => {
        const tsDate = new Date(ts * 1000);
        if (
          tsDate.getFullYear() === date.getFullYear() &&
          tsDate.getMonth() === date.getMonth() &&
          tsDate.getDate() === date.getDate()
        )
          count = dataMap[ts];
      });

      if (count >= 1 && count <= 2) dayDiv.classList.add("lvl-1");
      else if (count <= 4) dayDiv.classList.add("lvl-2");
      else if (count <= 6) dayDiv.classList.add("lvl-3");
      else if (count > 6) dayDiv.classList.add("lvl-4");

      root.appendChild(dayDiv);
    }
  }
}

/* ================= LEETCODE ================= */
async function loadLeetCode() {
  const query = {
    query: `
      query ($username: String!) {
        matchedUser(username: $username) {
          userCalendar {
            submissionCalendar
          }
        }
      }
    `,
    variables: { username: CONFIG.leetcode }
  };

  const res = await fetch("https://leetcode.com/graphql", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(query)
  });

  const json = await res.json();
  const data = JSON.parse(json.data.matchedUser.userCalendar.submissionCalendar);

  createHeatmap(document.getElementById("lc-heatmap"), data);
}

/* ================= CODEFORCES ================= */
async function loadCodeforces() {
  const res = await fetch(`https://codeforces.com/api/user.status?handle=${CONFIG.codeforces}`);
  const json = await res.json();

  const map = {};
  json.result.forEach(sub => {
    const day = Math.floor(sub.creationTimeSeconds / 86400);
    map[day] = (map[day] || 0) + 1;
  });

  // Convert keys to timestamps
  const dataMap = {};
  Object.keys(map).forEach(k => {
    dataMap[k] = map[k];
  });

  createHeatmap(document.getElementById("cf-heatmap"), dataMap);
}

/* ================= INIT ================= */
loadLeetCode();
loadCodeforces();
