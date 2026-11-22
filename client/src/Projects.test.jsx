import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import App from './App.jsx';

const json = (status, body) => Promise.resolve({ ok: status >= 200 && status < 300, status, json: async () => body });

const PROJECTS = {
  projects: [
    { id: '1', name: 'Transit study', course: 'ENV 215', role: 'lead' },
    { id: '2', name: 'Bridge report', role: 'member' },
  ],
};
const team = (id, name, role, lead) => ({
  project: { id, name, role, lead: { name: lead }, members: [{ id: 'u1', name: lead, role: 'lead' }] },
});
const CREATED = { project: { id: '9', name: 'Policy brief', course: 'ENV 215', role: 'lead', joinCode: '482913' } };

// Routes fetch by URL + method; each test overrides what it needs.
function stubApi(overrides = {}) {
  const routes = {
    'GET /api/projects': () => json(200, PROJECTS),
    'POST /api/projects': () => json(201, CREATED),
    'GET /api/projects/9': () => json(200, team('9', 'Policy brief', 'lead', 'Priya Shah')),
    'GET /api/projects/1': () => json(200, team('1', 'Transit study', 'lead', 'Priya Shah')),
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
  await screen.findByRole('link', { name: 'Transit study' });
  fireEvent.click(screen.getByRole('button', { name: 'Create a project' }));
  await screen.findByRole('heading', { name: 'Create a project' });
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
  window.location.hash = '';
});
afterEach(() => {
  cleanup();
  window.location.hash = '';
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
  test('each row links to its dashboard with the role and course; invite lives on the dashboard, not the list', async () => {
    stubApi();
    render(<App />);
    const lead = await screen.findByRole('link', { name: 'Transit study' });
    const member = screen.getByRole('link', { name: 'Bridge report' });
    expect(lead).toHaveAttribute('href', '#/projects/1');
    expect(member).toHaveAttribute('href', '#/projects/2');
    expect(lead.closest('li')).toHaveTextContent('Transit study — Team leadENV 215');
    expect(member.closest('li')).toHaveTextContent('Bridge report — Team member');
    expect(screen.queryByRole('button', { name: /Invite team members/ })).toBeNull();
  });
});

describe('invite (A4)', () => {
  // Lead-only address A4; the dashboard link to it is covered in Dashboard.test.jsx.
  async function openInvite() {
    window.location.hash = '#/projects/1/invite';
    render(<App />);
  }

  test('loads the code from the join-code endpoint with a Bearer token', async () => {
    const fetchMock = stubApi();
    await openInvite();
    expect(await screen.findByText('123456')).toBeInTheDocument();
    const call = fetchMock.mock.calls.find(([url]) => url === '/api/projects/1/join-code');
    expect(call[1].headers.Authorization).toBe('Bearer tok123');
  });

  test('403 shows the D6 refusal and no code', async () => {
    stubApi({ 'GET /api/projects/1/join-code': () => json(403, { error: 'Only the team lead can do this.' }) });
    await openInvite();
    expect(await screen.findByText(/Only the team lead can open this page\./)).toBeInTheDocument();
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
