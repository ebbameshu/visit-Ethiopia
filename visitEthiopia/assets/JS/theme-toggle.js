const themeToggle = document.querySelector(".theme-toggle");
const themeIcon = themeToggle?.querySelector("i");
const themeStorageKey = "visit-ethiopia-theme";
const systemTheme = window.matchMedia("(prefers-color-scheme: dark)");
const savedTheme = localStorage.getItem(themeStorageKey);

function applyTheme(theme) {
  const isDark = theme === "dark";
  document.documentElement.dataset.theme = theme;
  themeToggle?.setAttribute("aria-pressed", String(isDark));
  themeToggle?.setAttribute(
    "aria-label",
    isDark ? "Switch to light theme" : "Switch to dark theme",
  );
  themeIcon?.classList.toggle("fa-sun", isDark);
  themeIcon?.classList.toggle("fa-moon", !isDark);
}

const initialTheme =
  savedTheme === "light" || savedTheme === "dark"
    ? savedTheme
    : systemTheme.matches
      ? "dark"
      : "light";

applyTheme(initialTheme);

themeToggle?.addEventListener("click", () => {
  const nextTheme =
    document.documentElement.dataset.theme === "dark" ? "light" : "dark";
  localStorage.setItem(themeStorageKey, nextTheme);
  applyTheme(nextTheme);
});
