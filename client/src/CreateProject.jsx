import { useEffect, useRef, useState } from 'react';

// Frame A3. The creator becomes the project's team lead (DD-05).
export default function CreateProject({ token, onCreated, onCancel, onSignOut }) {
  const [name, setName] = useState('');
  const [course, setCourse] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const headingRef = useRef(null);

  useEffect(() => headingRef.current.focus(), []);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      const res = await fetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ name, course }),
      });
      if (res.status === 401) return onSignOut();
      const data = await res.json();
      if (!res.ok) return setError(data.error || 'Could not create the project.');
      onCreated(data.project);
    } catch {
      setError('Could not reach the server. Try again.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="page">
      <div className="eyebrow">New project</div>
      <h1 ref={headingRef} tabIndex={-1}>
        Create a project
      </h1>
      <p className="note">You&apos;ll become the team lead for this project. Next, you&apos;ll invite your team members.</p>
      <form className="card narrow" onSubmit={handleSubmit}>
        <label>
          Project name
          <input
            required
            maxLength={100}
            placeholder="e.g. Renewable Energy Policy Brief"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </label>
        <label>
          Course (optional)
          <input
            maxLength={100}
            placeholder="e.g. ENV 215 · Environmental Policy · Fall 2026"
            value={course}
            onChange={(e) => setCourse(e.target.value)}
          />
        </label>
        {error && (
          <p role="alert" className="error">
            Error: {error}
          </p>
        )}
        <div className="actions">
          <button type="submit" disabled={busy}>
            {busy ? 'Creating…' : 'Create project'}
          </button>
          <button type="button" className="secondary" onClick={onCancel}>
            Cancel
          </button>
        </div>
      </form>
    </main>
  );
}
