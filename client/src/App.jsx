import { useCallback, useState } from 'react';
import SignIn from './SignIn.jsx';
import ProjectList from './ProjectList.jsx';
import CreateProject from './CreateProject.jsx';
import Invite from './Invite.jsx';

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

export default function App() {
  const [token, setToken] = useState(readToken);

  const signIn = useCallback((t) => {
    writeToken(t);
    setToken(t);
  }, []);
  const signOut = useCallback(() => {
    writeToken(null);
    setToken(null);
  }, []);

  // Which signed-in screen is showing: the project list, A3 create, or A4 invite for one project.
  const [view, setView] = useState({ name: 'projects' });
  const showProjects = useCallback(() => setView({ name: 'projects' }), []);
  const signOutToStart = useCallback(() => {
    setView({ name: 'projects' });
    signOut();
  }, [signOut]);

  if (!token) return <SignIn onSignedIn={signIn} />;
  if (view.name === 'new') {
    return (
      <CreateProject
        token={token}
        onCreated={(project) => setView({ name: 'invite', project })}
        onCancel={showProjects}
        onSignOut={signOutToStart}
      />
    );
  }
  if (view.name === 'invite') {
    return <Invite token={token} project={view.project} onBack={showProjects} onSignOut={signOutToStart} />;
  }
  return (
    <ProjectList
      token={token}
      onSignOut={signOutToStart}
      onCreate={() => setView({ name: 'new' })}
      onInvite={(project) => setView({ name: 'invite', project })}
    />
  );
}
