import { useEffect, useRef, useState } from 'react';

const ROLE_LABELS = { lead: 'Team lead', member: 'Team member' };

// Landing page after sign-in (US-01), with joining by code (frames B2, B4). The full project list is built in TMP-07.
// `notice` is a message to announce on arrival, e.g. after joining from the signed-out D7 screen.
export default function ProjectList({ token, onSignOut, onCreate, onInvite, notice = '' }) {
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
    } catch {
      setJoinError('Could not reach the server. Try again.');
    } finally {
      setJoining(false);
    }
  }

  return (
    <main>
      <h1 ref={headingRef} tabIndex={-1}>
        Your projects
      </h1>
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
      {projects?.length > 0 && (
        <ul>
          {projects.map((p) => (
            <li key={p.id}>
              {p.name} — {ROLE_LABELS[p.role]}{' '}
              {p.role === 'lead' && (
                <button type="button" className="secondary" onClick={() => onInvite(p)} aria-label={`Invite team members to ${p.name}`}>
                  Invite team members
                </button>
              )}
            </li>
          ))}
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
      <div className="actions">
        <button type="button" onClick={onCreate}>
          Create a project
        </button>
        <button type="button" className="secondary" onClick={onSignOut}>
          Sign out
        </button>
      </div>
    </main>
  );
}
