import { useEffect, useRef, useState } from 'react';
import Refused from './Refused.jsx';

// Frame A4. Only the project's team lead can see the join code (DD-08). Nothing of the screen is shown
// until the server answers; a 403 shows the D6 refusal instead (RC-02).
export default function Invite({ token, project, onSignOut }) {
  const [code, setCode] = useState(null);
  const [refused, setRefused] = useState(false);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState('');
  const headingRef = useRef(null);

  const loaded = Boolean(code || error);
  useEffect(() => {
    if (loaded) headingRef.current.focus();
  }, [loaded]);

  useEffect(() => {
    fetch(`/api/projects/${project.id}/join-code`, { headers: { Authorization: `Bearer ${token}` } })
      .then(async (res) => {
        if (res.status === 401) return onSignOut();
        if (res.status === 403) return setRefused(true);
        if (!res.ok) throw new Error('Could not load the join code.');
        const { joinCode } = await res.json();
        if (!joinCode) throw new Error('This project has no join code.');
        setCode(joinCode);
      })
      .catch((err) => setError(err.message));
  }, [token, project.id, onSignOut]);

  // Alternating a trailing no-break space changes the text, so a repeat press is announced again.
  const announce = (msg) => setCopied((prev) => (prev === msg ? `${msg} ` : msg));

  async function copyCode() {
    try {
      await navigator.clipboard.writeText(code);
      announce('Join code copied.');
    } catch {
      announce('Could not copy. Select the code and copy it yourself.');
    }
  }

  if (refused) return <Refused title="Invite team members" project={project} />;
  if (!loaded) {
    return (
      <main className="page">
        <p role="status">Loading…</p>
      </main>
    );
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
      {code && (
        <div className="card code-card">
          <div>
            <div className="eyebrow">Team join code</div>
            <p className="join-code">
              <span aria-hidden="true">{code}</span>
              {/* Spaced so screen readers say each digit instead of one large number. */}
              <span className="sr-only">{code.split('').join(' ')}</span>
            </p>
          </div>
          <button type="button" className="secondary" onClick={copyCode}>
            Copy code
          </button>
        </div>
      )}
      <p role="status" className="note">
        {copied}
      </p>
      <p>
        <a href={`#/projects/${project.id}`}>Back to the team dashboard</a>
      </p>
    </main>
  );
}
