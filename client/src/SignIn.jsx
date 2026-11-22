import { useEffect, useRef, useState } from 'react';

// Frames A1/B1. Email and password only; there is no public sign-up (RC-01).
export default function SignIn({ onSignedIn, onJoin }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const headingRef = useRef(null);

  // Move focus here when the view appears (e.g. after sign-out), so it doesn't fall back to <body>.
  useEffect(() => headingRef.current.focus(), []);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      const res = await fetch('/api/auth/signin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Sign in failed.');
        return;
      }
      onSignedIn(data.token, data.user);
    } catch {
      setError('Could not reach the server. Try again.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="signin">
      <div className="signin-inner">
        <div className="eyebrow">Group Project</div>
        <h1 ref={headingRef} tabIndex={-1}>
          Accountability Tracker
        </h1>
        <form className="card" onSubmit={handleSubmit}>
          <h2>Sign in</h2>
          <label>
            Email
            <input
              type="email"
              name="email"
              autoComplete="username"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </label>
          <label>
            Password
            <input
              type="password"
              name="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </label>
          {error && (
            <p role="alert" className="error">
              Error: {error}
            </p>
          )}
          <button type="submit" disabled={busy}>
            {busy ? 'Signing in…' : 'Sign in'}
          </button>
          <p className="note">There is no public sign-up. Team members join with a code from their team lead.</p>
        </form>
        <button type="button" className="secondary link-button" onClick={onJoin}>
          Have a join code? Join your team <span aria-hidden="true">→</span>
        </button>
      </div>
    </main>
  );
}
