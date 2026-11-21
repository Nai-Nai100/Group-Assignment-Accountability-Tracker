import { useEffect, useRef, useState } from 'react';

// Frame D7: join a project with a code while signed out. Creates the account if the email is new;
// an existing account must give its own password (RC-01, US-15). There is no other way to sign up.
export default function JoinTeam({ onJoined, onBack }) {
  const [form, setForm] = useState({ code: '', name: '', email: '', password: '' });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const headingRef = useRef(null);

  useEffect(() => headingRef.current.focus(), []);

  const set = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }));

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      const res = await fetch('/api/auth/join', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) return setError(data.error || 'Could not join the team.');
      onJoined(data.token, `You've joined ${data.project.name} as a team member.`);
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
          <h2>Join your team</h2>
          <p className="note">Enter the 6-digit join code your team lead shared with you.</p>
          <label>
            Join code
            <input
              required
              inputMode="numeric"
              autoComplete="one-time-code"
              pattern="\d{6}"
              maxLength={6}
              placeholder="000000"
              className="code-input"
              value={form.code}
              onChange={set('code')}
            />
          </label>
          <label>
            Full name
            <input required maxLength={100} autoComplete="name" value={form.name} onChange={set('name')} />
          </label>
          <label>
            University email
            <input
              required
              type="email"
              autoComplete="email"
              placeholder="name@uni.edu"
              aria-describedby="join-email-hint"
              value={form.email}
              onChange={set('email')}
            />
            <span id="join-email-hint" className="hint">
              You&apos;ll use this to sign in next time.
            </span>
          </label>
          <label>
            Password
            <input
              required
              type="password"
              autoComplete="new-password"
              maxLength={72}
              aria-describedby="join-password-hint"
              value={form.password}
              onChange={set('password')}
            />
            <span id="join-password-hint" className="hint">
              New here? Choose a password of at least 8 characters. Already have an account? Enter your password.
            </span>
          </label>
          {error && (
            <p role="alert" className="error">
              Error: {error}
            </p>
          )}
          <button type="submit" disabled={busy}>
            {busy ? 'Joining…' : 'Join team'}
          </button>
        </form>
        <button type="button" className="secondary link-button" onClick={onBack}>
          Already have an account? Sign in
        </button>
      </div>
    </main>
  );
}
