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

      let recent = JSON.parse(localStorage.getItem("recent") || "[]");
      recent = recent.filter(n => n !== game.name);
      recent.unshift(game.name);
      recent = recent.slice(0, 6);
      localStorage.setItem("recent", JSON.stringify(recent));
    };

    container.appendChild(div);
  });
}

document.addEventListener("click", e => {
  if (e.target.classList.contains("fav-btn")) {
    const name = e.target.dataset.name;
    let favs = JSON.parse(localStorage.getItem("favorites") || "[]");

    if (!favs.includes(name)) favs.push(name);

    localStorage.setItem("favorites", JSON.stringify(favs));
  }
});

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

document.getElementById("show-favorites").onclick = () => {
  const favs = JSON.parse(localStorage.getItem("favorites") || "[]");
  const filtered = games.filter(g => favs.includes(g.name));
  renderGames(filtered);
};

document.getElementById("show-recent").onclick = () => {
  const recent = JSON.parse(localStorage.getItem("recent") || "[]");
  const filtered = games.filter(g => recent.includes(g.name));
  renderGames(filtered);
};

function loadFeatured() {
  const featured = games.slice(0, 4);
  const container = document.getElementById("featured-list");

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

const toggle = document.getElementById("theme-toggle");

toggle.onclick = () => {
  document.body.classList.toggle("light-mode");
  toggle.textContent = document.body.classList.contains("light-mode") ? "☀️" : "🌙";
};

window.onload = () => {
  document.getElementById("loader").style.display = "none";
};

loadGames();
