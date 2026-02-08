// BLK Games Admin v2
// Core state
let games = [];
let activityLog = [];
let adminSettings = {
  banner: {
    enabled: false,
    title: "",
    message: "",
    color: "#2563eb"
  },
  maintenance: {
    enabled: false,
    message: "The site is under maintenance. Please check back soon."
  },
  theme: {
    preset: "dark",
    accent: "#2563eb",
    customCSS: ""
  },
  security: {
    username: "admin",
    password: "admin",
    pin: "",
    ipBanList: []
  }
};

// ---------- UTILITIES ----------
function logAction(text) {
  const time = new Date().toLocaleTimeString();
  const entry = `[${time}] ${text}`;
  activityLog.unshift(entry);
  if (activityLog.length > 200) activityLog.pop();
  renderActivityLog();
  try {
    localStorage.setItem("blk_admin_log", JSON.stringify(activityLog));
  } catch (e) {}
}

function $(id) {
  return document.getElementById(id);
}

function loadFromStorage() {
  try {
    const storedSettings = localStorage.getItem("blk_admin_settings");
    if (storedSettings) {
      adminSettings = JSON.parse(storedSettings);
    }
    const storedLog = localStorage.getItem("blk_admin_log");
    if (storedLog) {
      activityLog = JSON.parse(storedLog);
    }
  } catch (e) {
    console.warn("Failed to load admin settings/log", e);
  }
}

function saveSettings() {
  try {
    localStorage.setItem("blk_admin_settings", JSON.stringify(adminSettings));
  } catch (e) {
    console.warn("Failed to save admin settings", e);
  }
}

// ---------- NAVIGATION ----------
function setupNavigation() {
  const buttons = document.querySelectorAll(".admin-nav button");
  buttons.forEach(btn => {
    btn.addEventListener("click", () => {
      buttons.forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      const sectionId = btn.getAttribute("data-section");
      switchSection(sectionId);
    });
  });

  $("btn-exit-admin").addEventListener("click", () => {
    window.location.href = "index.html";
  });
}

function switchSection(sectionKey) {
  const sections = document.querySelectorAll(".admin-section");
  sections.forEach(sec => sec.classList.remove("active"));
  const target = $("section-" + sectionKey);
  if (target) target.classList.add("active");

  const titles = {
    dashboard: ["Dashboard", "Overview of your BLK Games platform."],
    games: ["Games", "Manage your game library."],
    featured: ["Featured & Home", "Control featured games and homepage hero."],
    categories: ["Categories & Tags", "Organize your library."],
    analytics: ["Analytics", "See what players are doing."],
    theme: ["Theme & CSS", "Customize the look and feel."],
    security: ["Security", "Control access and credentials."],
    tools: ["Tools & Experiments", "Debug and experiment."],
    logs: ["Activity Log", "See what you've changed."]
  };
  const [title, subtitle] = titles[sectionKey] || ["Admin", ""];
  $("admin-section-title").textContent = title;
  $("admin-section-subtitle").textContent = subtitle;
}

// ---------- LOAD GAMES ----------
async function loadGames() {
  try {
    const res = await fetch("games.json?cache=" + Date.now());
    games = await res.json();
    if (!Array.isArray(games)) games = [];
    renderGamesTable();
    updateDashboardStats();
    renderFeaturedList();
    renderCategoriesAndTags();
    logAction("Loaded games.json (" + games.length + " games).");
  } catch (e) {
    console.error("Failed to load games.json", e);
    $("stat-json-status").textContent = "games.json: ERROR";
    $("stat-json-status").style.background = "#7f1d1d";
    logAction("Error loading games.json.");
  }
}

// ---------- DASHBOARD ----------
function updateDashboardStats() {
  $("stat-total-games").textContent = games.length.toString();
  const featuredCount = games.filter(g => g.featured).length;
  $("stat-featured-count").textContent = featuredCount + " featured";

  // Simple device estimate
  const isMobile = /Mobi|Android/i.test(navigator.userAgent);
  $("stat-device-split").textContent = isMobile ? "Mobile 100%" : "Desktop 100%";

  // JSON status
  $("stat-json-status").textContent = "games.json: OK";
  $("stat-json-status").style.background = "#111827";

  // Admin mode
  $("stat-admin-mode").textContent = adminSettings.maintenance.enabled ? "Admin mode: Maintenance" : "Admin mode: Normal";
  $("maintenance-indicator").textContent = "Maintenance: " + (adminSettings.maintenance.enabled ? "On" : "Off");
}

// ---------- BANNER ----------
function initBannerControls() {
  const b = adminSettings.banner;
  $("banner-title").value = b.title || "";
  $("banner-message").value = b.message || "";
  $("banner-color").value = b.color || "#2563eb";
  setToggleState("banner-toggle", b.enabled);

  $("banner-toggle").addEventListener("click", () => {
    toggleElement("banner-toggle");
    adminSettings.banner.enabled = isToggleOn("banner-toggle");
    saveSettings();
    logAction("Banner " + (adminSettings.banner.enabled ? "enabled" : "disabled") + ".");
  });

  $("btn-save-banner").addEventListener("click", () => {
    adminSettings.banner.title = $("banner-title").value.trim();
    adminSettings.banner.message = $("banner-message").value.trim();
    adminSettings.banner.color = $("banner-color").value || "#2563eb";
    saveSettings();
    logAction("Banner settings saved.");
    alert("Banner settings saved. Make sure your homepage reads them from localStorage.");
  });
}

// ---------- MAINTENANCE ----------
function initMaintenanceControls() {
  setToggleState("maintenance-toggle", adminSettings.maintenance.enabled);
  $("maintenance-indicator").textContent = "Maintenance: " + (adminSettings.maintenance.enabled ? "On" : "Off");

  $("maintenance-toggle").addEventListener("click", () => {
    toggleElement("maintenance-toggle");
    adminSettings.maintenance.enabled = isToggleOn("maintenance-toggle");
    saveSettings();
    updateDashboardStats();
    logAction("Maintenance mode " + (adminSettings.maintenance.enabled ? "enabled" : "disabled") + ".");
  });

  $("btn-maintenance-message").addEventListener("click", () => {
    const msg = prompt("Enter maintenance message:", adminSettings.maintenance.message);
    if (msg !== null) {
      adminSettings.maintenance.message = msg;
      saveSettings();
      logAction("Updated maintenance message.");
    }
  });
}

// ---------- TOGGLES ----------
function setToggleState(id, on) {
  const el = $(id);
  if (!el) return;
  if (on) el.classList.add("on");
  else el.classList.remove("on");
}

function toggleElement(id) {
  const el = $(id);
  if (!el) return;
  el.classList.toggle("on");
}

function isToggleOn(id) {
  const el = $(id);
  return el && el.classList.contains("on");
}

// ---------- GAMES TABLE ----------
function renderGamesTable(filter = "") {
  const tbody = $("games-table-body");
  tbody.innerHTML = "";
  const q = filter.toLowerCase();

  games.forEach((g, index) => {
    if (q) {
      const hay = (g.name + " " + g.category + " " + (g.tags || []).join(" ")).toLowerCase();
      if (!hay.includes(q)) return;
    }
    const tr = document.createElement("tr");

    const tdName = document.createElement("td");
    tdName.textContent = g.name;
    tr.appendChild(tdName);

    const tdCat = document.createElement("td");
    tdCat.textContent = g.category || "";
    tr.appendChild(tdCat);

    const tdFeat = document.createElement("td");
    const featBadge = document.createElement("span");
    featBadge.className = "admin-badge";
    featBadge.textContent = g.featured ? "Yes" : "No";
    tdFeat.appendChild(featBadge);
    tr.appendChild(tdFeat);

    const tdVisible = document.createElement("td");
    const visBadge = document.createElement("span");
    visBadge.className = "admin-badge";
    const hidden = g.hidden === true;
    visBadge.textContent = hidden ? "Hidden" : "Visible";
    visBadge.style.background = hidden ? "#7f1d1d" : "#111827";
    tdVisible.appendChild(visBadge);
    tr.appendChild(tdVisible);

    const tdRating = document.createElement("td");
    tdRating.textContent = (g.rating || 0).toString();
    tr.appendChild(tdRating);

    const tdActions = document.createElement("td");
    const editBtn = document.createElement("button");
    editBtn.textContent = "Edit";
    editBtn.className = "admin-btn secondary";
    editBtn.style.padding = "3px 8px";
    editBtn.style.fontSize = "11px";
    editBtn.addEventListener("click", () => loadGameIntoForm(index));

    const hideBtn = document.createElement("button");
    hideBtn.textContent = g.hidden ? "Show" : "Hide";
    hideBtn.className = "admin-btn secondary";
    hideBtn.style.padding = "3px 8px";
    hideBtn.style.fontSize = "11px";
    hideBtn.addEventListener("click", () => toggleGameVisibility(index));

    const delBtn = document.createElement("button");
    delBtn.textContent = "Delete";
    delBtn.className = "admin-btn danger";
    delBtn.style.padding = "3px 8px";
    delBtn.style.fontSize = "11px";
    delBtn.addEventListener("click", () => deleteGame(index));

    tdActions.appendChild(editBtn);
    tdActions.appendChild(hideBtn);
    tdActions.appendChild(delBtn);
    tdActions.style.display = "flex";
    tdActions.style.gap = "4px";

    tr.appendChild(tdActions);

    tbody.appendChild(tr);
  });
}

function loadGameIntoForm(index) {
  const g = games[index];
  $("game-id").value = index.toString();
  $("game-name").value = g.name || "";
  $("game-url").value = g.url || "";
  $("game-category").value = g.category || "";
  $("game-tags").value = (g.tags || []).join(", ");
  $("game-rating").value = g.rating || 5;
  setToggleState("game-featured-toggle", !!g.featured);
  logAction("Loaded game into form: " + g.name);
}

function toggleGameVisibility(index) {
  const g = games[index];
  g.hidden = !g.hidden;
  renderGamesTable($("game-search").value);
  saveGamesJSON();
  logAction((g.hidden ? "Hid" : "Showed") + " game: " + g.name);
}

function deleteGame(index) {
  const g = games[index];
  if (!confirm("Delete game: " + g.name + "?")) return;
  games.splice(index, 1);
  renderGamesTable($("game-search").value);
  updateDashboardStats();
  saveGamesJSON();
  logAction("Deleted game: " + g.name);
}

// ---------- SAVE GAME ----------
function initGameForm() {
  $("game-featured-toggle").addEventListener("click", () => {
    toggleElement("game-featured-toggle");
  });

  $("btn-save-game").addEventListener("click", () => {
    const id = $("game-id").value.trim();
    const name = $("game-name").value.trim();
    const url = $("game-url").value.trim();
    const category = $("game-category").value.trim() || "Other";
    const tags = $("game-tags").value.split(",").map(t => t.trim()).filter(Boolean);
    const rating = parseInt($("game-rating").value, 10) || 5;
    const featured = isToggleOn("game-featured-toggle");

    if (!name || !url) {
      alert("Name and URL are required.");
      return;
    }

    const gameObj = {
      name,
      url,
      thumb: "logo.png",
      category,
      featured,
      rating,
      tags,
      description: "No description yet."
    };

    if (id !== "") {
      const idx = parseInt(id, 10);
      if (!isNaN(idx) && games[idx]) {
        games[idx] = { ...games[idx], ...gameObj };
        logAction("Updated game: " + name);
      }
    } else {
      games.push(gameObj);
      logAction("Added new game: " + name);
    }

    $("game-id").value = "";
    $("game-name").value = "";
    $("game-url").value = "";
    $("game-category").value = "";
    $("game-tags").value = "";
    $("game-rating").value = "5";
    setToggleState("game-featured-toggle", false);

    renderGamesTable($("game-search").value);
    updateDashboardStats();
    saveGamesJSON();
  });

  $("game-search").addEventListener("input", () => {
    renderGamesTable($("game-search").value);
  });
}

// ---------- SAVE games.json (client-side export) ----------
function saveGamesJSON() {
  // We can't write to server from client, so we export as download
  // and also store in localStorage as a backup.
  try {
    localStorage.setItem("blk_games_backup", JSON.stringify(games));
  } catch (e) {}
}

function initBackupControls() {
  $("btn-export-games").addEventListener("click", () => {
    const blob = new Blob([JSON.stringify(games, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "games-export.json";
    a.click();
    URL.revokeObjectURL(url);
    logAction("Exported games.json.");
  });

  $("btn-import-games").addEventListener("click", () => {
    const text = $("import-json").value.trim();
    if (!text) {
      alert("Paste JSON into the box first.");
      return;
    }
    try {
      const arr = JSON.parse(text);
      if (!Array.isArray(arr)) throw new Error("Not an array");
      games = arr;
      renderGamesTable();
      updateDashboardStats();
      saveGamesJSON();
      logAction("Imported games from JSON.");
      alert("Imported games. Remember to update games.json in GitHub with this new data.");
    } catch (e) {
      alert("Invalid JSON: " + e.message);
    }
  });

  $("btn-backup-games").addEventListener("click", () => {
    try {
      localStorage.setItem("blk_games_backup_manual", JSON.stringify(games));
      logAction("Created manual backup of games.");
      alert("Backup saved to localStorage (blk_games_backup_manual).");
    } catch (e) {
      alert("Failed to save backup.");
    }
  });

  $("btn-restore-defaults").addEventListener("click", () => {
    if (!confirm("This will restore from local backup (if exists). Continue?")) return;
    try {
      const backup = localStorage.getItem("blk_games_backup_manual") || localStorage.getItem("blk_games_backup");
      if (!backup) {
        alert("No backup found.");
        return;
      }
      games = JSON.parse(backup);
      renderGamesTable();
      updateDashboardStats();
      saveGamesJSON();
      logAction("Restored games from backup.");
    } catch (e) {
      alert("Failed to restore backup.");
    }
  });
}

// ---------- FEATURED ----------
function renderFeaturedList() {
  const container = $("featured-list");
  container.innerHTML = "";
  games.forEach(g => {
    if (!g.featured) return;
    const chip = document.createElement("div");
    chip.className = "admin-chip";
    chip.textContent = g.name;
    container.appendChild(chip);
  });
}

// ---------- CATEGORIES & TAGS ----------
function renderCategoriesAndTags() {
  const categories = new Set();
  const tags = new Set();
  games.forEach(g => {
    if (g.category) categories.add(g.category);
    (g.tags || []).forEach(t => tags.add(t));
  });

  $("category-list").innerHTML = Array.from(categories).map(c => `<span class="admin-chip">${c}</span>`).join(" ");
  $("tag-list").innerHTML = Array.from(tags).map(t => `<span class="admin-chip">${t}</span>`).join(" ");
}

function initCategoryTagControls() {
  $("btn-add-category").addEventListener("click", () => {
    const name = $("category-name").value.trim();
    if (!name) return;
    // Just a visual add; real categories are from games
    logAction("Category added (visual only): " + name);
    $("category-name").value = "";
    alert("Categories are derived from games. To truly add a category, assign it to a game.");
  });

  $("btn-merge-categories").addEventListener("click", () => {
    const from = prompt("Merge FROM category:");
    const to = prompt("Merge INTO category:");
    if (!from || !to) return;
    games.forEach(g => {
      if (g.category === from) g.category = to;
    });
    renderGamesTable($("game-search").value);
    renderCategoriesAndTags();
    saveGamesJSON();
    logAction(`Merged category "${from}" into "${to}".`);
  });

  $("btn-add-tag").addEventListener("click", () => {
    const name = $("tag-name").value.trim();
    if (!name) return;
    logAction("Tag added (visual only): " + name);
    $("tag-name").value = "";
    alert("Tags are derived from games. To truly add a tag, assign it to a game.");
  });

  $("btn-auto-tag").addEventListener("click", () => {
    games.forEach(g => {
      const name = (g.name || "").toLowerCase();
      g.tags = g.tags || [];
      if (name.includes("multiplayer") && !g.tags.includes("multiplayer")) g.tags.push("multiplayer");
      if (name.includes("2048") && !g.tags.includes("2048")) g.tags.push("2048");
      if (name.includes("run") && !g.tags.includes("runner")) g.tags.push("runner");
    });
    renderGamesTable($("game-search").value);
    renderCategoriesAndTags();
    saveGamesJSON();
    logAction("Auto-tagged games based on names.");
  });
}

// ---------- ANALYTICS (LOCAL MOCK) ----------
function initAnalytics() {
  // Use localStorage keys from main site if you track plays there.
  const topGamesEl = $("analytics-top-games");
  const recentEl = $("analytics-recent");

  const top = JSON.parse(localStorage.getItem("blk_top_games") || "[]");
  const recent = JSON.parse(localStorage.getItem("blk_recent_games") || "[]");

  topGamesEl.innerHTML = top.length
    ? top.map(t => `<div>${t.name} — ${t.count} plays</div>`).join("")
    : "No top games data yet.";

  recentEl.innerHTML = recent.length
    ? recent.map(r => `<div>${r.name} — last played ${r.time}</div>`).join("")
    : "No recent activity yet.";

  $("analytics-load-time").value = localStorage.getItem("blk_avg_load_time") || "N/A";
  $("analytics-device").value = /Mobi|Android/i.test(navigator.userAgent) ? "Mobile" : "Desktop";
}

// ---------- THEME ----------
function initThemeControls() {
  $("theme-accent").value = adminSettings.theme.accent || "#2563eb";
  $("custom-css").value = adminSettings.theme.customCSS || "";

  document.querySelectorAll(".theme-preset").forEach(btn => {
    btn.addEventListener("click", () => {
      const preset = btn.getAttribute("data-theme");
      adminSettings.theme.preset = preset;
      saveSettings();
      applyThemePreset();
      logAction("Applied theme preset: " + preset);
    });
  });

  $("btn-apply-theme").addEventListener("click", () => {
    adminSettings.theme.accent = $("theme-accent").value || "#2563eb";
    saveSettings();
    applyThemePreset();
    logAction("Applied theme accent color.");
  });

  $("btn-apply-css").addEventListener("click", () => {
    const css = $("custom-css").value;
    adminSettings.theme.customCSS = css;
    saveSettings();
    applyCustomCSS();
    logAction("Applied custom CSS.");
  });

  $("btn-clear-css").addEventListener("click", () => {
    adminSettings.theme.customCSS = "";
    $("custom-css").value = "";
    saveSettings();
    applyCustomCSS();
    logAction("Cleared custom CSS.");
  });

  applyThemePreset();
  applyCustomCSS();
}

function applyThemePreset() {
  const preset = adminSettings.theme.preset;
  const accent = adminSettings.theme.accent || "#2563eb";
  document.documentElement.style.setProperty("--accent", accent);

  if (preset === "light") {
    document.body.style.background = "#f3f4f6";
  } else if (preset === "neon") {
    document.body.style.background = "radial-gradient(circle at top, #22c55e, #0f172a 55%, #020617 100%)";
  } else if (preset === "amoled") {
    document.body.style.background = "#000000";
  } else {
    document.body.style.background = "radial-gradient(circle at top left, #111827 0, #020617 45%, #000 100%)";
  }
}

function applyCustomCSS() {
  let styleEl = document.getElementById("admin-custom-css");
  if (!styleEl) {
    styleEl = document.createElement("style");
    styleEl.id = "admin-custom-css";
    document.head.appendChild(styleEl);
  }
  styleEl.textContent = adminSettings.theme.customCSS || "";
}

// ---------- SECURITY ----------
function initSecurityControls() {
  $("admin-username-label").textContent = adminSettings.security.username || "admin";

  $("btn-save-security").addEventListener("click", () => {
    const u = $("security-username").value.trim();
    const p = $("security-password").value.trim();
    const pin = $("security-pin").value.trim();
    if (u) adminSettings.security.username = u;
    if (p) adminSettings.security.password = p;
    adminSettings.security.pin = pin;
    saveSettings();
    $("admin-username-label").textContent = adminSettings.security.username;
    logAction("Updated admin credentials (stored locally).");
    alert("Credentials saved locally. Make sure your login page reads from these settings.");
  });

  $("btn-save-ip-ban").addEventListener("click", () => {
    const list = $("security-ip-ban").value.split(",").map(x => x.trim()).filter(Boolean);
    adminSettings.security.ipBanList = list;
    saveSettings();
    logAction("Updated IP ban list.");
    alert("IP ban list saved locally. You must enforce it in your main script.");
  });
}

// ---------- TOOLS ----------
function initTools() {
  $("btn-clear-cache").addEventListener("click", () => {
    if (!confirm("Clear cache (reload page)?")) return;
    location.reload(true);
  });

  $("btn-reset-localstorage").addEventListener("click", () => {
    if (!confirm("Clear ALL localStorage for this site?")) return;
    localStorage.clear();
    logAction("Cleared localStorage.");
    alert("localStorage cleared. You may need to reload.");
  });

  $("btn-performance-mode").addEventListener("click", () => {
    const current = localStorage.getItem("blk_performance_mode") === "on";
    const next = !current;
    localStorage.setItem("blk_performance_mode", next ? "on" : "off");
    logAction("Performance mode set to: " + (next ? "on" : "off"));
    alert("Performance mode is now " + (next ? "ON" : "OFF") + ". Implement behavior in your main script.");
  });

  $("btn-run-js").addEventListener("click", () => {
    const code = $("custom-js").value;
    if (!code.trim()) return;
    try {
      // eslint-disable-next-line no-eval
      eval(code);
      logAction("Ran custom JS.");
    } catch (e) {
      alert("Error in custom JS: " + e.message);
    }
  });
}

// ---------- HERO SLIDER ----------
function initHeroControls() {
  const slidesKey = "blk_hero_slides";

  function renderSlides() {
    const slides = JSON.parse(localStorage.getItem(slidesKey) || "[]");
    $("hero-slides-preview").innerHTML = slides.length
      ? slides.map((s, i) => `<div>#${i + 1}: ${s.title} — ${s.subtitle}</div>`).join("")
      : "No slides configured.";
  }

  $("btn-add-hero-slide").addEventListener("click", () => {
    const title = $("hero-title").value.trim();
    const subtitle = $("hero-subtitle").value.trim();
    const btnText = $("hero-button-text").value.trim();
    const btnLink = $("hero-button-link").value.trim();
    const bg = $("hero-bg").value.trim();
    if (!title) {
      alert("Title is required.");
      return;
    }
    const slides = JSON.parse(localStorage.getItem(slidesKey) || "[]");
    slides.push({ title, subtitle, btnText, btnLink, bg });
    localStorage.setItem(slidesKey, JSON.stringify(slides));
    renderSlides();
    logAction("Added hero slide: " + title);
  });

  $("btn-clear-hero-slides").addEventListener("click", () => {
    if (!confirm("Clear all hero slides?")) return;
    localStorage.removeItem(slidesKey);
    renderSlides();
    logAction("Cleared hero slides.");
  });

  renderSlides();
}

// ---------- BROKEN LINK CHECKER ----------
function initLinkChecker() {
  $("btn-check-links").addEventListener("click", async () => {
    if (!confirm("This will send HEAD requests to each game URL. Continue?")) return;
    logAction("Started broken link check.");
    let broken = 0;
    for (const g of games) {
      try {
        const res = await fetch(g.url, { method: "HEAD" });
        if (!res.ok) {
          broken++;
          console.warn("Broken:", g.name, g.url);
        }
      } catch (e) {
        broken++;
        console.warn("Broken:", g.name, g.url);
      }
    }
    logAction("Broken link check finished. Broken: " + broken);
    alert("Broken link check finished. Broken: " + broken);
  });
}

// ---------- ACTIVITY LOG ----------
function renderActivityLog() {
  const logEl = $("activity-log");
  logEl.innerHTML = activityLog.map(e => `<div class="admin-log-entry">${e}</div>`).join("");
}

function initLogControls() {
  $("btn-clear-log").addEventListener("click", () => {
    if (!confirm("Clear activity log?")) return;
    activityLog = [];
    renderActivityLog();
    saveSettings();
  });
}

// ---------- INIT ----------
document.addEventListener("DOMContentLoaded", () => {
  loadFromStorage();
  setupNavigation();
  loadGames();
  initBannerControls();
  initMaintenanceControls();
  initGameForm();
  initBackupControls();
  initCategoryTagControls();
  initAnalytics();
  initThemeControls();
  initSecurityControls();
  initTools();
  initHeroControls();
  initLinkChecker();
  initLogControls();
  renderActivityLog();
  updateDashboardStats();
  logAction("Admin panel loaded.");
});
