import { useEffect, useRef, useState } from 'react';

// Frame A4. Only the project's team lead can see the join code (DD-08); the server enforces this.
export default function Invite({ token, project, onBack, onSignOut }) {
  const [code, setCode] = useState(null);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState('');
  const headingRef = useRef(null);

  useEffect(() => headingRef.current.focus(), []);

  useEffect(() => {
    fetch(`/api/projects/${project.id}/join-code`, { headers: { Authorization: `Bearer ${token}` } })
      .then(async (res) => {
        if (res.status === 401) return onSignOut();
        if (res.status === 403) throw new Error('Only the team lead can see the join code.');
        if (!res.ok) throw new Error('Could not load the join code.');
        setCode((await res.json()).joinCode);
      })
      .catch((err) => setError(err.message));
  }, [token, project.id, onSignOut]);

  async function copyCode() {
    try {
      await navigator.clipboard.writeText(code);
      setCopied('Join code copied.');
    } catch {
      setCopied('Could not copy. Select the code and copy it yourself.');
    }
  }

  return (
    <main className="page">
      <div className="eyebrow">Project setup · team lead</div>
      <h1 ref={headingRef} tabIndex={-1}>
        Invite team members
      </h1>
      <p className="note">
        There&apos;s no public sign-up — an invitation is the only way to join. Share the join code with your team;
        they enter it with their name and email to join {project.name}.
      </p>
      {error && (
        <p role="alert" className="error">
          Error: {error}
        </p>
      )}
      {code === null && !error && <p role="status">Loading the join code…</p>}
      {code && (
        <div className="card code-card">
          <div>
            <div className="eyebrow">Team join code</div>
            <p className="join-code">{code}</p>
          </div>
          <button type="button" className="secondary" onClick={copyCode}>
            Copy code
          </button>
        </div>
      )}
      <p role="status" className="note">
        {copied}
      </p>
      <button type="button" className="secondary" onClick={onBack}>
        Back to your projects
      </button>
    </main>
  );
}
