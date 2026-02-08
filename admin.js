const USER = "Loyal";
const PASS = "password";

const loginBox = document.getElementById("login-box");
const adminWrapper = document.getElementById("admin-wrapper");

// Login
document.getElementById("login-btn").onclick = () => {
  const u = document.getElementById("user").value;
  const p = document.getElementById("pass").value;

  if (u === USER && p === PASS) {
    loginBox.style.display = "none";
    adminWrapper.style.display = "flex";
    loadAdminGames();
    loadAnnouncement();
    loadTimerStatus();
    loadPlayerLog();
  } else {
    document.getElementById("error").textContent = "Invalid login";
  }
};

// Sign out
document.getElementById("logout-btn").onclick = () => {
  adminWrapper.style.display = "none";
  loginBox.style.display = "block";
};

// Navigation
const navButtons = document.querySelectorAll(".admin-nav-btn[data-section]");
navButtons.forEach(btn => {
  btn.addEventListener("click", () => {
    navButtons.forEach(b => b.classList.remove("active"));
    btn.classList.add("active");

    const section = btn.dataset.section;
    document.querySelectorAll("#admin-main .admin-section").forEach(sec => {
      sec.style.display = sec.id === "section-" + section ? "block" : "none";
    });
  });
});

// Load games for admin
function loadAdminGames() {
  const saved = localStorage.getItem("games");
  let games = [];

  if (saved) {
    try {
      games = JSON.parse(saved);
    } catch (e) {
      games = [];
    }
  }

  const list = document.getElementById("game-list-admin");
  list.innerHTML = "";

  games.forEach((g, i) => {
    const li = document.createElement("li");
    li.innerHTML = `
      <span>${g.name} (${g.category})</span>
      <div class="admin-game-actions">
        <button onclick="editGame(${i})">Edit</button>
        <button onclick="deleteGame(${i})">Delete</button>
      </div>
    `;
    list.appendChild(li);
  });
}

// Add game
document.getElementById("add-btn").onclick = () => {
  const name = document.getElementById("g-name").value;
  const url = document.getElementById("g-url").value;
  const thumb = document.getElementById("g-thumb").value;
  const category = document.getElementById("g-cat").value;

  const saved = localStorage.getItem("games");
  let games = saved ? JSON.parse(saved) : [];

  games.push({ name, url, thumb, category });
  localStorage.setItem("games", JSON.stringify(games));

  loadAdminGames();
};

// Edit game
window.editGame = function (i) {
  const saved = localStorage.getItem("games");
  let games = saved ? JSON.parse(saved) : [];

  const g = games[i];
  const name = prompt("Game Name:", g.name);
  if (name === null) return;
  const url = prompt("Game URL:", g.url);
  if (url === null) return;
  const thumb = prompt("Thumbnail URL:", g.thumb);
  if (thumb === null) return;
  const category = prompt("Category:", g.category);
  if (category === null) return;

  games[i] = { name, url, thumb, category };
  localStorage.setItem("games", JSON.stringify(games));
  loadAdminGames();
};

// Delete game
window.deleteGame = function (i) {
  const saved = localStorage.getItem("games");
  let games = saved ? JSON.parse(saved) : [];

  games.splice(i, 1);
  localStorage.setItem("games", JSON.stringify(games));
  loadAdminGames();
};

// Export games
document.getElementById("export-btn").onclick = () => {
  const saved = localStorage.getItem("games") || "[]";
  document.getElementById("import-export-area").value = saved;
};

// Import games
document.getElementById("import-btn").onclick = () => {
  const text = document.getElementById("import-export-area").value;
  try {
    const parsed = JSON.parse(text);
    if (Array.isArray(parsed)) {
      localStorage.setItem("games", JSON.stringify(parsed));
      loadAdminGames();
      alert("Games imported.");
    } else {
      alert("Invalid JSON format.");
    }
  } catch (e) {
    alert("Invalid JSON.");
  }
};

// Announcements
document.getElementById("save-announcement-btn").onclick = () => {
  const text = document.getElementById("announcement-text").value;
  localStorage.setItem("announcement", text);
  alert("Announcement saved. It will show on the main site.");
};

function loadAnnouncement() {
  const text = localStorage.getItem("announcement") || "";
  const box = document.getElementById("announcement-text");
  if (box) box.value = text;
}

// Timer controls
document.getElementById("start-timer-btn").onclick = () => {
  const mins = parseInt(document.getElementById("timer-minutes").value || "0", 10);
  if (!mins || mins <= 0) {
    alert("Enter minutes greater than 0.");
    return;
  }
  const end = Date.now() + mins * 60000;
  localStorage.setItem("timerEnd", String(end));
  loadTimerStatus();
  alert("Timer started. It will show on the main site.");
};

document.getElementById("clear-timer-btn").onclick = () => {
  localStorage.removeItem("timerEnd");
  loadTimerStatus();
  alert("Timer cleared.");
};

function loadTimerStatus() {
  const status = document.getElementById("timer-status");
  if (!status) return;
  const end = parseInt(localStorage.getItem("timerEnd") || "0", 10);
  if (!end || Date.now() >= end) {
    status.textContent = "No active timer.";
    return;
  }
  const diff = end - Date.now();
  const mins = Math.floor(diff / 60000);
  const secs = Math.floor((diff % 60000) / 1000);
  status.textContent = `Active timer: ${mins}m ${secs}s remaining`;
}

// Player log
function loadPlayerLog() {
  const list = document.getElementById("player-log-list");
  if (!list) return;
  const log = JSON.parse(localStorage.getItem("playLog") || "[]");
  list.innerHTML = "";
  log.forEach(entry => {
    const li = document.createElement("li");
    li.textContent = `${entry.name} played ${entry.game} at ${entry.time}`;
    list.appendChild(li);
  });
}

document.getElementById("clear-log-btn").onclick = () => {
  if (confirm("Clear player log on this device?")) {
    localStorage.removeItem("playLog");
    loadPlayerLog();
  }
};

// Reset to default (clear localStorage so site uses games.json again)
document.getElementById("reset-default-btn").onclick = () => {
  if (confirm("Reset to default games.json?")) {
    localStorage.removeItem("games");
    loadAdminGames();
    alert("Reset complete. Site will use games.json again.");
  }
};

// Clear all games
document.getElementById("clear-all-btn").onclick = () => {
  if (confirm("Clear ALL games?")) {
    localStorage.setItem("games", JSON.stringify([]));
    loadAdminGames();
    alert("All games cleared.");
  }
};
