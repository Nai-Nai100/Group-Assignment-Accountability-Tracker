import { useEffect, useRef } from 'react';

export const ROLE_LABELS = { lead: 'Team lead', member: 'Team member' };

// Frames A5 (team lead) and B5 (team member). Task, progress, board and file widgets come in later Issues.
// Setup links are a convenience only: the server refuses lead actions from members (RC-02).
export default function Dashboard({ project }) {
  const headingRef = useRef(null);
  useEffect(() => headingRef.current.focus(), []);

  const isLead = project.role === 'lead';

  return (
    <main className="page">
      <div className="eyebrow">Team dashboard</div>
      <h1 ref={headingRef} tabIndex={-1}>
        {project.name}
      </h1>
      <p className="note">
        {project.course && `${project.course} · `}
        Your role on this project: <strong>{ROLE_LABELS[project.role]}</strong>
      </p>

      {isLead && (
        <section className="card section" aria-labelledby="setup-heading">
          <h2 id="setup-heading">Project setup</h2>
          <p className="note">Only the team lead sees these steps.</p>
          <ul className="plain">
            <li>
              <a href={`#/projects/${project.id}/invite`}>Invite team members</a>
            </li>
          </ul>
        </section>
      )}

      <section className="card section" aria-labelledby="team-heading">
        <h2 id="team-heading">Team</h2>
        <ul className="plain">
          {project.members.map((m) => (
            <li key={m.id}>
              {m.name} — {ROLE_LABELS[m.role]}
            </li>
          ))}
        </ul>
      </section>
    </main>
  );
}
