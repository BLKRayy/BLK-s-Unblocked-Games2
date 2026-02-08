// script.js

let games = [];

// player name
let playerName = localStorage.getItem("playerName") || "";
const playerInput = document.getElementById("player-name");
if (playerInput) {
  playerInput.value = playerName;
  playerInput.addEventListener("input", e => {
    playerName = e.target.value.trim();
    localStorage.setItem("playerName", playerName);
  });
}

// Load games
async function loadGames() {
  try {
    const res = await fetch("games.json");
    games = await res.json();
  } catch (e) {
    games = [];
  }

  const saved = localStorage.getItem("games");
  if (saved) {
    try {
      const edited = JSON.parse(saved);
      if (Array.isArray(edited) && edited.length > 0) {
        games = edited;
      }
    } catch (e) {}
  }

  renderGameGrid(games);
  loadFeatured();
}

// Game grid
function renderGameGrid(list) {
  const grid = document.getElementById("game-grid");
  const frame = document.getElementById("game-frame");
  const title = document.getElementById("game-title");
  const subtitle = document.getElementById("game-subtitle");

  grid.innerHTML = "";

  list.forEach(game => {
    const card = document.createElement("div");
    card.className = "game-card";

    card.innerHTML = `
      <img src="${game.thumb}">
      <div class="game-card-title">${game.name}</div>
      <div class="game-card-meta">
        <span>${game.category || "Other"}</span>
        <button class="fav-btn" data-name="${game.name}">⭐</button>
      </div>
    `;

    card.addEventListener("click", e => {
      if (e.target.classList.contains("fav-btn")) return;

      title.textContent = game.name;
      subtitle.textContent = game.description || "Enjoy your game.";
      frame.src = game.url;

      let recent = JSON.parse(localStorage.getItem("recent") || "[]");
      recent = recent.filter(n => n !== game.name);
      recent.unshift(game.name);
      recent = recent.slice(0, 6);
      localStorage.setItem("recent", JSON.stringify(recent));

      if (playerName) {
        let log = JSON.parse(localStorage.getItem("playLog") || "[]");
        log.unshift({
          name: playerName,
          game: game.name,
          time: new Date().toISOString()
        });
        log = log.slice(0, 50);
        localStorage.setItem("playLog", JSON.stringify(log));
      }
    });

    grid.appendChild(card);
  });
}

// Favorites
document.addEventListener("click", e => {
  if (e.target.classList.contains("fav-btn")) {
    const name = e.target.dataset.name;
    let favs = JSON.parse(localStorage.getItem("favorites") || "[]");
    if (!favs.includes(name)) favs.push(name);
    localStorage.setItem("favorites", JSON.stringify(favs));
  }
});

// Search
document.getElementById("search").addEventListener("input", e => {
  const q = e.target.value.toLowerCase();
  const filtered = games.filter(g => g.name.toLowerCase().includes(q));
  renderGameGrid(filtered);
});

// Category filter
document.getElementById("category-filter").addEventListener("change", e => {
  const cat = e.target.value;
  if (cat === "all") {
    renderGameGrid(games);
  } else {
    const filtered = games.filter(g => g.category === cat);
    renderGameGrid(filtered);
  }
});

// Favorites filter
document.getElementById("show-favorites").onclick = () => {
  const favs = JSON.parse(localStorage.getItem("favorites") || "[]");
  const filtered = games.filter(g => favs.includes(g.name));
  renderGameGrid(filtered);
};

// Recent filter
document.getElementById("show-recent").onclick = () => {
  const recent = JSON.parse(localStorage.getItem("recent") || "[]");
  const filtered = games.filter(g => recent.includes(g.name));
  renderGameGrid(filtered);
};

// Featured (top games)
function loadFeatured() {
  const container = document.getElementById("featured-list");
  container.innerHTML = "";

  let featured = games.filter(g => g.featured === true);
  if (featured.length === 0) {
    featured = games.slice(0, 4);
  }

  featured.forEach(game => {
    const div = document.createElement("div");
    div.className = "featured-item";
    div.innerHTML = `<img src="${game.thumb}"><br>${game.name}`;
    div.onclick = () => {
      document.getElementById("game-title").textContent = game.name;
      document.getElementById("game-subtitle").textContent = game.description || "Enjoy your game.";
      document.getElementById("game-frame").src = game.url;
    };
    container.appendChild(div);
  });
}

// Theme toggle
const toggle = document.getElementById("theme-toggle");
toggle.onclick = () => {
  document.body.classList.toggle("light-mode");
  toggle.textContent = document.body.classList.contains("light-mode") ? "☀️" : "🌙";
};

// Announcement bar
function loadAnnouncementBar() {
  const text = localStorage.getItem("announcement") || "";
  const bar = document.getElementById("announcement-bar");
  if (!bar) return;
  if (text.trim() !== "") {
    bar.textContent = text;
    bar.style.display = "block";
  } else {
    bar.style.display = "none";
  }
}

// Timer bar
function loadTimerBar() {
  const bar = document.getElementById("timer-bar");
  if (!bar) return;

  const end = parseInt(localStorage.getItem("timerEnd") || "0", 10);
  if (!end || Date.now() >= end) {
    bar.style.display = "none";
    return;
  }

  bar.style.display = "block";

  function update() {
    const now = Date.now();
    const diff = end - now;
    if (diff <= 0) {
      bar.textContent = "Time is up!";
      localStorage.removeItem("timerEnd");
      return;
    }
    const mins = Math.floor(diff / 60000);
    const secs = Math.floor((diff % 60000) / 1000);
    bar.textContent = `Timer: ${mins}m ${secs}s remaining`;
    requestAnimationFrame(update);
  }

  update();
}

// Maintenance mode
function checkMaintenance() {
  const on = localStorage.getItem("maintenance") === "on";
  const overlay = document.getElementById("maintenance-overlay");
  if (overlay) overlay.style.display = on ? "flex" : "none";
}

// Changelog
function loadChangelog() {
  const log = localStorage.getItem("changelog") || "";
  const box = document.getElementById("changelog-content");
  if (box) box.textContent = log;
}

// Fullscreen
document.getElementById("fullscreen-btn").onclick = () => {
  const frame = document.getElementById("game-frame");
  const hint = document.getElementById("fullscreen-hint");
  if (frame.requestFullscreen) frame.requestFullscreen();
  else if (frame.webkitRequestFullscreen) frame.webkitRequestFullscreen();
  if (hint) hint.style.opacity = "1";
  setTimeout(() => { if (hint) hint.style.opacity = "0"; }, 3000);
};

// AI Mode
const aiOrb = document.getElementById("ai-orb");
const aiModal = document.getElementById("ai-modal");
const aiModalContent = document.getElementById("ai-modal-content");
const aiCloseBtn = document.getElementById("ai-close-btn");
const aiInput = document.getElementById("ai-input");
const aiSendBtn = document.getElementById("ai-send-btn");
const aiMessages = document.getElementById("ai-messages");

function openAiModal() {
  aiModal.style.display = "flex";
  aiInput.focus();
}

function closeAiModal() {
  aiModal.style.display = "none";
}

aiOrb.onclick = openAiModal;
aiCloseBtn.onclick = closeAiModal;
aiModal.addEventListener("click", e => {
  if (e.target === aiModal) closeAiModal();
});

function addAiMessage(text, type) {
  const div = document.createElement("div");
  div.className = `ai-message ai-message-${type}`;
  div.textContent = text;
  aiMessages.appendChild(div);
  aiMessages.scrollTop = aiMessages.scrollHeight;
}

function generateAiResponse(prompt) {
  const lower = prompt.toLowerCase();
  if (lower.includes("quiz") || lower.includes("questions")) {
    return "Here’s a quick practice set:\n1) Define the main idea in one sentence.\n2) List two key details.\n3) Explain why this topic matters in real life.";
  }
  if (lower.includes("explain")) {
    return "To explain something clearly, break it into:\n• What it is\n• Why it matters\n• A simple example\n• One way to remember it.";
  }
  if (lower.includes("math")) {
    return "For math problems, try:\n1) Write down what you know.\n2) Write what you’re solving for.\n3) Show each step.\n4) Check your answer with the original problem.";
  }
  return "Here’s a way to think about it:\n• Start with a simple definition.\n• Add one real‑life example.\n• Then try to explain it back in your own words.\nIf you tell me the exact topic, I can structure it like that.";
}

function handleAiSend() {
  const text = aiInput.value.trim();
  if (!text) return;
  addAiMessage(text, "user");
  aiInput.value = "";
  setTimeout(() => {
    const reply = generateAiResponse(text);
    addAiMessage(reply, "bot");
  }, 400);
}

aiSendBtn.onclick = handleAiSend;
aiInput.addEventListener("keydown", e => {
  if (e.key === "Enter") handleAiSend();
});

// Loader
window.addEventListener("load", () => {
  document.getElementById("loader").style.display = "none";
});

loadGames();
loadAnnouncementBar();
loadTimerBar();
checkMaintenance();
loadChangelog();
