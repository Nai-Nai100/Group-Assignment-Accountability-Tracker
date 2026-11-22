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
const LEAD = {
  project: {
    id: '1',
    name: 'Transit study',
    course: 'ENV 215',
    role: 'lead',
    lead: { name: 'Priya Shah' },
    members: [
      { id: 'u1', name: 'Priya Shah', role: 'lead' },
      { id: 'u2', name: 'Lena Park', role: 'member' },
    ],
  },
};
const MEMBER = {
  project: {
    id: '2',
    name: 'Bridge report',
    role: 'member',
    lead: { name: 'Omar Haddad' },
    members: [
      { id: 'u3', name: 'Omar Haddad', role: 'lead' },
      { id: 'u1', name: 'Priya Shah', role: 'member' },
    ],
  },
};
const REFUSAL = 'Only the team lead can open this page. Omar Haddad is the team lead for this project.';
const A4_NOTE = /no public sign-up/;

function stubApi(overrides = {}) {
  const routes = {
    'GET /api/projects': () => json(200, PROJECTS),
    'GET /api/projects/1': () => json(200, LEAD),
    'GET /api/projects/2': () => json(200, MEMBER),
    'GET /api/projects/1/join-code': () => json(200, { joinCode: '123456' }),
    'GET /api/projects/2/join-code': () => json(403, { error: 'Only the team lead can do this.' }),
    ...overrides,
  };
  const fetchMock = vi.fn((url, opts = {}) => routes[`${opts.method || 'GET'} ${url}`]());
  vi.stubGlobal('fetch', fetchMock);
  return fetchMock;
}

function openAt(hash) {
  window.location.hash = hash;
  render(<App />);
}

const heading = (name) => screen.findByRole('heading', { level: 1, name });

beforeEach(() => {
  sessionStorage.clear();
  sessionStorage.setItem('token', 'tok123');
  window.location.hash = '';
});
afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  sessionStorage.clear();
  window.location.hash = '';
});

describe('team dashboard (A5 lead, B5 member)', () => {
  test('opening a project from the list shows its name, role text and team, and focuses the h1', async () => {
    stubApi();
    render(<App />);
    fireEvent.click(await screen.findByRole('link', { name: 'Open project: Transit study' }));

    const h1 = await heading('Transit study');
    expect(h1).toHaveFocus();
    expect(screen.getByText(/Your role on this project:/)).toHaveTextContent('Your role on this project: Team lead');
    const team = screen.getByRole('region', { name: 'Team' });
    expect([...team.querySelectorAll('li')].map((li) => li.textContent)).toEqual([
      'Priya Shah — Team lead',
      'Lena Park — Team member',
    ]);
  });

  test('the lead sees Project setup with "Invite team members"', async () => {
    stubApi();
    openAt('#/projects/1');
    await heading('Transit study');
    expect(screen.getByRole('heading', { name: 'Project setup' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Invite team members' })).toHaveAttribute('href', '#/projects/1/invite');
  });

  test('a member sees their role and the team but no Project setup', async () => {
    stubApi();
    openAt('#/projects/2');
    await heading('Bridge report');
    expect(screen.getByText(/Your role on this project:/)).toHaveTextContent('Team member');
    expect(screen.getByRole('region', { name: 'Team' })).toHaveTextContent('Omar Haddad — Team lead');
    expect(screen.queryByRole('heading', { name: 'Project setup' })).toBeNull();
    expect(screen.queryByRole('link', { name: 'Invite team members' })).toBeNull();
  });

  test('the sidebar "My projects" link goes back to the list', async () => {
    stubApi();
    openAt('#/projects/1');
    await heading('Transit study');
    fireEvent.click(screen.getByRole('link', { name: /^My projects/ }));
    expect(await heading('Your projects')).toBeInTheDocument();
  });

  test('a 404 on project details shows an alert and focuses the h1', async () => {
    stubApi({ 'GET /api/projects/7': () => json(404, { error: 'Not found.' }) });
    openAt('#/projects/7');
    expect(await screen.findByRole('alert')).toHaveTextContent('Project not found.');
    expect(screen.getByRole('heading', { level: 1, name: 'Project unavailable' })).toHaveFocus();
    expect(screen.queryByText(/Your role on this project/)).toBeNull();
  });

  test('a 401 on project details returns to sign-in', async () => {
    stubApi({ 'GET /api/projects/1': () => json(401, { error: 'Sign in required.' }) });
    openAt('#/projects/1');
    expect(await screen.findByRole('button', { name: 'Sign in' })).toBeInTheDocument();
    expect(sessionStorage.getItem('token')).toBeNull();
  });
});

describe('lead-only screen (A4 for the lead, D6 refusal for a member)', () => {
  test('a member at the invite address gets a 403 from the server and sees the refusal naming the lead', async () => {
    const fetchMock = stubApi();
    openAt('#/projects/2/invite');

    const h1 = await heading('Invite team members');
    expect(screen.getByText(REFUSAL)).toBeInTheDocument();
    expect(h1).toHaveFocus();
    expect(h1).toHaveAccessibleDescription(REFUSAL);
    expect(screen.getByRole('link', { name: 'Back to the team dashboard' })).toHaveAttribute('href', '#/projects/2');

    const call = fetchMock.mock.calls.find(([url]) => url === '/api/projects/2/join-code');
    expect(call[1].headers.Authorization).toBe('Bearer tok123');
    expect(await fetchMock.mock.results[fetchMock.mock.calls.indexOf(call)].value).toMatchObject({ status: 403 });

    expect(screen.queryByText(A4_NOTE)).toBeNull();
    expect(screen.queryByText('Team join code')).toBeNull();
    expect(screen.queryByRole('button', { name: 'Copy code' })).toBeNull();
  });

  test('with no lead on record the refusal shows no name', async () => {
    stubApi({ 'GET /api/projects/2': () => json(200, { project: { ...MEMBER.project, lead: null } }) });
    openAt('#/projects/2/invite');
    const h1 = await heading('Invite team members');
    await waitFor(() => expect(h1).toHaveAccessibleDescription('Only the team lead can open this page.'));
    expect(screen.queryByText(/is the team lead/)).toBeNull();
  });

  test('a lead at the invite address sees A4 with the join code', async () => {
    stubApi();
    openAt('#/projects/1/invite');
    expect(await screen.findByText('123456')).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 1, name: 'Invite team members' })).toBeInTheDocument();
    expect(screen.getByText(A4_NOTE)).toBeInTheDocument();
    expect(screen.queryByText(/Only the team lead can open this page/)).toBeNull();
  });

  test('the lead reaches A4 through the dashboard link', async () => {
    stubApi();
    openAt('#/projects/1');
    await heading('Transit study');
    fireEvent.click(screen.getByRole('link', { name: 'Invite team members' }));
    expect(await screen.findByText('123456')).toBeInTheDocument();
  });
});
