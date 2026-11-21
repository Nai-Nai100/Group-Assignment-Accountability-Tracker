import { useEffect, useRef, useState } from 'react';

const ROLE_LABELS = { lead: 'Team lead', member: 'Team member' };

// Minimal landing page after sign-in (US-01). The full project list is built in TMP-07.
export default function ProjectList({ token, onSignOut }) {
  const [projects, setProjects] = useState(null);
  const [error, setError] = useState('');
  const headingRef = useRef(null);

  // Move focus here after sign-in, so it doesn't fall back to <body>.
  useEffect(() => headingRef.current.focus(), []);

  useEffect(() => {
    fetch('/api/projects', { headers: { Authorization: `Bearer ${token}` } })
      .then(async (res) => {
        if (res.status === 401) return onSignOut();
        if (!res.ok) throw new Error();
        setProjects((await res.json()).projects);
      })
      .catch(() => setError('Could not load your projects.'));
  }, [token, onSignOut]);

  return (
    <main>
      <h1 ref={headingRef} tabIndex={-1}>
        Your projects
      </h1>
      {error && (
        <p role="alert" className="error">
          Error: {error}
        </p>
      )}
      {projects === null && !error && <p role="status">Loading your projects…</p>}
      {projects?.length === 0 && <p>You are not in any projects yet.</p>}
      {projects?.length > 0 && (
        <ul>
          {projects.map((p) => (
            <li key={p.id}>
              {p.name} — {ROLE_LABELS[p.role]}
            </li>
          ))}
        </ul>
      )}
      <button type="button" onClick={onSignOut}>
        Sign out
      </button>
    </main>
  );
}
