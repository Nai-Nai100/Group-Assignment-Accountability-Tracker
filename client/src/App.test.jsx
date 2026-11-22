import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import App from './App.jsx';

const json = (status, body) => Promise.resolve({ ok: status >= 200 && status < 300, status, json: async () => body });

const PROJECTS = { projects: [{ id: '1', name: 'Transit study', role: 'lead' }, { id: '2', name: 'Bridge report', role: 'member' }] };

function fillAndSubmit() {
  fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'priya@university.edu' } });
  fireEvent.change(screen.getByLabelText('Password'), { target: { value: 'secret-pass' } });
  fireEvent.click(screen.getByRole('button', { name: 'Sign in' }));
}

// The A2 card's text: course, role chip and project name.
const cardText = (name) => screen.getByRole('article', { name }).textContent;

beforeEach(() => {
  sessionStorage.clear();
  window.location.hash = '';
});
afterEach(() => {
  cleanup();
  window.location.hash = '';
  vi.unstubAllGlobals();
  sessionStorage.clear();
});

describe('sign-in screen', () => {
  test('has labeled Email and Password inputs and a Sign in button', () => {
    render(<App />);
    expect(screen.getByLabelText('Email')).toHaveAttribute('type', 'email');
    expect(screen.getByLabelText('Password')).toHaveAttribute('type', 'password');
    expect(screen.getByRole('button', { name: 'Sign in' })).toBeInTheDocument();
  });

  test('successful sign-in stores the token and shows projects with role labels', async () => {
    const fetchMock = vi.fn((url) => (url === '/api/auth/signin' ? json(200, { token: 'tok123', user: {} }) : json(200, PROJECTS)));
    vi.stubGlobal('fetch', fetchMock);
    render(<App />);
    fillAndSubmit();

    expect(await screen.findByRole('heading', { name: 'Your projects' })).toBeInTheDocument();
    await screen.findByRole('link', { name: 'Open project: Transit study' });
    expect(cardText('Transit study')).toContain('Team lead');
    expect(cardText('Bridge report')).toContain('Team member');
    expect(sessionStorage.getItem('token')).toBe('tok123');

    const [url, opts] = fetchMock.mock.calls[0];
    expect(url).toBe('/api/auth/signin');
    expect(opts.method).toBe('POST');
    expect(JSON.parse(opts.body)).toEqual({ email: 'priya@university.edu', password: 'secret-pass' });
    const list = fetchMock.mock.calls.find(([u]) => u === '/api/projects');
    expect(list[1].headers.Authorization).toBe('Bearer tok123');
  });

  test('401 shows the server error in an alert', async () => {
    vi.stubGlobal('fetch', vi.fn(() => json(401, { error: 'Email or password is incorrect.' })));
    render(<App />);
    fillAndSubmit();
    expect(await screen.findByRole('alert')).toHaveTextContent('Email or password is incorrect.');
    expect(sessionStorage.getItem('token')).toBeNull();
  });

  test('network failure shows an error alert', async () => {
    vi.stubGlobal('fetch', vi.fn(() => Promise.reject(new TypeError('Failed to fetch'))));
    render(<App />);
    fillAndSubmit();
    expect(await screen.findByRole('alert')).toHaveTextContent(/could not reach the server/i);
  });

  test('shows no sign-up link or button', () => {
    render(<App />);
    expect(screen.queryByRole('link', { name: /sign.?up|register|create account/i })).toBeNull();
    expect(screen.queryByRole('button', { name: /sign.?up|register|create account/i })).toBeNull();
    // The only other way in is joining with a code from a team lead (RC-01, frame D7).
    expect(screen.getAllByRole('button').map((b) => b.textContent)).toEqual(['Sign in', 'Have a join code? Join your team →']);
  });
});

describe('signed in', () => {
  test('projects request returning 401 returns to sign-in and clears the token', async () => {
    sessionStorage.setItem('token', 'expired');
    vi.stubGlobal('fetch', vi.fn(() => json(401, { error: 'Sign in required.' })));
    render(<App />);
    expect(await screen.findByRole('button', { name: 'Sign in' })).toBeInTheDocument();
    expect(sessionStorage.getItem('token')).toBeNull();
  });

  test('Sign out returns to the sign-in screen', async () => {
    sessionStorage.setItem('token', 'tok123');
    vi.stubGlobal('fetch', vi.fn(() => json(200, PROJECTS)));
    render(<App />);
    await screen.findByRole('link', { name: 'Open project: Transit study' });
    fireEvent.click(screen.getByRole('button', { name: 'Sign out' }));
    expect(await screen.findByRole('button', { name: 'Sign in' })).toBeInTheDocument();
    expect(sessionStorage.getItem('token')).toBeNull();
  });
});
