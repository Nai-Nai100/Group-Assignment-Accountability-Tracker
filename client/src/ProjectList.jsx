import { useEffect, useRef, useState } from 'react';

import { ROLE_LABELS } from './Dashboard.jsx';

// Frame A2: every project the user is on, with the role held on each (US-14, D4), plus joining by code (B2, B4).
// Each project name opens its team dashboard. `notice` is announced on arrival, e.g. after a D7 join.
export default function ProjectList({ token, onSignOut, onCreate, onChanged, userName, notice = '' }) {
  const [projects, setProjects] = useState(null);
  const [error, setError] = useState('');
  const [reload, setReload] = useState(0);
  const [code, setCode] = useState('');
  const [joinError, setJoinError] = useState('');
  const [joined, setJoined] = useState('');
  const [joining, setJoining] = useState(false);
  const headingRef = useRef(null);

  // Move focus here after sign-in, so it doesn't fall back to <body>.
  useEffect(() => headingRef.current.focus(), []);
  // Set after mount so the status region already exists and screen readers announce the change.
  useEffect(() => setJoined(notice), [notice]);

  useEffect(() => {
    fetch('/api/projects', { headers: { Authorization: `Bearer ${token}` } })
      .then(async (res) => {
        if (res.status === 401) return onSignOut();
        if (!res.ok) throw new Error();
        setProjects((await res.json()).projects);
      })
      .catch(() => setError('Could not load your projects.'));
  }, [token, onSignOut, reload]);

  async function joinByCode(e) {
    e.preventDefault();
    setJoinError('');
    setJoined('');
    setJoining(true);
    try {
      const res = await fetch('/api/projects/join', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ code }),
      });
      if (res.status === 401) return onSignOut();
      const data = await res.json();
      if (!res.ok) return setJoinError(data.error || 'Could not join the project.');
      setCode('');
      setJoined(`You've joined ${data.project.name} as a team member.`);
      setReload((n) => n + 1);
      onChanged?.();
    } catch {
      setJoinError('Could not reach the server. Try again.');
    } finally {
      setJoining(false);
    }
  }

  return (
    <main className="page">
      {userName && <div className="eyebrow">Signed in as {userName}</div>}
      <h1 ref={headingRef} tabIndex={-1}>
        Your projects
      </h1>
      <p className="note">
        You can be on several project teams at once. Your role — team lead or team member — is set separately for
        each project.
      </p>
      <p role="status" className="note">
        {joined}
      </p>
      {error && (
        <p role="alert" className="error">
          Error: {error}
        </p>
      )}
      {projects === null && !error && <p role="status">Loading your projects…</p>}
      {projects?.length === 0 && <p>You are not in any projects yet. Join with a code, or create a project.</p>}
      {projects && (
        <ul className="project-grid">
          {projects.map((p) => (
            <li key={p.id}>
              <article className="card project-card" aria-labelledby={`project-${p.id}`}>
                <div className="card-top">
                  <span className="course">{p.course}</span>
                  <span className={`chip ${p.role}`}>{ROLE_LABELS[p.role]}</span>
                </div>
                <h2 id={`project-${p.id}`}>{p.name}</h2>
                <a className="button" href={`#/projects/${p.id}`} aria-label={`Open project: ${p.name}`}>
                  Open project
                </a>
              </article>
            </li>
          ))}
          <li>
            <button
              type="button"
              className="new-project"
              onClick={onCreate}
              aria-label="+ Create a new project"
              aria-describedby="new-project-hint"
            >
              <span className="big">+ Create a new project</span>
              <span id="new-project-hint" className="note">
                You&apos;ll be its team lead and can invite your team.
              </span>
            </button>
          </li>
        </ul>
      )}
      <form className="card join-form" onSubmit={joinByCode}>
        <div className="field">
          <label htmlFor="b2-code">Join a project with a code</label>
          <input
            id="b2-code"
            required
            inputMode="numeric"
            autoComplete="off"
            pattern="\d{6}"
            title="6 digits, for example 123456"
            maxLength={6}
            placeholder="000000"
            className="code-input"
            aria-describedby="b2-code-hint"
            value={code}
            onChange={(e) => setCode(e.target.value)}
          />
          <span id="b2-code-hint" className="hint">
            The 6-digit code your team lead shared with you.
          </span>
        </div>
        {joinError && (
          <p role="alert" className="error">
            Error: {joinError}
          </p>
        )}
        <div>
          <button type="submit" disabled={joining}>
            {joining ? 'Joining…' : 'Join'}
          </button>
        </div>
      </form>
    </main>
  );
}
