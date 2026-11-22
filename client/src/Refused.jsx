import { useEffect, useRef } from 'react';

// Frame D6. Shown in place of a lead-only screen after the server refuses the request with 403 (RC-02).
// Reuse it for every lead-only screen: pass the screen's title and the project (for the lead's name).
export default function Refused({ title, project }) {
  const headingRef = useRef(null);
  useEffect(() => headingRef.current.focus(), []);

  return (
    <main className="page">
      <div className="eyebrow">Project setup · team lead only</div>
      <h1 ref={headingRef} tabIndex={-1}>
        {title}
      </h1>
      <div className="card narrow">
        <p className="refusal">
          Only the team lead can open this page.
          {project.lead ? ` ${project.lead.name} is the team lead for this project.` : ''}
        </p>
        <p>
          <a href={`#/projects/${project.id}`}>Back to the team dashboard</a>
        </p>
      </div>
    </main>
  );
}
