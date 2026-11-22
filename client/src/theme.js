// Light/dark theme (Issue #56). Follows the system setting until the user picks one with the toggle;
// the choice is a per-browser convenience kept in localStorage, and the page works without it.
const KEY = 'theme';

export function savedTheme() {
  try {
    const t = localStorage.getItem(KEY);
    return t === 'light' || t === 'dark' ? t : null;
  } catch {
    return null;
  }
}

export function currentTheme() {
  return savedTheme() || (window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
}

export function applyTheme(theme) {
  if (theme) document.documentElement.dataset.theme = theme;
  else delete document.documentElement.dataset.theme;
}

export function saveTheme(theme) {
  applyTheme(theme);
  try {
    localStorage.setItem(KEY, theme);
  } catch {
    // Storage unavailable: the choice lasts until the page is reloaded.
  }
}
