import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import App from './App.jsx';

const json = (status, body) => Promise.resolve({ ok: status >= 200 && status < 300, status, json: async () => body });

const PROJECTS = { projects: [{ id: '1', name: 'Transit study', role: 'lead' }, { id: '2', name: 'Bridge report', role: 'member' }] };
const CREATED = { project: { id: '9', name: 'Policy brief', course: 'ENV 215', role: 'lead', joinCode: '482913' } };

// Routes fetch by URL + method; each test overrides what it needs.
function stubApi(overrides = {}) {
  const routes = {
    'GET /api/projects': () => json(200, PROJECTS),
    'POST /api/projects': () => json(201, CREATED),
    'GET /api/projects/9/join-code': () => json(200, { joinCode: '482913' }),
    'GET /api/projects/1/join-code': () => json(200, { joinCode: '123456' }),
    ...overrides,
  };
  const fetchMock = vi.fn((url, opts = {}) => routes[`${opts.method || 'GET'} ${url}`]());
  vi.stubGlobal('fetch', fetchMock);
  return fetchMock;
}

async function openCreate() {
  render(<App />);
  await screen.findByText(/Transit study/);
  fireEvent.click(screen.getByRole('button', { name: 'Create a project' }));
}

function submitCreate(name = 'Policy brief', course = 'ENV 215') {
  fireEvent.change(screen.getByLabelText('Project name'), { target: { value: name } });
  fireEvent.change(screen.getByLabelText('Course (optional)'), { target: { value: course } });
  fireEvent.click(screen.getByRole('button', { name: 'Create project' }));
}

async function expectSignIn() {
  expect(await screen.findByRole('button', { name: 'Sign in' })).toBeInTheDocument();
  expect(sessionStorage.getItem('token')).toBeNull();
}

beforeEach(() => {
  sessionStorage.clear();
  sessionStorage.setItem('token', 'tok123');
});
afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  sessionStorage.clear();
});

describe('create project (A3)', () => {
  test('"Create a project" opens A3 with labeled inputs', async () => {
    stubApi();
    await openCreate();
    expect(screen.getByRole('heading', { name: 'Create a project' })).toBeInTheDocument();
    expect(screen.getByLabelText('Project name')).toBeRequired();
    expect(screen.getByLabelText('Course (optional)')).not.toBeRequired();
  });

  test('submitting POSTs with a Bearer token and then shows A4 with the code and name', async () => {
    const fetchMock = stubApi();
    await openCreate();
    submitCreate();

    expect(await screen.findByRole('heading', { name: 'Invite team members' })).toBeInTheDocument();
    expect(await screen.findByText('482913')).toBeInTheDocument();
    expect(screen.getByText(/join Policy brief/)).toBeInTheDocument();

    const [, opts] = fetchMock.mock.calls.find(([url, o]) => url === '/api/projects' && o?.method === 'POST');
    expect(opts.headers.Authorization).toBe('Bearer tok123');
    expect(JSON.parse(opts.body)).toEqual({ name: 'Policy brief', course: 'ENV 215' });
  });

  test('a server error shows in an alert and stays on A3', async () => {
    stubApi({ 'POST /api/projects': () => json(400, { error: 'Enter a project name of up to 100 characters.' }) });
    await openCreate();
    submitCreate('x');
    expect(await screen.findByRole('alert')).toHaveTextContent('Enter a project name of up to 100 characters.');
    expect(screen.getByRole('heading', { name: 'Create a project' })).toBeInTheDocument();
  });

  test('Cancel returns to the project list', async () => {
    stubApi();
    await openCreate();
    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(await screen.findByRole('heading', { name: 'Your projects' })).toBeInTheDocument();
  });

  test('401 on create returns to sign-in', async () => {
    stubApi({ 'POST /api/projects': () => json(401, { error: 'Sign in required.' }) });
    await openCreate();
    submitCreate();
    await expectSignIn();
  });
});

describe('project list', () => {
  test('a lead row shows "Invite team members"; a member row does not', async () => {
    stubApi();
    render(<App />);
    await screen.findByText(/Transit study/);
    expect(screen.getByRole('button', { name: 'Invite team members to Transit study' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Bridge report/ })).toBeNull();
    expect(screen.getAllByRole('button', { name: /Invite team members/ })).toHaveLength(1);
  });
});

describe('invite (A4)', () => {
  async function openInvite() {
    render(<App />);
    await screen.findByText(/Transit study/);
    fireEvent.click(screen.getByRole('button', { name: 'Invite team members to Transit study' }));
  }

  test('loads the code from the join-code endpoint with a Bearer token', async () => {
    const fetchMock = stubApi();
    await openInvite();
    expect(await screen.findByText('123456')).toBeInTheDocument();
    const call = fetchMock.mock.calls.find(([url]) => url === '/api/projects/1/join-code');
    expect(call[1].headers.Authorization).toBe('Bearer tok123');
  });

  test('403 shows an alert and no code', async () => {
    stubApi({ 'GET /api/projects/1/join-code': () => json(403, { error: 'Only the team lead can do this.' }) });
    await openInvite();
    expect(await screen.findByRole('alert')).toHaveTextContent('Only the team lead can see the join code.');
    expect(screen.queryByRole('button', { name: 'Copy code' })).toBeNull();
  });

  test('Copy code writes to the clipboard and announces it in a status region', async () => {
    stubApi();
    const writeText = vi.fn(() => Promise.resolve());
    vi.stubGlobal('navigator', { ...navigator, clipboard: { writeText } });
    await openInvite();
    fireEvent.click(await screen.findByRole('button', { name: 'Copy code' }));
    await waitFor(() => expect(writeText).toHaveBeenCalledWith('123456'));
    const status = await screen.findByText('Join code copied.');
    expect(status).toHaveAttribute('role', 'status');
  });

  test('401 on the join code returns to sign-in', async () => {
    stubApi({ 'GET /api/projects/1/join-code': () => json(401, { error: 'Sign in required.' }) });
    await openInvite();
    await expectSignIn();
  });
});
