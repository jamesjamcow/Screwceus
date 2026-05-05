import { useMemo } from "react";
import { useParams } from "react-router-dom";

import HomeTopNav from "../components/home/HomeTopNav";
import ProjectMiniNav from "../components/project/ProjectMiniNav";
import { formatProjectName } from "../lib/projectRouting";

const ISSUE_COUNTS = {
  open: 18,
  closed: 124,
};

const ISSUE_ROWS = [
  {
    id: 184,
    title: "Torque verification notes disappear after part quantity is edited",
    status: "open",
    labels: ["bug", "priority", "assembly"],
    author: "maya-owens",
    openedAt: "opened 2 days ago",
    meta: "3 comments",
  },
  {
    id: 181,
    title: "Need alternate washer spec for thermal shield bracket revision B",
    status: "open",
    labels: ["documentation", "parts"],
    author: "ian-brooks",
    openedAt: "opened 5 days ago",
    meta: "discussion active",
  },
  {
    id: 176,
    title: "Model click targets drift when overview markers are placed near edge geometry",
    status: "open",
    labels: ["bug", "3d-view"],
    author: "riley",
    openedAt: "opened 1 week ago",
    meta: "5 comments",
  },
  {
    id: 168,
    title: "Expose issue labels inside the new-entry review panel",
    status: "closed",
    labels: ["enhancement", "ui"],
    author: "sara-kim",
    openedAt: "closed yesterday",
    meta: "merged into staging",
  },
  {
    id: 160,
    title: "Inventory subtraction should flag low stock before final assemble step",
    status: "closed",
    labels: ["inventory", "workflow"],
    author: "devon",
    openedAt: "closed 4 days ago",
    meta: "resolved by ops",
  },
  {
    id: 149,
    title: "Clarify spacing callout language on exported part cards",
    status: "closed",
    labels: ["copy", "design"],
    author: "nora",
    openedAt: "closed 2 weeks ago",
    meta: "1 comment",
  },
];

const ACTIVITY_FEED = [
  {
    author: "maya-owens",
    role: "opened this issue",
    time: "2 days ago",
    text: "Operator reports that changing quantity on Assembly 2 clears the torque verification note before the card is saved.",
  },
  {
    author: "qa-bot",
    role: "added labels",
    time: "2 days ago",
    text: "Tagged as bug and priority after reproducing on Chrome and Safari.",
  },
  {
    author: "ian-brooks",
    role: "left a comment",
    time: "1 day ago",
    text: "The issue appears isolated to draft edits. Saved entries still keep the note, so the reset is happening in the form state before persistence.",
  },
];

export default function ProjectIssueLogPage() {
  const { projectId } = useParams();
  const projectName = useMemo(() => formatProjectName(projectId), [projectId]);

  return (
    <div className="min-h-screen bg-[#efefef] text-[#141414]">
      <HomeTopNav />

      <main className="mx-auto max-w-[1180px] px-5 pb-10 pt-6 md:px-7 md:pt-8">
        <h1 className="text-[2rem] leading-none md:text-[2.15rem]">
          <span className="font-normal">SpaceX/</span>
          <span className="font-semibold">{projectName}</span>
        </h1>

        <ProjectMiniNav active="issue-log" projectId={projectId} />

        <section className="mt-8 rounded-[8px] border border-[#c9c2b7] bg-[#f7f4ee] shadow-[0_1px_0_rgba(0,0,0,0.06)]">
          <div className="border-b border-[#d9d2c7] px-4 py-4 md:px-6">
            <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
              <div>
                <p className="text-[0.78rem] uppercase tracking-[0.22em] text-[#71695f]">Issue Log</p>
                <h2 className="mt-2 text-[2rem] leading-none md:text-[2.2rem]">
                  Torque verification notes disappear after part quantity is edited{" "}
                  <span className="font-normal text-[#70685d]">#184</span>
                </h2>
                <div className="mt-3 flex flex-wrap items-center gap-3 text-[0.95rem] text-[#5f574c]">
                  <StatusPill status="open" />
                  <span>
                    {ACTIVITY_FEED[0].author} opened this issue 2 days ago
                  </span>
                  <span>7 people watching</span>
                </div>
              </div>

              <button
                type="button"
                className="inline-flex h-10 items-center justify-center rounded-[6px] border border-[#b7afa3] bg-[#efebe4] px-4 text-sm text-[#141414] transition-colors hover:bg-[#e6e1d8]"
              >
                New issue
              </button>
            </div>
          </div>

          <div className="border-b border-[#d9d2c7] bg-[#efeae1] px-4 py-3 md:px-6">
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div className="flex flex-wrap items-center gap-4 text-[0.98rem]">
                <SummaryTab label="Open" value={ISSUE_COUNTS.open} active />
                <SummaryTab label="Closed" value={ISSUE_COUNTS.closed} />
              </div>

              <div className="flex flex-col gap-3 md:flex-row md:items-center">
                <label htmlFor="issue-log-filter" className="sr-only">
                  Filter issues
                </label>
                <input
                  id="issue-log-filter"
                  type="text"
                  placeholder="Search all issues"
                  className="h-10 min-w-0 rounded-[6px] border border-[#b9b1a6] bg-[#f7f4ee] px-3 text-sm text-[#141414] placeholder:text-[#8e867b] focus:outline-none md:w-[280px]"
                />
                <div className="flex gap-2 text-sm">
                  <ToolbarButton label="Author" />
                  <ToolbarButton label="Label" />
                  <ToolbarButton label="Newest" />
                </div>
              </div>
            </div>
          </div>

          <div className="grid gap-0 lg:grid-cols-[minmax(0,1.4fr)_320px]">
            <section className="border-b border-[#d9d2c7] lg:border-b-0 lg:border-r">
              {ISSUE_ROWS.map((issue) => (
                <article
                  key={issue.id}
                  className="border-b border-[#ddd7cc] px-4 py-4 last:border-b-0 md:px-6"
                >
                  <div className="flex items-start gap-3">
                    <IssueStateIcon status={issue.status} className="mt-[2px] h-5 w-5 shrink-0" />

                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
                        <h3 className="text-[1.08rem] font-medium leading-snug text-[#141414]">
                          {issue.title}
                        </h3>
                        {issue.labels.map((label) => (
                          <IssueLabel key={label} label={label} />
                        ))}
                      </div>

                      <p className="mt-2 text-[0.93rem] text-[#625a4f]">
                        #{issue.id} {issue.openedAt} by {issue.author} • {issue.meta}
                      </p>
                    </div>
                  </div>
                </article>
              ))}
            </section>

            <aside className="bg-[#f3eee6]">
              <div className="border-b border-[#d9d2c7] px-4 py-4 md:px-5">
                <h3 className="text-[1.2rem] font-medium">Discussion</h3>
                <p className="mt-1 text-sm text-[#645c50]">
                  Recent activity for the highlighted issue, styled after a GitHub thread.
                </p>
              </div>

              <div className="space-y-4 px-4 py-4 md:px-5">
                {ACTIVITY_FEED.map((entry, index) => (
                  <article
                    key={`${entry.author}-${entry.time}`}
                    className="rounded-[6px] border border-[#d4ccbf] bg-[#faf8f3] p-3 shadow-[0_1px_0_rgba(0,0,0,0.04)]"
                  >
                    <div className="flex items-center justify-between gap-3 border-b border-[#e3ddd3] pb-2 text-[0.86rem] text-[#625a4f]">
                      <div className="flex items-center gap-2">
                        <span className="inline-flex h-7 w-7 items-center justify-center rounded-full border border-[#c8c0b5] bg-[#ece7dd] text-[0.74rem] font-medium uppercase text-[#3f3a33]">
                          {entry.author.slice(0, 2)}
                        </span>
                        <span className="font-medium text-[#1d1a16]">{entry.author}</span>
                        <span>{entry.role}</span>
                      </div>
                      <span>{entry.time}</span>
                    </div>

                    <p className="pt-3 text-[0.95rem] leading-6 text-[#2a2622]">{entry.text}</p>

                    {index === 0 ? (
                      <div className="mt-3 flex flex-wrap gap-2">
                        <IssueLabel label="bug" />
                        <IssueLabel label="priority" />
                        <IssueLabel label="assembly" />
                      </div>
                    ) : null}
                  </article>
                ))}
              </div>
            </aside>
          </div>
        </section>
      </main>
    </div>
  );
}

function SummaryTab({ label, value, active = false }) {
  return (
    <div
      className={`inline-flex items-center gap-2 rounded-full px-3 py-1 ${
        active ? "bg-[#e3ddd2] text-[#141414]" : "text-[#5f584d]"
      }`}
    >
      <span className="font-medium">{value}</span>
      <span>{label}</span>
    </div>
  );
}

function ToolbarButton({ label }) {
  return (
    <button
      type="button"
      className="rounded-[6px] border border-[#b9b1a6] bg-[#f7f4ee] px-3 py-2 text-[#1a1815] transition-colors hover:bg-[#ece6dc]"
    >
      {label}
    </button>
  );
}

function StatusPill({ status }) {
  const isOpen = status === "open";

  return (
    <span
      className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-[0.9rem] ${
        isOpen ? "bg-[#d4e7d8] text-[#184f2c]" : "bg-[#d7d7d7] text-[#434343]"
      }`}
    >
      <IssueStateIcon status={status} className="h-4 w-4" />
      {isOpen ? "Open" : "Closed"}
    </span>
  );
}

function IssueLabel({ label }) {
  const tone = ISSUE_LABEL_STYLES[label] ?? "bg-[#ddd7cc] text-[#4f483f]";

  return (
    <span className={`rounded-full px-2.5 py-1 text-[0.75rem] font-medium ${tone}`}>{label}</span>
  );
}

function IssueStateIcon({ status, className = "" }) {
  const color = status === "open" ? "#1f883d" : "#8250df";

  return (
    <svg viewBox="0 0 16 16" aria-hidden="true" className={className}>
      <circle cx="8" cy="8" r="6" fill="none" stroke={color} strokeWidth="1.6" />
      {status === "open" ? <circle cx="8" cy="8" r="2.1" fill={color} /> : <path d="m5.2 8 1.8 1.8 3.8-3.9" fill="none" stroke={color} strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />}
    </svg>
  );
}

const ISSUE_LABEL_STYLES = {
  bug: "bg-[#f7d6d6] text-[#7a2121]",
  priority: "bg-[#f5deb3] text-[#75510c]",
  assembly: "bg-[#d8e8f1] text-[#1c516b]",
  documentation: "bg-[#dfe5f7] text-[#384f94]",
  parts: "bg-[#d7e7d7] text-[#315f31]",
  "3d-view": "bg-[#e4dbf4] text-[#58418c]",
  enhancement: "bg-[#d9ebd7] text-[#295933]",
  ui: "bg-[#e7ddf1] text-[#62408d]",
  inventory: "bg-[#d8ebe7] text-[#25584f]",
  workflow: "bg-[#ece0d3] text-[#6a4730]",
  copy: "bg-[#efe2d1] text-[#7c5821]",
  design: "bg-[#ddd9f4] text-[#5040a0]",
};
