import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import App from './App.jsx';

const json = (status, body) => Promise.resolve({ ok: status >= 200 && status < 300, status, json: async () => body });

const PROJECTS = {
  projects: [
    { id: '1', name: 'Transit study', course: 'ENV 215', role: 'lead' },
    { id: '2', name: 'Bridge report', course: 'CIV 310', role: 'member' },
  ],
};
const project = (id, name, role) => ({
  project: { id, name, role, lead: { name: 'Priya Shah' }, members: [{ id: 'u1', name: 'Priya Shah', role: 'lead' }] },
});

const MAIN_SOON = ['My Tasks', 'Skill Profile', 'Team Progress', 'Discussion Board', 'Shared Files'];
const SETUP_SOON = ['Upload Course Documents', 'Learning Objectives', 'Milestones', 'Proposed Allocation'];

function stubApi() {
  const routes = {
    'GET /api/projects': () => json(200, PROJECTS),
    'GET /api/projects/1': () => json(200, project('1', 'Transit study', 'lead')),
    'GET /api/projects/2': () => json(200, project('2', 'Bridge report', 'member')),
    'GET /api/projects/1/join-code': () => json(200, { joinCode: '123456' }),
    'POST /api/auth/signin': () => json(200, { token: 'tok123', user: { name: 'Priya Shah' } }),
  };
  vi.stubGlobal('fetch', vi.fn((url, opts = {}) => routes[`${opts.method || 'GET'} ${url}`]()));
}

function signedInAt(hash) {
  sessionStorage.setItem('token', 'tok123');
  sessionStorage.setItem('userName', 'Priya Shah');
  window.location.hash = hash;
  stubApi();
  render(<App />);
}

const topBar = () => within(screen.getByRole('banner'));
const sidebar = () => within(screen.getByRole('navigation', { name: 'Project' }));
const h1 = (name) => screen.findByRole('heading', { level: 1, name });

function reset() {
  cleanup();
  vi.unstubAllGlobals();
  window.location.hash = '';
  sessionStorage.clear();
  localStorage.clear();
  delete document.documentElement.dataset.theme;
}
beforeEach(reset);
afterEach(reset);

describe('top bar', () => {
  test('shows the user name after sign-in', async () => {
    stubApi();
    render(<App />);
    fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'priya@university.edu' } });
    fireEvent.change(screen.getByLabelText('Password'), { target: { value: 'secret-pass' } });
    fireEvent.click(screen.getByRole('button', { name: 'Sign in' }));
    await h1('Your projects');
    expect(topBar().getByText('Priya Shah')).toBeInTheDocument();
    expect(topBar().getByText('Group Project Accountability Tracker')).toBeInTheDocument();
  });

  test('shows the role on the current project inside a project', async () => {
    signedInAt('#/projects/2');
    await h1('Bridge report');
    expect(topBar().getByText('Priya Shah')).toBeInTheDocument();
    expect(topBar().getByText('Team member')).toBeInTheDocument();
  });

  test('"All projects · N" shows the project count and links to the list', async () => {
    signedInAt('');
    const link = await topBar().findByRole('link', { name: 'All projects · 2' });
    expect(link).toHaveAttribute('href', '#/');
  });

  test('the theme toggle flips data-theme and its label, and saves the choice', async () => {
    signedInAt('');
    await h1('Your projects');
    fireEvent.click(topBar().getByRole('button', { name: 'Switch to Dark mode' }));
    expect(document.documentElement.dataset.theme).toBe('dark');
    expect(localStorage.getItem('theme')).toBe('dark');
    fireEvent.click(topBar().getByRole('button', { name: 'Switch to Light mode' }));
    expect(document.documentElement.dataset.theme).toBe('light');
    expect(localStorage.getItem('theme')).toBe('light');
  });

  test('signing out clears the stored user name', async () => {
    signedInAt('');
    await h1('Your projects');
    fireEvent.click(topBar().getByRole('button', { name: 'Sign out' }));
    expect(await screen.findByRole('button', { name: 'Sign in' })).toBeInTheDocument();
    expect(sessionStorage.getItem('userName')).toBeNull();
  });
});

describe('sidebar', () => {
  test('Dashboard is a working link, current on the dashboard', async () => {
    signedInAt('#/projects/1');
    await h1('Transit study');
    const dash = sidebar().getByRole('link', { name: 'Dashboard' });
    expect(dash).toHaveAttribute('href', '#/projects/1');
    expect(dash).toHaveAttribute('aria-current', 'page');
    expect(sidebar().getByRole('link', { name: 'Invite Team Members' })).not.toHaveAttribute('aria-current');
  });

  test('a lead gets a working Invite Team Members link, current on the invite screen', async () => {
    signedInAt('#/projects/1/invite');
    await screen.findByText('123456');
    const invite = sidebar().getByRole('link', { name: 'Invite Team Members' });
    expect(invite).toHaveAttribute('href', '#/projects/1/invite');
    expect(invite).toHaveAttribute('aria-current', 'page');
    expect(sidebar().getByRole('link', { name: 'Dashboard' })).not.toHaveAttribute('aria-current');
  });

  test('unbuilt screens are "Coming soon" text, not links or buttons', async () => {
    signedInAt('#/projects/1');
    await h1('Transit study');
    expect(sidebar().getByText('Project setup · team lead')).toBeInTheDocument();
    for (const label of [...MAIN_SOON, ...SETUP_SOON]) {
      const item = sidebar().getByText(label);
      expect(item).toHaveTextContent(`${label} Coming soon`);
      expect(item.closest('a, button')).toBeNull();
      expect(sidebar().queryByRole('link', { name: new RegExp(label) })).toBeNull();
      expect(sidebar().queryByRole('button', { name: new RegExp(label) })).toBeNull();
    }
  });

  test('a member sees no Project setup section or setup items', async () => {
    signedInAt('#/projects/2');
    await h1('Bridge report');
    expect(sidebar().getByRole('link', { name: 'Dashboard' })).toBeInTheDocument();
    for (const label of MAIN_SOON) expect(sidebar().getByText(label)).toBeInTheDocument();
    expect(sidebar().queryByText('Project setup · team lead')).toBeNull();
    expect(sidebar().queryByText('Invite Team Members')).toBeNull();
    for (const label of SETUP_SOON) expect(sidebar().queryByText(label)).toBeNull();
  });

  test('no sidebar on Your projects or Create a project', async () => {
    signedInAt('');
    await h1('Your projects');
    expect(screen.queryByRole('navigation', { name: 'Project' })).toBeNull();
    window.location.hash = '#/new';
    await h1('Create a project');
    expect(screen.queryByRole('navigation', { name: 'Project' })).toBeNull();
  });
});

describe('Your projects cards (A2)', () => {
  test('each card shows the course and role chip', async () => {
    signedInAt('');
    await screen.findByRole('link', { name: 'Open project: Transit study' });
    const lead = within(screen.getByRole('article', { name: 'Transit study' }));
    const member = within(screen.getByRole('article', { name: 'Bridge report' }));
    expect(lead.getByText('ENV 215')).toBeInTheDocument();
    expect(lead.getByText('Team lead')).toBeInTheDocument();
    expect(member.getByText('CIV 310')).toBeInTheDocument();
    expect(member.getByText('Team member')).toBeInTheDocument();
  });

  test('"+ Create a new project" opens A3', async () => {
    signedInAt('');
    await screen.findByRole('link', { name: 'Open project: Transit study' });
    fireEvent.click(screen.getByRole('button', { name: /^\+ Create a new project/ }));
    await waitFor(() => expect(window.location.hash).toBe('#/new'));
    expect(await h1('Create a project')).toBeInTheDocument();
  });
});
