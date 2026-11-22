import { useEffect, useRef, useState } from 'react';
import Dashboard from './Dashboard.jsx';
import Invite from './Invite.jsx';
import Shell from './Shell.jsx';
import Sidebar from './Sidebar.jsx';
import { ROLE_LABELS } from './Dashboard.jsx';

// A full-page message whose heading takes focus, like every other screen (WCAG 2.4.3).
function Message({ title, children }) {
  const headingRef = useRef(null);
  useEffect(() => headingRef.current.focus(), []);
  return (
    <main className="page">
      <h1 ref={headingRef} tabIndex={-1}>
        {title}
      </h1>
      {children}
    </main>
  );
}

// Loads one project the user belongs to and shows one of its screens (#/projects/:id/<screen>).
// The server returns only this project's data, and 404 for a project the user isn't in (RC-03).
export default function ProjectPage({ token, projectId, screen, onSignOut, userName, projectCount }) {
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
      <Message title="Project unavailable">
        <p role="alert" className="error">
          Error: {error}
        </p>
      </Message>
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
      <Message title="Page not found">
        <p>
          <a href={`#/projects/${project.id}`}>Go to the team dashboard</a>
        </p>
      </Message>
    );
  }

  return (
    <Shell
      title={project ? project.name : 'Project'}
      userName={userName}
      roleLabel={project && ROLE_LABELS[project.role]}
      projectCount={projectCount}
      onSignOut={onSignOut}
      sidebar={project && <Sidebar project={project} current={screen} projectCount={projectCount} />}
    >
      {content}
    </Shell>
  );
}
