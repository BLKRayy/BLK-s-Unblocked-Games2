let games = [];

// player name + input
let playerName = localStorage.getItem("playerName") || "";
const playerInput = document.getElementById("player-name");
if (playerInput) {
  playerInput.value = playerName;
  playerInput.addEventListener("input", e => {
    playerName = e.target.value.trim();
    localStorage.setItem("playerName", playerName);
  });
}

// Always load games.json first, then override with localStorage if present
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

  renderGames(games);
  loadFeatured();
}

function renderGames(list) {
  const container = document.getElementById("game-list");
  const frame = document.getElementById("game-frame");
  const title = document.getElementById("game-title");

  container.innerHTML = "";

  list.forEach(game => {
    const div = document.createElement("div");
    div.className = "game-item";

    div.innerHTML = `
      <img src="${game.thumb}">
      <span>${game.name}</span>
      <button class="fav-btn" data-name="${game.name}">⭐</button>
    `;

    div.onclick = e => {
      if (e.target.classList.contains("fav-btn")) return;

      title.textContent = game.name;
      frame.src = game.url;

      // recent
      let recent = JSON.parse(localStorage.getItem("recent") || "[]");
      recent = recent.filter(n => n !== game.name);
      recent.unshift(game.name);
      recent = recent.slice(0, 6);
      localStorage.setItem("recent", JSON.stringify(recent));

      // player log (this device)
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
    };

    container.appendChild(div);
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
  renderGames(filtered);
});

// Category filter
document.getElementById("category-filter").addEventListener("change", e => {
  const cat = e.target.value;
  if (cat === "all") {
    renderGames(games);
  } else {
    const filtered = games.filter(g => g.category === cat);
    renderGames(filtered);
  }
});

// Favorites filter
document.getElementById("show-favorites").onclick = () => {
  const favs = JSON.parse(localStorage.getItem("favorites") || "[]");
  const filtered = games.filter(g => favs.includes(g.name));
  renderGames(filtered);
};

// Recent filter
document.getElementById("show-recent").onclick = () => {
  const recent = JSON.parse(localStorage.getItem("recent") || "[]");
  const filtered = games.filter(g => recent.includes(g.name));
  renderGames(filtered);
};

// Featured
function loadFeatured() {
  const featured = games.slice(0, 4);
  const container = document.getElementById("featured-list");
  container.innerHTML = "";

  featured.forEach(game => {
    const div = document.createElement("div");
    div.className = "featured-item";
    div.innerHTML = `<img src="${game.thumb}" style="width:100%; border-radius:4px;"><br>${game.name}`;
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

// Loader
window.onload = () => {
  document.getElementById("loader").style.display = "none";
};

loadGames();
loadAnnouncementBar();
loadTimerBar();
