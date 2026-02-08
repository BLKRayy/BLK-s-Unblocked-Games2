// script.js

let games = [];
let playCounts = {}; // name -> count

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

// Load play counts
function loadPlayCounts() {
  try {
    playCounts = JSON.parse(localStorage.getItem("playCounts") || "{}");
  } catch {
    playCounts = {};
  }
}

function savePlayCounts() {
  localStorage.setItem("playCounts", JSON.stringify(playCounts));
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
  renderMostPlayed();
}

// Game grid
function renderGameGrid(list) {
  const grid = document.getElementById("game-grid");
  const frame = document.getElementById("game-frame");
  const title = document.getElementById("game-title");
  const subtitle = document.getElementById("game-subtitle");

  grid.innerHTML = "";

  list.forEach((game, index) => {
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

    // wave animation delay
    setTimeout(() => {
      card.classList.add("wave-in");
    }, index * 40);

    card.addEventListener("click", e => {
      if (e.target.classList.contains("fav-btn")) return;

      // ripple effect
      card.classList.remove("ripple");
      void card.offsetWidth;
      card.classList.add("ripple");

      title.textContent = game.name;
      subtitle.textContent = game.description || "Enjoy your game.";
      frame.src = game.url;

      // recent
      let recent = JSON.parse(localStorage.getItem("recent") || "[]");
      recent = recent.filter(n => n !== game.name);
      recent.unshift(game.name);
      recent = recent.slice(0, 6);
      localStorage.setItem("recent", JSON.stringify(recent));

      // play log
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

      // play counts
      playCounts[game.name] = (playCounts[game.name] || 0) + 1;
      savePlayCounts();
      renderMostPlayed();
      updateInfoPanel(game);
      openInfoPanel();
    });

    // tilt effect
    card.addEventListener("mousemove", e => {
      const rect = card.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const centerX = rect.width / 2;
      const centerY = rect.height / 2;
      const rotateX = ((y - centerY) / centerY) * 4;
      const rotateY = ((x - centerX) / centerX) * -4;
      card.style.transform = `translateY(-3px) rotateX(${rotateX}deg) rotateY(${rotateY}deg)`;
    });

    card.addEventListener("mouseleave", () => {
      card.style.transform = "";
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

// Featured (top games) + carousel
let featuredOffset = 0;

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

      playCounts[game.name] = (playCounts[game.name] || 0) + 1;
      savePlayCounts();
      renderMostPlayed();
      updateInfoPanel(game);
      openInfoPanel();
    };
    container.appendChild(div);
  });

  featuredOffset = 0;
  updateFeaturedTransform();
}

function updateFeaturedTransform() {
  const container = document.getElementById("featured-list");
  const wrap = document.getElementById("featured-list-wrap");
  if (!container || !wrap) return;
  const maxOffset = Math.max(0, container.scrollWidth - wrap.clientWidth);
  if (featuredOffset < 0) featuredOffset = 0;
  if (featuredOffset > maxOffset) featuredOffset = maxOffset;
  container.style.transform = `translateX(-${featuredOffset}px)`;
}

document.getElementById("featured-prev").onclick = () => {
  featuredOffset -= 120;
  updateFeaturedTransform();
};

document.getElementById("featured-next").onclick = () => {
  featuredOffset += 120;
  updateFeaturedTransform();
};

// auto-scroll
setInterval(() => {
  const wrap = document.getElementById("featured-list-wrap");
  const container = document.getElementById("featured-list");
  if (!wrap || !container) return;
  const maxOffset = Math.max(0, container.scrollWidth - wrap.clientWidth);
  if (maxOffset <= 0) return;
  featuredOffset += 60;
  if (featuredOffset > maxOffset) featuredOffset = 0;
  updateFeaturedTransform();
}, 5000);

// Most Played
function renderMostPlayed() {
  const list = document.getElementById("most-played-list");
  if (!list) return;
  list.innerHTML = "";

  const entries = Object.entries(playCounts);
  if (entries.length === 0) {
    list.innerHTML = `<div class="most-played-item">Play some games to see stats here.</div>`;
    return;
  }

  entries
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .forEach(([name, count]) => {
      const game = games.find(g => g.name === name);
      if (!game) return;
      const div = document.createElement("div");
      div.className = "most-played-item";
      div.textContent = `${game.name} (${count})`;
      list.appendChild(div);
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

// Game Info Panel
const infoPanel = document.getElementById("game-info-panel");
const infoCloseBtn = document.getElementById("info-close-btn");

function updateInfoPanel(game) {
  if (!infoPanel) return;
  document.getElementById("info-title").textContent = game.name;
  document.getElementById("info-description").textContent = game.description || "No description.";
  document.getElementById("info-category").textContent = game.category || "Other";
  document.getElementById("info-tags").textContent = (game.tags || []).join(", ") || "None";
  document.getElementById("info-rating").textContent = game.rating ? `${game.rating}/5` : "N/A";
  document.getElementById("info-plays").textContent = playCounts[game.name] || 0;
}

function openInfoPanel() {
  if (!infoPanel) return;
  infoPanel.style.display = "flex";
}

function closeInfoPanel() {
  if (!infoPanel) return;
  infoPanel.style.display = "none";
}

infoCloseBtn.onclick = closeInfoPanel;

// AI Mode
const aiOrb = document.getElementById("ai-orb");
const aiModal = document.getElementById("ai-modal");
const aiModalContent = document.getElementById("ai-modal-content");
const aiCloseBtn = document.getElementById("ai-close-btn");
const aiInput = document.getElementById("ai-input");
const aiSendBtn = document.getElementById("ai-send-btn");
const aiMessages = document.getElementById("ai-messages");
const aiTyping = document.getElementById("ai-typing-indicator");

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

function showTyping(show) {
  aiTyping.classList.toggle("hidden", !show);
}

function handleAiSend() {
  const text = aiInput.value.trim();
  if (!text) return;
  addAiMessage(text, "user");
  aiInput.value = "";
  showTyping(true);
  setTimeout(() => {
    const reply = generateAiResponse(text);
    showTyping(false);
    addAiMessage(reply, "bot");
  }, 600);
}

aiSendBtn.onclick = handleAiSend;
aiInput.addEventListener("keydown", e => {
  if (e.key === "Enter") handleAiSend();
});

// Loader
window.addEventListener("load", () => {
  document.getElementById("loader").style.display = "none";
});

loadPlayCounts();
loadGames();
loadAnnouncementBar();
loadTimerBar();
checkMaintenance();
loadChangelog();
