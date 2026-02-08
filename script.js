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
      frame.src = game.url;

      // recent
      let recent = JSON.parse(localStorage.getItem("recent") || "[]");
      recent = recent.filter(n => n !== game.name);
      recent.unshift(game.name);
      recent = recent.slice(0, 6);
      localStorage.setItem("recent", JSON.stringify(recent));

      // player log
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

  // use games with featured === true, else first 4
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
  if (frame.requestFullscreen) frame.requestFullscreen();
  else if (frame.webkitRequestFullscreen) frame.webkitRequestFullscreen();
};

// Quiz Builder
const quizBtn = document.getElementById("quiz-mode-btn");
const quizModal = document.getElementById("quiz-modal");
const quizCloseBtns = document.querySelectorAll(".overlay-close");

quizBtn.onclick = () => {
  quizModal.style.display = "flex";
};

quizCloseBtns.forEach(btn => {
  btn.addEventListener("click", () => {
    const target = btn.dataset.target;
    document.getElementById(target).style.display = "none";
  });
});

document.getElementById("quiz-start-btn").onclick = () => {
  const title = document.getElementById("quiz-title").value || "Quiz";
  const raw = document.getElementById("quiz-questions").value;
  const lines = raw.split("\n").map(l => l.trim()).filter(l => l);
  const area = document.getElementById("quiz-play-area");

  if (lines.length === 0) {
    area.textContent = "Add at least one question.";
    return;
  }

  let index = 0;
  let score = 0;

  function showQuestion() {
    if (index >= lines.length) {
      area.innerHTML = `<h3>${title} finished!</h3><p>Score: ${score} / ${lines.length}</p>`;
      return;
    }
    const q = lines[index];
    area.innerHTML = `
      <h3>${title}</h3>
      <p>Question ${index + 1} of ${lines.length}</p>
      <p>${q}</p>
      <input id="quiz-answer" placeholder="Type your answer (not graded)">
      <button id="quiz-next">Next</button>
    `;
    document.getElementById("quiz-next").onclick = () => {
      score++; // just count attempts so it feels interactive
      index++;
      showQuestion();
    };
  }

  showQuestion();
};

// BLK mini search
const blkBtn = document.getElementById("blk-search-btn");
const blkModal = document.getElementById("blk-modal");
const blkInput = document.getElementById("blk-search-input");
const blkGo = document.getElementById("blk-search-go");
const blkResults = document.getElementById("blk-results");

blkBtn.onclick = () => {
  blkModal.style.display = "flex";
  blkInput.focus();
};

blkGo.onclick = () => {
  const q = blkInput.value.toLowerCase();
  const filtered = games.filter(g =>
    g.name.toLowerCase().includes(q) ||
    (g.category || "").toLowerCase().includes(q)
  );
  blkResults.innerHTML = "";
  if (filtered.length === 0) {
    blkResults.textContent = "No results.";
    return;
  }
  filtered.forEach(g => {
    const div = document.createElement("div");
    div.style.padding = "6px 0";
    div.style.cursor = "pointer";
    div.textContent = `${g.name} (${g.category || "Other"})`;
    div.onclick = () => {
      document.getElementById("game-title").textContent = g.name;
      document.getElementById("game-frame").src = g.url;
      blkModal.style.display = "none";
    };
    blkResults.appendChild(div);
  });
};

// Loader
window.addEventListener("load", () => {
  document.getElementById("loader").style.display = "none";
});

loadGames();
loadAnnouncementBar();
loadTimerBar();
checkMaintenance();
loadChangelog();
