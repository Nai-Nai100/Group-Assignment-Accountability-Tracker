import { useState } from 'react';
import { currentTheme, saveTheme } from './theme.js';

function ThemeToggle() {
  const [theme, setTheme] = useState(currentTheme);
  const next = theme === 'dark' ? 'light' : 'dark';
  return (
    <button
      type="button"
      className="secondary"
      onClick={() => {
        saveTheme(next);
        setTheme(next);
      }}
    >
      <span aria-hidden="true">{next === 'dark' ? '☾ ' : '☀ '}</span>
      <span className="sr-only">Switch to </span>
      {next === 'dark' ? 'Dark mode' : 'Light mode'}
    </button>
  );
}

// The signed-in app frame (prototype top bar): app name and current title, All projects, theme toggle,
// the user's name (with their role on the current project), Sign out. `sidebar` is shown inside a project.
export default function Shell({ title, userName, roleLabel, projectCount, onSignOut, sidebar, children }) {
  return (
    <>
      <header className="topbar">
        <div className="topbar-title">
          <span className="eyebrow">Group Project Accountability Tracker</span>
          <span className="title">{title}</span>
        </div>
        <div className="topbar-actions">
          <a className="button secondary" href="#/">
            All projects{projectCount != null && ` · ${projectCount}`}
          </a>
          <ThemeToggle />
          <div className="topbar-user">
            {userName && (
              <div className="who">
                <span className="name">{userName}</span>
                {roleLabel && <span className="role">{roleLabel}</span>}
              </div>
            )}
            <button type="button" className="secondary" onClick={onSignOut}>
              Sign out
            </button>
          </div>
        </div>
      </header>
      <div className="app-body">
        {sidebar}
        {children}
      </div>
    </>
  );
}
