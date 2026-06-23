export function BrandIcon({ className = "" }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className={className}>
      <path
        d="M4 7.5 8.2 4l4.2 3.5L8.2 11Zm7.2 6L15.4 10l4.2 3.5-4.2 3.5Zm-7.2 6L8.2 16l4.2 3.5-4.2 3.5ZM4 10l4.2 3.5L4 17l-1.8-1.5L6.4 12 2.2 8.5Zm7.2 0 4.2 3.5L11.2 17 9.4 15.5 13.6 12 9.4 8.5Z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.45"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function FolderIcon({ className = "" }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className={className}>
      <path
        d="M3 6.5h5.1l1.9 2h10V18H3z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function ChevronDownIcon({ className = "" }) {
  return (
    <svg viewBox="0 0 20 20" aria-hidden="true" className={className}>
      <path d="m5 7 5 6 5-6" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

export function ChevronRightIcon({ className = "" }) {
  return (
    <svg viewBox="0 0 20 20" aria-hidden="true" className={className}>
      <path d="m7 5 6 5-6 5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

export function SidebarIcon({ type, className = "" }) {
  if (type === "home") {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true" className={className}>
        <path
          d="m4 12 8-6 8 6M7 10.5V18h10v-7.5"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    );
  }

  if (type === "inbox") {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true" className={className}>
        <path
          d="M4 5.5h16v13H4zm3.5 3.5h9m-9 3.5h9"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinecap="round"
        />
      </svg>
    );
  }

  if (type === "cube") {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true" className={className}>
        <path
          d="m12 4 7 4v8l-7 4-7-4V8zm0 0v8m7-4-7 4-7-4"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.55"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className={className}>
      <path
        d="M4 4h7v7H4zm9 0h7v7h-7zM4 13h7v7H4zm9 0h7v7h-7z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.55"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function NavIcon({ type, className = "" }) {
  const common = {
    viewBox: "0 0 24 24",
    "aria-hidden": true,
    className,
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.6,
    strokeLinecap: "round",
    strokeLinejoin: "round",
  };

  const paths = {
    inbox: <><path d="M5 4.5h14l1 12H4l1-12Z" /><path d="M4.4 13h4l1.4 2h4.4l1.4-2h4" /></>,
    issues: <><rect x="4.5" y="4.5" width="15" height="15" rx="4" /><path d="M12 8v4.5M12 16h.01" /></>,
    projects: <><path d="m12 3.8 7 4.1v8.2l-7 4.1-7-4.1V7.9l7-4.1Z" /><path d="m5.3 8.1 6.7 4 6.7-4M12 12.1v8" /></>,
    inventory: <><rect x="4.5" y="4.5" width="6" height="6" rx="1.2" /><rect x="13.5" y="4.5" width="6" height="6" rx="1.2" /><rect x="4.5" y="13.5" width="6" height="6" rx="1.2" /><rect x="13.5" y="13.5" width="6" height="6" rx="1.2" /></>,
    more: <><circle cx="6" cy="12" r="1" fill="currentColor" stroke="none" /><circle cx="12" cy="12" r="1" fill="currentColor" stroke="none" /><circle cx="18" cy="12" r="1" fill="currentColor" stroke="none" /></>,
    search: <><circle cx="10.5" cy="10.5" r="5.5" /><path d="m15 15 4.2 4.2" /></>,
    compose: <><path d="M5 19h4l10-10-4-4L5 15v4Z" /><path d="m13.8 6.2 4 4" /></>,
    "chevron-down": <path d="m8 10 4 4 4-4" />,
    "chevron-right": <path d="m10 8 4 4-4 4" />,
    plus: <path d="M12 5v14M5 12h14" />,
    filter: <><path d="M4 7h10M18 7h2M4 17h2M10 17h10" /><circle cx="16" cy="7" r="2" /><circle cx="8" cy="17" r="2" /></>,
    "filter-lines": <><path d="M4 6h16M7 12h10M10 18h4" /></>,
    sort: <><path d="M8 6h10M8 12h7M8 18h4" /><path d="m4 5 2 2 2-2M6 7v11" /></>,
    table: <><rect x="4" y="5" width="16" height="14" rx="2" /><path d="M4 10h16M9 10v9" /></>,
    calendar: <><rect x="4.5" y="6" width="15" height="13" rx="2" /><path d="M8 4v4M16 4v4M4.5 10h15" /></>,
    team: <><circle cx="9" cy="9" r="3" /><circle cx="17" cy="10" r="2.2" /><path d="M3.8 19c.4-3.4 2.2-5 5.2-5s4.8 1.6 5.2 5M14 15c2.9-.5 5 .8 5.5 3.5" /></>,
  };

  return <svg {...common}>{paths[type] ?? paths.more}</svg>;
}

export function EmptyStateIcon({ type = "projects", className = "" }) {
  return (
    <div className={`linear-empty-icon ${className}`} aria-hidden="true">
      <span className="linear-empty-icon__back" />
      <span className="linear-empty-icon__middle" />
      <span className="linear-empty-icon__front"><NavIcon type={type} /></span>
    </div>
  );
}
