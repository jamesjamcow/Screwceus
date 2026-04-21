const NAV_ITEMS = [
  { id: "design", label: "Design", Icon: DesignIcon },
  { id: "overview", label: "Overview", Icon: OverviewIcon },
  { id: "assemble", label: "Assemble", Icon: AssembleIcon },
  { id: "issue-logs", label: "Issue Logs", Icon: IssueLogsIcon },
];

export default function ProjectMiniNav({ active = "overview" }) {
  return (
    <nav aria-label="Project sections" className="mt-4 flex flex-wrap items-center gap-8 text-[1.65rem] md:text-[1.15rem]">
      {NAV_ITEMS.map(({ id, label, Icon }) => (
        <button
          key={id}
          type="button"
          className={`inline-flex items-center gap-2 transition-opacity ${
            active === id ? "font-medium text-[#141414]" : "font-normal text-[#151515] hover:opacity-75"
          }`}
          aria-current={active === id ? "page" : undefined}
        >
          <Icon className="h-5 w-5 md:h-[19px] md:w-[19px]" />
          {label}
        </button>
      ))}
    </nav>
  );
}

function DesignIcon({ className = "" }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className={className}>
      <path
        d="M12 3.5a8.5 8.5 0 1 0 8.5 8.5m-7.1-8.4c-.9 2.3 0 4.4 1.5 5.6 1.4 1.2 2.8 2.1 2.8 4.3a5.8 5.8 0 1 1-11.6 0c0-4.4 2.8-8.4 7.3-9.9Z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function OverviewIcon({ className = "" }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className={className}>
      <path
        d="M14.7 4.4A8 8 0 1 0 20 12m-5.3-7.6L20 4l-.5 5.3"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function AssembleIcon({ className = "" }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className={className}>
      <path
        d="M4 5.5h7v13H4zm9 0h7v6h-7zm0 8h7v5h-7zM7.5 8h0m0 3h0m9-2h0"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function IssueLogsIcon({ className = "" }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className={className}>
      <path
        d="M4 7h16M4 12h16M4 17h16M4 7h0M4 12h0M4 17h0"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
    </svg>
  );
}
