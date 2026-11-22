import { useEffect, useState } from 'react';
import Dashboard from './Dashboard.jsx';
import Invite from './Invite.jsx';

// Loads one project the user belongs to and shows one of its screens (#/projects/:id/<screen>).
// The server returns only this project's data, and 404 for a project the user isn't in (RC-03).
export default function ProjectPage({ token, projectId, screen, onSignOut }) {
  const [project, setProject] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    fetch(`/api/projects/${encodeURIComponent(projectId)}`, { headers: { Authorization: `Bearer ${token}` } })
      .then(async (res) => {
        if (res.status === 401) return onSignOut();
        if (res.status === 404) throw new Error('Project not found. It may not exist, or you may not be on its team.');
        if (!res.ok) throw new Error('Could not load the project.');
        setProject((await res.json()).project);
      })
      .catch((err) => setError(err.message));
  }, [token, projectId, onSignOut]);

  let content;
  if (error) {
    content = (
      <main className="page">
        <h1>Project unavailable</h1>
        <p role="alert" className="error">
          Error: {error}
        </p>
      </main>
    );
  } else if (!project) {
    content = (
      <main className="page">
        <p role="status">Loading the project…</p>
      </main>
    );
  } else if (screen === '') {
    content = <Dashboard project={project} />;
  } else if (screen === 'invite') {
    content = <Invite token={token} project={project} onSignOut={onSignOut} />;
  } else {
    content = (
      <main className="page">
        <h1>Page not found</h1>
        <p>
          <a href={`#/projects/${project.id}`}>Go to the team dashboard</a>
        </p>
      </main>
    );
  }

  return (
    <>
      <nav className="crumbs" aria-label="Breadcrumb">
        <a href="#/">← Your projects</a>
        {project && screen !== '' && (
          <>
            {' / '}
            <a href={`#/projects/${project.id}`}>{project.name}</a>
          </>
        )}
      </nav>
      {content}
    </>
  );
}
