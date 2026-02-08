let games = [];

async function loadGames() {
  const saved = localStorage.getItem("games");
  if (saved) {
    games = JSON.parse(saved);
  } else {
    const res = await fetch("games.json");
    games = await res.json();
  }

  renderGames(games);
}

function renderGames(list) {
  const container = document.getElementById("game-list");
  const frame = document.getElementById("game-frame");
  const title = document.querySelector("#game-viewer h2");

  container.innerHTML = "";

  list.forEach(game => {
    const div = document.createElement("div");
    div.className = "game-item";

    div.innerHTML = `
      <img src="${game.thumb}">
      <span>${game.name}</span>
    `;

    div.onclick = () => {
      title.textContent = game.name;
      frame.src = game.url;
    };

    container.appendChild(div);
  });
}

document.getElementById("search").addEventListener("input", e => {
  const q = e.target.value.toLowerCase();
  const filtered = games.filter(g => g.name.toLowerCase().includes(q));
  renderGames(filtered);
});

document.getElementById("category-filter").addEventListener("change", e => {
  const cat = e.target.value;
  if (cat === "all") {
    renderGames(games);
  } else {
    const filtered = games.filter(g => g.category === cat);
    renderGames(filtered);
  }
});

const toggle = document.getElementById("theme-toggle");

toggle.onclick = () => {
  document.body.classList.toggle("light-mode");
  toggle.textContent = document.body.classList.contains("light-mode") ? "☀️" : "🌙";
};

loadGames();
