import { useCallback, useState } from 'react';
import SignIn from './SignIn.jsx';
import ProjectList from './ProjectList.jsx';

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

  return token ? <ProjectList token={token} onSignOut={signOut} /> : <SignIn onSignedIn={signIn} />;
}
