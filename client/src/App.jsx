import { useEffect, useState } from 'react';

// Placeholder page: confirms the client can reach the API over REST.
export default function App() {
  const [apiStatus, setApiStatus] = useState('checking');

  useEffect(() => {
    fetch('/api/health')
      .then((res) => setApiStatus(res.ok ? 'ok' : 'down'))
      .catch(() => setApiStatus('down'));
  }, []);

  const label = {
    checking: '… Checking API connection',
    ok: '✓ API connected',
    down: '✕ API not reachable',
  }[apiStatus];

  return (
    <main>
      <h1>Group Project Accountability Tracker</h1>
      <p role="status">{label}</p>
    </main>
  );
}
