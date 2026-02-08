const USER = "admin";
const PASS = "loyal";

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
