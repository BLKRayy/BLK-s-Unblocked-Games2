// Basic admin login + animation logic

// Elements
const appShell = document.getElementById("appShell");
const appBackground = document.getElementById("appBackground");
const loginForm = document.getElementById("loginForm");
const loginButton = document.getElementById("loginButton");
const loginButtonLabel = loginButton.querySelector(".login-button-label");
const loginError = document.getElementById("loginError");
const adminShell = document.getElementById("adminShell");
const adminNav = document.getElementById("adminNav");
const adminMainTitle = document.getElementById("adminMainTitle");
const adminMainSubtitle = document.getElementById("adminMainSubtitle");
const adminPrimaryTitle = document.getElementById("adminPrimaryTitle");
const adminPrimarySubtitle = document.getElementById("adminPrimarySubtitle");
const adminPrimaryBadge = document.getElementById("adminPrimaryBadge");
const adminSecondaryTitle = document.getElementById("adminSecondaryTitle");
const adminSecondarySubtitle = document.getElementById("adminSecondarySubtitle");
const adminActivityList = document.getElementById("adminActivityList");
const themeToggle = document.getElementById("themeToggle");

// Simple hardcoded credentials (replace with your own logic)
const ADMIN_USERNAME = "admin";
const ADMIN_PASSWORD = "password123";

// Simple state
let isLoggingIn = false;
let theme = "dark";

// Helper: set button loading state
function setLoginLoading(loading) {
  isLoggingIn = loading;
  if (loading) {
    loginButton.disabled = true;
    loginButtonLabel.textContent = "Verifying...";
    const spinner = document.createElement("div");
    spinner.className = "login-button-spinner";
    loginButton.appendChild(spinner);
  } else {
    loginButton.disabled = false;
    loginButtonLabel.textContent = "Unlock Admin";
    const spinner = loginButton.querySelector(".login-button-spinner");
    if (spinner) spinner.remove();
  }
}

// Helper: append activity log entry
function logActivity(message) {
  const li = document.createElement("li");
  li.textContent = `• ${message}`;
  adminActivityList.prepend(li);
}

// Handle login submit
loginForm.addEventListener("submit", (e) => {
  e.preventDefault();
  if (isLoggingIn) return;

  const username = document.getElementById("admin-username").value.trim();
  const password = document.getElementById("admin-password").value.trim();

  loginError.textContent = "";
  setLoginLoading(true);

  // Simulate async validation
  setTimeout(() => {
    const valid =
      username === ADMIN_USERNAME &&
      password === ADMIN_PASSWORD;

    if (!valid) {
      setLoginLoading(false);
      loginError.textContent = "Invalid credentials. Access denied.";
      logActivity("Failed login attempt (invalid credentials).");
      return;
    }

    // Successful login: start slide-out animation
    logActivity("Admin successfully logged in.");
    startLoginTransition();
  }, 650);
});

// Start login slide-left + parallax + delayed admin reveal
function startLoginTransition() {
  // Add class to slide login left and move background
  appShell.classList.add("app-shell--login-exiting");

  // After slide completes, show admin panel
  // Match CSS timing: 0.55s slide, then 0.45s fade/scale
  setTimeout(() => {
    appShell.classList.add("app-shell--admin-entering");
    adminShell.classList.add("admin-shell--visible");
    setLoginLoading(false);
  }, 560); // slightly more than 0.55s to ensure login is fully gone
}

// Simple nav section metadata
const sectionConfig = {
  dashboard: {
    mainTitle: "Dashboard",
    mainSubtitle: "Overview of activity, performance, and system health",
    primaryTitle: "Live Overview",
    primarySubtitle: "Key metrics for your unblocked games site",
    primaryBadge: "Live",
    secondaryTitle: "Recent Activity",
    secondarySubtitle: "Latest admin actions and security events",
  },
  games: {
    mainTitle: "Games & Categories",
    mainSubtitle: "Manage game list, categories, and visibility",
    primaryTitle: "Game Library",
    primarySubtitle: "Overview of all registered games",
    primaryBadge: "Manage",
    secondaryTitle: "Category Overview",
    secondarySubtitle: "Distribution of games across categories",
  },
  users: {
    mainTitle: "Users & Sessions",
    mainSubtitle: "Monitor active sessions and user behavior",
    primaryTitle: "Active Sessions",
    primarySubtitle: "Live view of connected users",
    primaryBadge: "Live",
    secondaryTitle: "User Insights",
    secondarySubtitle: "Session history and engagement patterns",
  },
  analytics: {
    mainTitle: "Analytics",
    mainSubtitle: "Traffic, performance, and engagement metrics",
    primaryTitle: "Traffic Overview",
    primarySubtitle: "Requests, latency, and load distribution",
    primaryBadge: "Insights",
    secondaryTitle: "Engagement",
    secondarySubtitle: "Playtime, favorites, and retention",
  },
  logs: {
    mainTitle: "Security Logs",
    mainSubtitle: "Authentication, errors, and system events",
    primaryTitle: "Auth Events",
    primarySubtitle: "Login attempts and access changes",
    primaryBadge: "Audit",
    secondaryTitle: "System Logs",
    secondarySubtitle: "Errors, warnings, and system notices",
  },
  settings: {
    mainTitle: "Settings",
    mainSubtitle: "System configuration and admin tools",
    primaryTitle: "Core Settings",
    primarySubtitle: "Branding, theme, and feature toggles",
    primaryBadge: "Config",
    secondaryTitle: "Advanced Tools",
    secondarySubtitle: "Backups, exports, and maintenance",
  },
};

// Handle nav clicks
adminNav.addEventListener("click", (e) => {
  const item = e.target.closest(".admin-nav-item");
  if (!item) return;

  const section = item.getAttribute("data-section");
  if (!section || !sectionConfig[section]) return;

  // Update active nav item
  [...adminNav.querySelectorAll(".admin-nav-item")].forEach((el) =>
    el.classList.toggle("admin-nav-item--active", el === item)
  );

  // Update titles and subtitles
  const cfg = sectionConfig[section];
  adminMainTitle.textContent = cfg.mainTitle;
  adminMainSubtitle.textContent = cfg.mainSubtitle;
  adminPrimaryTitle.textContent = cfg.primaryTitle;
  adminPrimarySubtitle.textContent = cfg.primarySubtitle;
  adminPrimaryBadge.textContent = cfg.primaryBadge;
  adminSecondaryTitle.textContent = cfg.secondaryTitle;
  adminSecondarySubtitle.textContent = cfg.secondarySubtitle;

  logActivity(`Switched to section: ${cfg.mainTitle}.`);
});

// Simple theme toggle (dark / alt)
themeToggle.addEventListener("click", () => {
  if (theme === "dark") {
    document.documentElement.style.setProperty("--bg-color", "#f4f6ff");
    document.documentElement.style.setProperty("--bg-accent", "#dde3ff");
    document.documentElement.style.setProperty("--card-bg", "#ffffff");
    document.documentElement.style.setProperty("--card-border", "#d0d6f0");
    document.documentElement.style.setProperty("--text-main", "#050814");
    document.documentElement.style.setProperty("--text-muted", "#5a6285");
    theme = "light";
    themeToggle.textContent = "Theme";
    logActivity("Switched theme to light.");
  } else {
    document.documentElement.style.setProperty("--bg-color", "#050814");
    document.documentElement.style.setProperty("--bg-accent", "#0b1024");
    document.documentElement.style.setProperty("--card-bg", "#111729");
    document.documentElement.style.setProperty("--card-border", "#1f2940");
    document.documentElement.style.setProperty("--text-main", "#f5f7ff");
    document.documentElement.style.setProperty("--text-muted", "#9aa3c7");
    theme = "dark";
    themeToggle.textContent = "Theme";
    logActivity("Switched theme to dark.");
  }
});

// Example: fake metrics update (you can wire real data here)
function updateFakeMetrics() {
  const activeSessions = document.getElementById("metricActiveSessions");
  const gamesLoaded = document.getElementById("metricGamesLoaded");
  const errors = document.getElementById("metricErrors");

  if (!activeSessions || !gamesLoaded || !errors) return;

  activeSessions.textContent = Math.floor(Math.random() * 42);
  gamesLoaded.textContent = 120; // replace with real count
  errors.textContent = Math.floor(Math.random() * 5);
}

// Periodic fake metrics refresh
setInterval(updateFakeMetrics, 5000);
updateFakeMetrics();
