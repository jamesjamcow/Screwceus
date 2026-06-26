import { Fragment, useMemo, useState } from "react";

import { NavIcon } from "../home/HomeIcons";
import { PROJECT_ISSUES } from "./issueData";

const STATUS_ORDER = ["not-started", "in-progress", "blocked", "resolved"];

const STATUS_META = {
  "not-started": {
    label: "Not started",
    tone: "gray",
  },
  "in-progress": {
    label: "In progress",
    tone: "blue",
  },
  blocked: {
    label: "Blocked",
    tone: "amber",
  },
  resolved: {
    label: "Resolved",
    tone: "green",
  },
};

const ISSUE_STATUS_TONE_CLASSES = {
  gray: "[&>span]:bg-[#929398] [&>span]:shadow-[0_0_0_3px_rgba(119,122,130,.12)]",
  blue: "text-[#c7e4ff] bg-[#244f76] [&>span]:bg-[#46a9ff] [&>span]:shadow-[0_0_0_3px_rgba(104,132,232,.12)]",
  amber: "text-[#f1dbba] bg-[#624923] [&>span]:bg-[#e1a752] [&>span]:shadow-[0_0_0_3px_rgba(200,147,77,.12)]",
  green: "text-[#ccebd8] bg-[#27543a] [&>span]:bg-[#62bf86] [&>span]:shadow-[0_0_0_3px_rgba(93,165,120,.12)]",
};

const EMPTY_DRAFT = {
  issue: "",
  description: "",
  author: "",
  status: "not-started",
};

export default function IssuesDatabase({
  initialIssues = PROJECT_ISSUES,
  issues: controlledIssues,
  title = "All issues",
  isLoading = false,
  error = "",
  onRetry,
  onCreateIssue,
  onUpdateIssue,
}) {
  const [localIssues, setLocalIssues] = useState(() => initialIssues);
  const [isComposing, setIsComposing] = useState(false);
  const [editingIssueId, setEditingIssueId] = useState(null);
  const [draft, setDraft] = useState(EMPTY_DRAFT);
  const [submitError, setSubmitError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const issues = controlledIssues ?? localIssues;

  const visibleIssues = useMemo(() => issues, [issues]);

  function openComposer(status = "not-started") {
    setDraft({ ...EMPTY_DRAFT, status });
    setSubmitError("");
    setEditingIssueId(null);
    setIsComposing(true);
  }

  function openEditor(issue) {
    setDraft({
      issue: issue.issue,
      description: issue.description,
      author: issue.author,
      status: issue.status,
    });
    setSubmitError("");
    setIsComposing(false);
    setEditingIssueId(issue.id);
  }

  function closeComposer() {
    setIsComposing(false);
    setEditingIssueId(null);
    setSubmitError("");
  }

  async function saveIssue(event) {
    event.preventDefault();
    if (!draft.issue.trim() || !draft.description.trim() || !draft.author.trim()) return;

    const nextIssue = {
      issue: draft.issue.trim(),
      description: draft.description.trim(),
      author: draft.author.trim(),
      status: draft.status,
    };

    setSubmitError("");
    setIsSubmitting(true);
    try {
      if (editingIssueId !== null && onUpdateIssue) {
        await onUpdateIssue(editingIssueId, nextIssue);
      } else if (editingIssueId !== null) {
        setLocalIssues((current) => current.map((issue) => (
          issue.id === editingIssueId ? { ...issue, ...nextIssue } : issue
        )));
      } else if (onCreateIssue) {
        await onCreateIssue(nextIssue);
      } else {
        setLocalIssues((current) => [
          ...current,
          {
            id: Math.max(...current.map((issue) => issue.id), 0) + 1,
            ...nextIssue,
          },
        ]);
      }
      setDraft(EMPTY_DRAFT);
      closeComposer();
    } catch (saveError) {
      setSubmitError(
        saveError?.response?.data?.detail
        || `Could not ${editingIssueId !== null ? "save changes to" : "create"} the issue. Try again.`,
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <section className="issues-database relative mt-[22px] overflow-visible pt-[18px] pr-0 pb-[40px] pl-0 border-0 rounded-none bg-transparent shadow-none [@media_(max-width:620px)]:mt-[16px]" aria-labelledby="issue-register-title">
      <div className="linear-table-toolbar projects-database__toolbar relative z-[5] min-h-[38px] flex items-center justify-between gap-[20px] pt-0 pr-0 pb-[12px] pl-0 [@media_(max-width:720px)]:items-start [@media_(max-width:720px)]:flex-col [@media_(max-width:720px)]:gap-[8px] issues-database__toolbar">
        <div className="linear-view-tabs flex items-center gap-[6px] min-w-0" aria-label="Issue views">
          <button type="button" className="linear-view-tab" aria-label="My issues"><NavIcon type="team" /><span>My issues</span></button>
          <button type="button" className="linear-view-tab is-active" aria-current="page"><NavIcon type="hourglass" /><span id="issue-register-title">Recently edited</span></button>
          <button type="button" className="linear-view-tab"><NavIcon type="table" /><span>{title}</span><small>{issues.length}</small></button>
          <button type="button" className="linear-view-tab"><NavIcon type="star" /><span>Starred</span></button>
        </div>

        <div className="projects-database__controls flex items-center gap-[2px] [@media_(max-width:720px)]:w-full [@media_(max-width:720px)]:[&_.linear-new-button]:ml-auto">
          <ToolbarIconButton label="Filter issues" icon="filter-lines" />
          <ToolbarIconButton label="Sort issues" icon="sort" />
          <ToolbarIconButton label="Quick actions" icon="lightning" />
          <ToolbarIconButton label="Search issues" icon="search" />
          <ToolbarIconButton label="View options" icon="sliders" />

          <button className="linear-new-button projects-new-button flex items-center h-[28px] gap-[6px] border rounded-[5px] text-[12px] py-0 pr-[6px] pl-[10px] cursor-pointer ml-[5px] font-[590] [&_svg]:w-[14px] [&_svg]:h-[14px]" type="button" onClick={() => openComposer()}>
            <span>New</span>
            <NavIcon type="plus" />
          </button>
        </div>
      </div>

      {isComposing ? (
        <IssueComposer
          draft={draft}
          setDraft={setDraft}
          onSubmit={saveIssue}
          onCancel={closeComposer}
          isSubmitting={isSubmitting}
          error={submitError}
          mode="create"
        />
      ) : null}

      {error ? (
        <div className="issues-request-state min-h-[48px] flex items-center justify-between gap-[16px] py-[10px] px-[14px] text-[#d7adad] bg-[#2a1b1c] text-[0.72rem] [&_button]:flex-none [&_button]:py-[5px] [&_button]:px-[10px] [&_button]:border-0 [&_button]:rounded-[6px] [&_button]:text-[#f1d8d8] [&_button]:bg-[#513031] issues-request-state--error" role="alert">
          <span>{error}</span>
          {onRetry ? <button type="button" onClick={onRetry}>Try again</button> : null}
        </div>
      ) : null}

      <div className="issues-table-scroll overflow-x-auto rounded-[7px]" aria-busy={isLoading}>
        <div className="issues-table min-w-[1050px] p-0" aria-label="All issues">
          <IssueTableHeader />
          {visibleIssues.map((issue) => (
            <Fragment key={issue.id}>
              <IssueRow
                issue={issue}
                isEditing={editingIssueId === issue.id}
                onEdit={() => openEditor(issue)}
              />
              {editingIssueId === issue.id ? (
                <IssueComposer
                  draft={draft}
                  setDraft={setDraft}
                  onSubmit={saveIssue}
                  onCancel={closeComposer}
                  isSubmitting={isSubmitting}
                  error={submitError}
                  mode="edit"
                  issueId={issue.id}
                />
              ) : null}
            </Fragment>
          ))}

          {!visibleIssues.length ? (
            <div className="issues-table__empty min-h-[290px] flex flex-col items-center justify-center p-[36px] text-[#777980] text-center [&_strong]:text-[#c9c9cc] [&_strong]:text-[13px] [&_strong]:font-[580] [&_p]:mt-[6px] [&_p]:mr-0 [&_p]:mb-0 [&_p]:ml-0 [&_p]:text-[#6e7076] [&_p]:text-[11px] [&_button]:mt-[14px] [&_button]:p-0 [&_button]:border-0 [&_button]:text-[#aab0ee] [&_button]:bg-transparent [&_button]:text-[11px] [&_button]:cursor-pointer [&_button:hover]:text-[#c4c8f5]">
              <span className="issues-table__empty-icon w-[38px] h-[38px] grid place-items-center mb-[13px] border border-[#303136] rounded-[9px] text-[#a7ace7] bg-[#191a1d] [&_svg]:w-[20px] [&_svg]:h-[20px]"><NavIcon type="issues" /></span>
              <strong>{isLoading ? "Loading issues…" : "No issues yet"}</strong>
              {!isLoading ? (
                <p>Create an issue to start tracking work.</p>
              ) : null}
              {!isLoading ? (
                <button type="button" onClick={() => openComposer()}>Create your first issue</button>
              ) : null}
            </div>
          ) : null}
        </div>
      </div>

    </section>
  );
}

function ToolbarIconButton({ label, icon }) {
  return (
    <button type="button" className="linear-toolbar-icon" aria-label={label} title={label}>
      <NavIcon type={icon} />
    </button>
  );
}

function IssueTableHeader() {
  return (
    <div className="issues-table__row grid items-center [&>*]:min-w-0 [&>*]:border-0 issues-table__header min-h-[35px] border-0 text-[#777980] bg-[#141517] select-none [&>span]:flex [&>span]:items-center [&>span]:gap-[7px] [&>span]:py-0 [&>span]:px-[11px] [&>span]:text-[11px] [&>span]:font-[400]" role="row">
      <span>Issue</span>
      <span>Description</span>
      <span>Author</span>
      <span>Status</span>
    </div>
  );
}

function IssueRow({ issue, isEditing, onEdit }) {
  const status = STATUS_META[issue.status];

  function handleKeyDown(event) {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      onEdit();
    }
  }

  return (
    <article
      className={`issues-table__row grid items-center [&>*]:min-w-0 [&>*]:border-0 issues-table__data min-h-[47px] border-0 text-[#a3a4a9] bg-transparent cursor-pointer outline-0 [&:hover]:bg-[#191a1d] [&:focus-visible]:bg-[#191a1d] [&.is-editing]:bg-[#1b1c20] [&>*]:flex [&>*]:items-center [&>*]:m-0 [&>*]:py-[7px] [&>*]:px-[11px] [&_h4]:text-[#dddde0] [&_h4]:text-[12px] [&_h4]:font-[540] [&_h4]:tracking-[-0.008em] [&_h4]:leading-[1.42] [&_p]:overflow-hidden [&_p]:text-[#85878d] [&_p]:text-[12px] [&_p]:leading-[1.45] [&_p]:text-ellipsis [&_p]:whitespace-nowrap${isEditing ? " is-editing" : ""}`}
      role="button"
      tabIndex={0}
      aria-expanded={isEditing}
      aria-label={`Edit issue: ${issue.issue}`}
      onClick={onEdit}
      onKeyDown={handleKeyDown}
    >
      <h4>{issue.issue}</h4>
      <p>{issue.description}</p>
      <div className="issues-author gap-[9px] text-[#bdbebb] text-[12px] whitespace-nowrap">
        <span className="issues-avatar w-[21px] h-[21px] grid place-items-center p-0 border-0 rounded-full text-[9px] font-[660] tracking-[0.03em]" style={{ "--avatar-hue": avatarHue(issue.author) }}>{initials(issue.author)}</span>
        <span>{issue.author}</span>
      </div>
      <span className={`issues-status !inline-flex !m-0 !py-[7px] !px-[11px] items-center gap-[7px] min-h-0 rounded-none text-[#a3a4a9] bg-transparent text-[12px] leading-normal whitespace-nowrap [&>span]:w-[14px] [&>span]:h-[14px] [&>span]:flex-none [&>span]:rounded-full [&>span]:bg-[#777a82] ${ISSUE_STATUS_TONE_CLASSES[status.tone] ?? ""}`}>
        <span aria-hidden="true" />
        {status.label}
      </span>
    </article>
  );
}

function IssueComposer({ draft, setDraft, onSubmit, onCancel, isSubmitting, error, mode, issueId }) {
  const updateField = (field, value) => setDraft((current) => ({ ...current, [field]: value }));
  const isEditing = mode === "edit";

  return (
    <form className={`issues-composer relative pt-[12px] pr-[16px] pb-[14px] pl-[16px] border-0 [&_button:disabled]:cursor-wait [&_button:disabled]:opacity-[0.58]${isEditing ? " issues-composer--edit [&_.issues-composer__heading_span]:text-[#8d96ed]" : ""}`} onSubmit={onSubmit}>
      <div className="issues-composer__heading flex items-start justify-between mb-[10px] [&_span]:text-[#4f9bdb] [&_span]:text-[0.62rem] [&_span]:font-[650] [&_span]:tracking-[0.13em] [&_span]:uppercase [&_h3]:mt-[4px] [&_h3]:mr-0 [&_h3]:mb-0 [&_h3]:ml-0 [&_h3]:text-[#e7e7e5] [&_h3]:text-[0.92rem] [&_h3]:font-[580] [&_button]:w-[30px] [&_button]:h-[30px] [&_button]:grid [&_button]:place-items-center [&_button]:p-0 [&_button]:border-0 [&_button]:rounded-[6px] [&_button]:text-[#7b7d82] [&_button]:bg-transparent [&_button:hover]:text-[#d6d7d4] [&_button:hover]:bg-[#232428] [&_svg]:w-[17px] [&_svg]:h-[17px]">
        <div>
          <span>{isEditing ? `Editing issue #${issueId}` : "New record"}</span>
          <h3>{isEditing ? "Update issue details" : "Add an issue"}</h3>
        </div>
        <button type="button" onClick={onCancel} disabled={isSubmitting} aria-label={`Close ${isEditing ? "edit" : "new issue"} form`}>×</button>
      </div>
      <div className="issues-composer__fields grid gap-[10px] [&_label]:block [&_label]:min-w-0 [&_label>span]:block [&_label>span]:mb-[6px] [&_label>span]:text-[#797b80] [&_label>span]:text-[0.66rem] [&_input]:w-full [&_input]:h-[34px] [&_input]:py-0 [&_input]:px-[10px] [&_input]:border-0 [&_input]:rounded-[6px] [&_input]:outline-0 [&_input]:text-[#dededb] [&_input]:bg-[#131416] [&_input]:text-[0.72rem] [&_input]:scheme-dark [&_select]:w-full [&_select]:h-[34px] [&_select]:py-0 [&_select]:px-[10px] [&_select]:border-0 [&_select]:rounded-[6px] [&_select]:outline-0 [&_select]:text-[#dededb] [&_select]:bg-[#131416] [&_select]:text-[0.72rem] [&_select]:scheme-dark [&_input::placeholder]:text-[#55575c] [@media_(max-width:900px)]:grid-cols-2 [@media_(max-width:620px)]:grid-cols-1">
        <label>
          <span>Issue</span>
          <input autoFocus required value={draft.issue} onChange={(event) => updateField("issue", event.target.value)} placeholder="What needs attention?" />
        </label>
        <label className="issues-composer__description [@media_(max-width:900px)]:col-span-2 [@media_(max-width:620px)]:col-auto [@media_(max-width:620px)]:row-auto">
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
      {error ? <p className="issues-composer__error mt-[10px] mr-0 mb-0 ml-0 text-[#df9b9b] text-[0.69rem]" role="alert">{error}</p> : null}
      <div className={`issues-composer__actions flex justify-end gap-[8px] mt-[10px] [&_button]:h-[30px] [&_button]:py-0 [&_button]:px-[13px] [&_button]:border-0 [&_button]:rounded-[6px] [&_button]:text-[#a9aaa7] [&_button]:bg-[#202124] [&_button]:text-[0.7rem] [&_button[type='submit']]:text-[#f4f8fc] [&_button[type='submit']]:bg-[#5e6ad2]`}>
        <button type="button" onClick={onCancel} disabled={isSubmitting}>Cancel</button>
        <button type="submit" disabled={isSubmitting}>
          {isSubmitting ? (isEditing ? "Saving…" : "Creating…") : (isEditing ? "Save changes" : "Create issue")}
        </button>
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
