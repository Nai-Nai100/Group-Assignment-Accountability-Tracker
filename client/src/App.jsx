import { useCallback, useState } from 'react';
import SignIn from './SignIn.jsx';
import ProjectList from './ProjectList.jsx';
import CreateProject from './CreateProject.jsx';
import Invite from './Invite.jsx';
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

  // Which screen is showing. Signed out: sign-in, or D7 'join'. Signed in: the project list
  // (with an optional notice), A3 'new', or A4 'invite' for one project.
  const [view, setView] = useState({ name: 'projects' });
  const showProjects = useCallback(() => setView({ name: 'projects' }), []);
  const signOutToStart = useCallback(() => {
    setView({ name: 'projects' });
    signOut();
  }, [signOut]);

  if (!token && view.name === 'join') {
    return (
      <JoinTeam
        onJoined={(t, notice) => {
          setView({ name: 'projects', notice });
          signIn(t);
        }}
        onBack={showProjects}
      />
    );
  }
  if (!token) return <SignIn onSignedIn={signIn} onJoin={() => setView({ name: 'join' })} />;
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
      notice={view.notice}
    />
  );
}
