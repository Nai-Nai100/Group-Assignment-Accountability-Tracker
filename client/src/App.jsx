import { useCallback, useEffect, useState } from 'react';
import SignIn from './SignIn.jsx';
import ProjectList from './ProjectList.jsx';
import CreateProject from './CreateProject.jsx';
import ProjectPage from './ProjectPage.jsx';
import JoinTeam from './JoinTeam.jsx';
import Shell from './Shell.jsx';

const TOKEN_KEY = 'token';
const NAME_KEY = 'userName'; // shown in the top bar; not a secret

function readToken() {
  try {
    return sessionStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

function readName() {
  try {
    return sessionStorage.getItem(NAME_KEY) || '';
  } catch {
    return '';
  }
}

function writeToken(token, name = '') {
  try {
    if (token) sessionStorage.setItem(TOKEN_KEY, token);
    else sessionStorage.removeItem(TOKEN_KEY);
    if (name) sessionStorage.setItem(NAME_KEY, name);
    else sessionStorage.removeItem(NAME_KEY);
  } catch {
    // Storage unavailable: the session lasts until the page is closed.
  }
}

// Screens are addressed by the URL hash, so a screen can be opened directly or bookmarked.
// Signed out: #/ sign-in, #/join (D7). Signed in: #/ projects (A2), #/new (A3),
// #/projects/:id dashboard (A5/B5), #/projects/:id/invite (A4, lead only; members see D6).
function readRoute() {
  const parts = window.location.hash.replace(/^#\/?/, '').split('/').filter(Boolean);
  if (parts[0] === 'projects' && parts[1]) return { name: 'project', projectId: parts[1], screen: parts[2] || '' };
  return { name: parts[0] || '' };
}

const go = (path) => {
  window.location.hash = path;
};

export default function App() {
  const [token, setToken] = useState(readToken);
  const [route, setRoute] = useState(readRoute);
  const [notice, setNotice] = useState('');
  const [userName, setUserName] = useState(readName);
  const [projectCount, setProjectCount] = useState(null);

  useEffect(() => {
    const onChange = () => {
      const next = readRoute();
      setRoute(next);
      if (next.name !== '') setNotice(''); // a join notice is shown once, on the project list
    };
    window.addEventListener('hashchange', onChange);
    return () => window.removeEventListener('hashchange', onChange);
  }, []);

  const signIn = useCallback((t, user) => {
    writeToken(t, user?.name);
    setUserName(user?.name || '');
    setToken(t);
  }, []);
  const signOut = useCallback(() => {
    writeToken(null);
    setToken(null);
    setUserName('');
    setProjectCount(null);
    setNotice('');
    go('/');
  }, []);

  // Number of projects for the top bar and sidebar; refreshed on every screen change and after joining.
  const [countVersion, setCountVersion] = useState(0);
  const refreshCount = useCallback(() => setCountVersion((n) => n + 1), []);
  useEffect(() => {
    if (!token) return;
    let live = true;
    fetch('/api/projects', { headers: { Authorization: `Bearer ${token}` } })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => live && data && setProjectCount(data.projects.length))
      .catch(() => {});
    return () => {
      live = false;
    };
  }, [token, route, countVersion]);

  if (!token) {
    if (route.name === 'join') {
      return (
        <JoinTeam
          onJoined={(t, message, user) => {
            setNotice(message);
            signIn(t, user);
            go('/');
          }}
          onBack={() => go('/')}
        />
      );
    }
    return <SignIn onSignedIn={signIn} onJoin={() => go('/join')} />;
  }
  if (route.name === 'project') {
    return (
      <ProjectPage
        key={route.projectId}
        token={token}
        projectId={route.projectId}
        screen={route.screen}
        onSignOut={signOut}
        userName={userName}
        projectCount={projectCount}
      />
    );
  }
  // Your projects and Create a project have the top bar but no sidebar.
  return (
    <Shell title="Your projects" userName={userName} projectCount={projectCount} onSignOut={signOut}>
      {route.name === 'new' ? (
        <CreateProject
          token={token}
          onCreated={(project) => go(`/projects/${project.id}/invite`)}
          onCancel={() => go('/')}
          onSignOut={signOut}
        />
      ) : (
        <ProjectList
          token={token}
          onSignOut={signOut}
          onCreate={() => go('/new')}
          onChanged={refreshCount}
          userName={userName}
          notice={notice}
        />
      )}
    </Shell>
  );
}
