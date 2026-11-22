import { useCallback, useEffect, useState } from 'react';
import SignIn from './SignIn.jsx';
import ProjectList from './ProjectList.jsx';
import CreateProject from './CreateProject.jsx';
import ProjectPage from './ProjectPage.jsx';
import JoinTeam from './JoinTeam.jsx';

const TOKEN_KEY = 'token';

function readToken() {
  try {
    return sessionStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

function writeToken(token) {
  try {
    if (token) sessionStorage.setItem(TOKEN_KEY, token);
    else sessionStorage.removeItem(TOKEN_KEY);
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

  useEffect(() => {
    const onChange = () => {
      const next = readRoute();
      setRoute(next);
      if (next.name !== '') setNotice(''); // a join notice is shown once, on the project list
    };
    window.addEventListener('hashchange', onChange);
    return () => window.removeEventListener('hashchange', onChange);
  }, []);

  const signIn = useCallback((t) => {
    writeToken(t);
    setToken(t);
  }, []);
  const signOut = useCallback(() => {
    writeToken(null);
    setToken(null);
    setNotice('');
    go('/');
  }, []);

  if (!token) {
    if (route.name === 'join') {
      return (
        <JoinTeam
          onJoined={(t, message) => {
            setNotice(message);
            signIn(t);
            go('/');
          }}
          onBack={() => go('/')}
        />
      );
    }
    return <SignIn onSignedIn={signIn} onJoin={() => go('/join')} />;
  }
  if (route.name === 'new') {
    return (
      <CreateProject
        token={token}
        onCreated={(project) => go(`/projects/${project.id}/invite`)}
        onCancel={() => go('/')}
        onSignOut={signOut}
      />
    );
  }
  if (route.name === 'project') {
    return <ProjectPage key={route.projectId} token={token} projectId={route.projectId} screen={route.screen} onSignOut={signOut} />;
  }
  return <ProjectList token={token} onSignOut={signOut} onCreate={() => go('/new')} notice={notice} />;
}
