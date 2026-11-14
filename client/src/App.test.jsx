import { cleanup, render, screen, waitFor } from '@testing-library/react';
import { afterEach, expect, test, vi } from 'vitest';
import App from './App';

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

// The status element renders immediately ("Checking..."), so wait for the text to change.
const expectStatus = (text) =>
  waitFor(() => expect(screen.getByRole('status')).toHaveTextContent(text));

test('shows API connected when health check is ok', async () => {
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true }));
  render(<App />);
  await expectStatus('API connected');
});

test('shows API not reachable on non-ok response', async () => {
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false }));
  render(<App />);
  await expectStatus('API not reachable');
});

test('shows API not reachable when fetch rejects', async () => {
  vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('network')));
  render(<App />);
  await expectStatus('API not reachable');
});
