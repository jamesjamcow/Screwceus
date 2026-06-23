import { useMemo, useState } from "react";

import { ChevronDownIcon, ChevronRightIcon, NavIcon } from "../home/HomeIcons";
import { PROJECT_ISSUES } from "./issueData";

const STATUS_ORDER = ["not-started", "in-progress", "blocked", "resolved"];

const STATUS_META = {
  "not-started": {
    label: "Not started",
    description: "Triaged and ready to be picked up",
    tone: "gray",
  },
  "in-progress": {
    label: "In progress",
    description: "Actively being investigated or fixed",
    tone: "blue",
  },
  blocked: {
    label: "Blocked",
    description: "Waiting on a decision or dependency",
    tone: "amber",
  },
  resolved: {
    label: "Resolved",
    description: "Completed and verified",
    tone: "green",
  },
};

const EMPTY_DRAFT = {
  issue: "",
  description: "",
  author: "",
  status: "not-started",
};

export default function IssuesDatabase({
  initialIssues = PROJECT_ISSUES,
  title = "Issue register",
  subtitle = "Grouped by status",
}) {
  const [issues, setIssues] = useState(() => initialIssues);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [collapsedGroups, setCollapsedGroups] = useState({});
  const [isComposing, setIsComposing] = useState(false);
  const [draft, setDraft] = useState(EMPTY_DRAFT);

  const filteredIssues = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return issues.filter((issue) => {
      if (statusFilter !== "all" && issue.status !== statusFilter) return false;
      if (!normalizedQuery) return true;

      return [issue.issue, issue.description, issue.author, STATUS_META[issue.status].label]
        .join(" ")
        .toLowerCase()
        .includes(normalizedQuery);
    });
  }, [issues, query, statusFilter]);

  const visibleStatuses = statusFilter === "all" ? STATUS_ORDER : [statusFilter];

  function openComposer(status = "not-started") {
    setDraft({ ...EMPTY_DRAFT, status });
    setIsComposing(true);
  }

  function saveIssue(event) {
    event.preventDefault();
    if (!draft.issue.trim() || !draft.description.trim() || !draft.author.trim()) return;

    setIssues((current) => [
      ...current,
      {
        id: Math.max(...current.map((issue) => issue.id), 0) + 1,
        issue: draft.issue.trim(),
        description: draft.description.trim(),
        author: draft.author.trim(),
        status: draft.status,
      },
    ]);
    setDraft(EMPTY_DRAFT);
    setIsComposing(false);
  }

  return (
    <section className="issues-database" aria-labelledby="issue-register-title">
      <div className="issues-database__topbar">
        <div className="issues-database__title">
          <span className="issues-database__icon" aria-hidden="true"><NavIcon type="table" /></span>
          <div>
            <h2 id="issue-register-title">{title}</h2>
            <p>{subtitle}</p>
          </div>
          <span className="issues-database__total" aria-label={`${issues.length} total issues`}>{issues.length}</span>
        </div>

        <div className="issues-toolbar">
          <label className="issues-search">
            <NavIcon type="search" />
            <span className="sr-only">Search issues</span>
            <input
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search issues"
            />
          </label>

          <label className="issues-filter">
            <NavIcon type="filter-lines" />
            <span className="sr-only">Filter by status</span>
            <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
              <option value="all">All statuses</option>
              {STATUS_ORDER.map((status) => (
                <option key={status} value={status}>{STATUS_META[status].label}</option>
              ))}
            </select>
          </label>

          <button className="issues-new-button" type="button" onClick={() => openComposer()}>
            New issue
            <NavIcon type="plus" />
          </button>
        </div>
      </div>

      {isComposing ? (
        <IssueComposer
          draft={draft}
          setDraft={setDraft}
          onSubmit={saveIssue}
          onCancel={() => setIsComposing(false)}
        />
      ) : null}

      <div className="issues-table-scroll">
        <div className="issues-table">
          {visibleStatuses.map((status, statusIndex) => {
            const groupIssues = filteredIssues.filter((issue) => issue.status === status);
            const isCollapsed = Boolean(collapsedGroups[status]);
            const meta = STATUS_META[status];

            return (
              <section
                className={`issues-group issues-group--${meta.tone}`}
                key={status}
                aria-labelledby={`issue-group-${status}`}
                style={{ "--group-index": statusIndex }}
              >
                <div className="issues-group__heading">
                  <button
                    type="button"
                    className="issues-disclosure"
                    onClick={() => setCollapsedGroups((current) => ({ ...current, [status]: !current[status] }))}
                    aria-expanded={!isCollapsed}
                    aria-controls={`issue-group-rows-${status}`}
                    aria-label={`${isCollapsed ? "Expand" : "Collapse"} ${meta.label} issues`}
                  >
                    {isCollapsed ? <ChevronRightIcon /> : <ChevronDownIcon />}
                  </button>

                  <span className="issues-group__dot" aria-hidden="true" />
                  <div>
                    <h3 id={`issue-group-${status}`}>{meta.label}</h3>
                    <p>{meta.description}</p>
                  </div>
                  <span className="issues-group__count">{groupIssues.length}</span>
                </div>

                {!isCollapsed ? (
                  <div id={`issue-group-rows-${status}`}>
                    <IssueTableHeader />
                    {groupIssues.length ? (
                      groupIssues.map((issue) => <IssueRow issue={issue} key={issue.id} />)
                    ) : (
                      <div className="issues-empty-row">
                        {query ? "No matching issues in this group" : "No issues in this group"}
                      </div>
                    )}
                    {!query && statusFilter === "all" ? (
                      <button className="issues-add-row" type="button" onClick={() => openComposer(status)}>
                        <NavIcon type="plus" />
                        Add issue
                      </button>
                    ) : null}
                  </div>
                ) : null}
              </section>
            );
          })}
        </div>
      </div>

      <footer className="issues-database__footer">
        <span>{filteredIssues.length} issues shown</span>
        <span>Last updated today</span>
      </footer>
    </section>
  );
}

function IssueTableHeader() {
  return (
    <div className="issues-table__row issues-table__header" role="row">
      <span aria-hidden="true" />
      <span><b className="issues-property-type">Aa</b> Issue</span>
      <span><b className="issues-property-type">Aa</b> Description</span>
      <span><NavIcon type="team" /> Author</span>
      <span><NavIcon type="issues" /> Status</span>
    </div>
  );
}

function IssueRow({ issue }) {
  const status = STATUS_META[issue.status];

  return (
    <article className="issues-table__row issues-table__data" role="row">
      <span className="issues-row-number">#{issue.id}</span>
      <h4>{issue.issue}</h4>
      <p>{issue.description}</p>
      <div className="issues-author">
        <span className="issues-avatar" style={{ "--avatar-hue": avatarHue(issue.author) }}>{initials(issue.author)}</span>
        <span>{issue.author}</span>
      </div>
      <span className={`issues-status issues-status--${status.tone}`}>
        <span aria-hidden="true" />
        {status.label}
      </span>
    </article>
  );
}

function IssueComposer({ draft, setDraft, onSubmit, onCancel }) {
  const updateField = (field, value) => setDraft((current) => ({ ...current, [field]: value }));

  return (
    <form className="issues-composer" onSubmit={onSubmit}>
      <div className="issues-composer__heading">
        <div><span>New record</span><h3>Add an issue</h3></div>
        <button type="button" onClick={onCancel} aria-label="Close new issue form">×</button>
      </div>
      <div className="issues-composer__fields">
        <label>
          <span>Issue</span>
          <input autoFocus required value={draft.issue} onChange={(event) => updateField("issue", event.target.value)} placeholder="What needs attention?" />
        </label>
        <label className="issues-composer__description">
          <span>Description</span>
          <input required value={draft.description} onChange={(event) => updateField("description", event.target.value)} placeholder="Add the context someone needs to act on it" />
        </label>
        <label>
          <span>Author</span>
          <input required value={draft.author} onChange={(event) => updateField("author", event.target.value)} placeholder="Full name" />
        </label>
        <label>
          <span>Status</span>
          <select value={draft.status} onChange={(event) => updateField("status", event.target.value)}>
            {STATUS_ORDER.map((status) => <option key={status} value={status}>{STATUS_META[status].label}</option>)}
          </select>
        </label>
      </div>
      <div className="issues-composer__actions">
        <button type="button" onClick={onCancel}>Cancel</button>
        <button type="submit">Create issue</button>
      </div>
    </form>
  );
}

function initials(name) {
  return name.split(" ").map((part) => part[0]).join("").slice(0, 2).toUpperCase();
}

function avatarHue(name) {
  return [...name].reduce((total, character) => total + character.charCodeAt(0), 0) % 360;
}
