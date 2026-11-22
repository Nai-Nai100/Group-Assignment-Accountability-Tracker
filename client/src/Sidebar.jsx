// Project sidebar (prototype nav). Built screens are links; the rest are shown as "Coming soon" text, not
// controls. The setup section is shown only to the team lead: presentation only, the server still enforces
// access (RC-02). Add a `screen` to an item when its screen is built.
const MAIN = [
  { label: 'Dashboard', screen: '' },
  { label: 'My Tasks' },
  { label: 'Skill Profile' },
  { label: 'Team Progress' },
  { label: 'Discussion Board' },
  { label: 'Shared Files' },
];
const SETUP = [
  { label: 'Invite Team Members', screen: 'invite' },
  { label: 'Upload Course Documents' },
  { label: 'Learning Objectives' },
  { label: 'Milestones' },
  { label: 'Proposed Allocation' },
];

function Items({ items, project, current }) {
  return (
    <ul>
      {items.map((item) => (
        <li key={item.label}>
          {item.screen === undefined ? (
            <span className="nav-item disabled">
              {item.label} <span className="soon">Coming soon</span>
            </span>
          ) : (
            <a
              className="nav-item"
              href={`#/projects/${project.id}${item.screen && `/${item.screen}`}`}
              aria-current={current === item.screen ? 'page' : undefined}
            >
              {item.label}
            </a>
          )}
        </li>
      ))}
    </ul>
  );
}

export default function Sidebar({ project, current, projectCount }) {
  return (
    <nav className="sidebar" aria-label="Project">
      <a className="back" href="#/">
        <span aria-hidden="true">← </span>My projects{projectCount != null && ` (${projectCount})`}
      </a>
      <div className="eyebrow">{project.name}</div>
      <Items items={MAIN} project={project} current={current} />
      {project.role === 'lead' && (
        <>
          <div className="eyebrow">Project setup · team lead</div>
          <Items items={SETUP} project={project} current={current} />
        </>
      )}
    </nav>
  );
}
