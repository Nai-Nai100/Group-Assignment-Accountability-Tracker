import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import App from './App.jsx';

const json = (status, body) => Promise.resolve({ ok: status >= 200 && status < 300, status, json: async () => body });

const PROJECTS = { projects: [{ id: '1', name: 'Transit study', role: 'lead' }] };
const AFTER_JOIN = { projects: [...PROJECTS.projects, { id: '3', name: 'Bridge report', role: 'member' }] };
const JOINED = { project: { id: '3', name: 'Bridge report', role: 'member' } };
const NOTICE = "You've joined Bridge report as a team member.";

// Routes fetch by URL + method; each test overrides what it needs.
function stubApi(overrides = {}) {
  const routes = {
    'GET /api/projects': () => json(200, PROJECTS),
    'POST /api/projects/join': () => json(201, JOINED),
    'POST /api/auth/join': () => json(201, { token: 'newtok', user: { id: 'u1', name: 'Lena' }, ...JOINED }),
    ...overrides,
  };
  const fetchMock = vi.fn((url, opts = {}) => routes[`${opts.method || 'GET'} ${url}`]());
  vi.stubGlobal('fetch', fetchMock);
  return fetchMock;
}

const callTo = (fetchMock, url, method) => fetchMock.mock.calls.find(([u, o]) => u === url && o?.method === method);

beforeEach(() => {
  window.location.hash = '';
});
afterEach(() => {
  cleanup();
  window.location.hash = '';
  vi.unstubAllGlobals();
  sessionStorage.clear();
});

describe('signed-out join (D7)', () => {
  const FORM = { code: '482913', name: 'Lena Park', email: 'lena@university.edu', password: 'New-Password-1' };

  beforeEach(() => sessionStorage.clear());

  async function openJoin() {
    render(<App />);
    fireEvent.click(screen.getByRole('button', { name: 'Have a join code? Join your team' }));
    await screen.findByRole('heading', { name: 'Join your team' });
  }

  function submitJoin() {
    fireEvent.change(screen.getByLabelText('Join code'), { target: { value: FORM.code } });
    fireEvent.change(screen.getByLabelText('Full name'), { target: { value: FORM.name } });
    fireEvent.change(screen.getByLabelText(/^University email/), { target: { value: FORM.email } });
    fireEvent.change(screen.getByLabelText(/^Password/), { target: { value: FORM.password } });
    fireEvent.click(screen.getByRole('button', { name: 'Join team' }));
  }

  test('the sign-in link opens D7 with labeled, required inputs', async () => {
    await openJoin();
    expect(screen.getByRole('heading', { name: 'Join your team' })).toBeInTheDocument();
    expect(screen.getByLabelText('Join code')).toBeRequired();
    expect(screen.getByLabelText('Full name')).toBeRequired();
    expect(screen.getByLabelText(/^University email/)).toHaveAttribute('type', 'email');
    expect(screen.getByLabelText(/^Password/)).toHaveAttribute('type', 'password');
  });

  test('submitting posts without a token, signs in, and announces the join on the project list', async () => {
    const fetchMock = stubApi({ 'GET /api/projects': () => json(200, AFTER_JOIN) });
    await openJoin();
    submitJoin();

    expect(await screen.findByRole('heading', { name: 'Your projects' })).toBeInTheDocument();
    expect(sessionStorage.getItem('token')).toBe('newtok');
    await waitFor(() => expect(screen.getByText(NOTICE)).toHaveAttribute('role', 'status'));

    const [, opts] = callTo(fetchMock, '/api/auth/join', 'POST');
    expect(opts.headers.Authorization).toBeUndefined();
    expect(JSON.parse(opts.body)).toEqual(FORM);
    const list = fetchMock.mock.calls.find(([u, o]) => u === '/api/projects' && !o?.method);
    expect(list[1].headers.Authorization).toBe('Bearer newtok');
  });

  test('a server error shows in an alert and stays on D7', async () => {
    stubApi({ 'POST /api/auth/join': () => json(401, { error: 'Email or password is incorrect.' }) });
    await openJoin();
    submitJoin();
    expect(await screen.findByRole('alert')).toHaveTextContent('Email or password is incorrect.');
    expect(screen.getByRole('heading', { name: 'Join your team' })).toBeInTheDocument();
    expect(sessionStorage.getItem('token')).toBeNull();
  });

  test('"Already have an account? Sign in" returns to sign-in', async () => {
    await openJoin();
    fireEvent.click(screen.getByRole('button', { name: 'Already have an account? Sign in' }));
    expect(await screen.findByRole('heading', { name: 'Sign in' })).toBeInTheDocument();
  });
});

describe('join from the project list (B2, B4)', () => {
  beforeEach(() => {
    sessionStorage.clear();
    sessionStorage.setItem('token', 'tok123');
  });

  async function submitCode(code = '482913') {
    render(<App />);
    await screen.findByRole('link', { name: 'Open project: Transit study' });
    fireEvent.change(screen.getByLabelText('Join a project with a code'), { target: { value: code } });
    fireEvent.click(screen.getByRole('button', { name: 'Join' }));
  }

  test('posts {code} with a Bearer token, announces the join, and reloads the list', async () => {
    // The list returns the new project only once the join has been posted.
    let joined = false;
    const fetchMock = stubApi({
      'GET /api/projects': () => json(200, joined ? AFTER_JOIN : PROJECTS),
      'POST /api/projects/join': () => ((joined = true), json(201, JOINED)),
    });
    await submitCode();

    expect(await screen.findByText(NOTICE)).toHaveAttribute('role', 'status');
    await screen.findByRole('link', { name: 'Open project: Bridge report' });
    expect(screen.getByRole('article', { name: 'Bridge report' })).toHaveTextContent('Team member');

    const [, opts] = callTo(fetchMock, '/api/projects/join', 'POST');
    expect(opts.headers.Authorization).toBe('Bearer tok123');
    expect(JSON.parse(opts.body)).toEqual({ code: '482913' });
  });

  test('a wrong code shows an alert', async () => {
    const error = "That join code doesn't match a project. Check it with your team lead.";
    stubApi({ 'POST /api/projects/join': () => json(400, { error }) });
    await submitCode('999999');
    expect(await screen.findByRole('alert')).toHaveTextContent(error);
    expect(screen.queryByText(NOTICE)).toBeNull();
  });

  test('401 returns to sign-in', async () => {
    stubApi({ 'POST /api/projects/join': () => json(401, { error: 'Sign in required.' }) });
    await submitCode();
    expect(await screen.findByRole('button', { name: 'Sign in' })).toBeInTheDocument();
    expect(sessionStorage.getItem('token')).toBeNull();
  });
});
