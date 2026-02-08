const USER = "Loyal";
const PASS = "password";

const loginBox = document.getElementById("login-box");
const panel = document.getElementById("admin-panel");

document.getElementById("login-btn").onclick = () => {
  const u = document.getElementById("user").value;
  const p = document.getElementById("pass").value;

  if (u === USER && p === PASS) {
    loginBox.style.display = "none";
    panel.style.display = "block";
    loadAdminGames();
  } else {
    document.getElementById("error").textContent = "Invalid login";
  }
};

function loadAdminGames() {
  const saved = localStorage.getItem("games");
  let games = saved ? JSON.parse(saved) : [];

  const list = document.getElementById("game-list-admin");
  list.innerHTML = "";

  games.forEach((g, i) => {
    const li = document.createElement("li");
    li.innerHTML = `
      ${g.name} (${g.category})
      <button onclick="removeGame(${i})">Delete</button>
    `;
    list.appendChild(li);
  });
}

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

function removeGame(i) {
  const saved = localStorage.getItem("games");
  let games = saved ? JSON.parse(saved) : [];

  games.splice(i, 1);
  localStorage.setItem("games", JSON.stringify(games));

  loadAdminGames();
}
