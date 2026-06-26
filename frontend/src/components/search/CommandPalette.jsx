import { createPortal } from "react-dom";
import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";

import { useWorkspaceSearch } from "../../hooks/useWorkspaceSearch";
import { NavIcon } from "../home/HomeIcons";

const EMPTY_RESULTS = [];
const STATUS_LABELS = {
  planned: "Planned",
  in_progress: "In progress",
  on_hold: "On hold",
  completed: "Completed",
  "not-started": "Not started",
  "in-progress": "In progress",
  blocked: "Blocked",
  resolved: "Resolved",
};

const RESULT_STATUS_TONE_CLASSES = {
  in_progress: "[&_i]:shadow-[0_0_0_3px_rgba(102,129,228,0.11)]",
  "in-progress": "[&_i]:shadow-[0_0_0_3px_rgba(102,129,228,0.11)]",
  blocked: "[&_i]:shadow-[0_0_0_3px_rgba(208,150,77,0.11)]",
  on_hold: "[&_i]:shadow-[0_0_0_3px_rgba(208,150,77,0.11)]",
  completed: "[&_i]:shadow-[0_0_0_3px_rgba(90,164,119,0.11)]",
  resolved: "[&_i]:shadow-[0_0_0_3px_rgba(90,164,119,0.11)]",
};

export default function CommandPalette({ onClose }) {
  const navigate = useNavigate();
  const inputRef = useRef(null);
  const [query, setQuery] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);
  const debouncedQuery = useDebouncedValue(query, 175);
  const searchQuery = useWorkspaceSearch(debouncedQuery, true);
  const normalizedQuery = query.trim();
  const isWaitingForDebounce = normalizedQuery !== debouncedQuery.trim();
  const results = searchQuery.data?.results ?? EMPTY_RESULTS;
  const orderedResults = useMemo(() => [
    ...results.filter((result) => result.type === "project"),
    ...results.filter((result) => result.type === "issue"),
  ], [results]);
  const safeActiveIndex = orderedResults.length
    ? Math.min(activeIndex, orderedResults.length - 1)
    : 0;
  const activeResult = orderedResults[safeActiveIndex];

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    inputRef.current?.focus();

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, []);

  function openResult(result) {
    if (result.type === "issue" && result.issue_scope === "team") {
      navigate(`/?view=team-issues&team=${encodeURIComponent(result.team_id)}&issue=${encodeURIComponent(result.id)}`);
    } else {
      const issueQuery = result.type === "issue" ? `?issue=${encodeURIComponent(result.id)}` : "";
      navigate(`/project/${encodeURIComponent(result.project_id)}/overview${issueQuery}`);
    }
    onClose();
  }

  function handleKeyDown(event) {
    if (event.key === "Escape") {
      event.preventDefault();
      onClose();
      return;
    }

    if (event.key === "Tab") {
      event.preventDefault();
      inputRef.current?.focus();
      return;
    }

    if (!orderedResults.length) return;

    if (event.key === "ArrowDown") {
      event.preventDefault();
      setActiveIndex((current) => (current + 1) % orderedResults.length);
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setActiveIndex((current) => (
        (current - 1 + orderedResults.length) % orderedResults.length
      ));
    } else if (event.key === "Enter" && activeResult) {
      event.preventDefault();
      openResult(activeResult);
    }
  }

  const activeDescendant = activeResult
    ? getResultDomId(activeResult)
    : undefined;

  return createPortal(
    <div
      className="command-palette-backdrop fixed inset-0 z-[1200] grid items-start justify-items-center [@media_(max-width:620px)]:items-start [@media_(max-width:620px)]:py-[18px] [@media_(max-width:620px)]:px-[10px]"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <section
        className="command-palette grid overflow-hidden border border-[#35363b] rounded-[14px] text-[#e8e8e9] [&_*]:box-border [&_*::before]:box-border [&_*::after]:box-border [@media_(max-width:620px)]:rounded-[12px]"
        role="dialog"
        aria-modal="true"
        aria-labelledby="command-palette-title"
        onKeyDown={handleKeyDown}
      >
        <h2 className="sr-only" id="command-palette-title">Search workspace</h2>

        <div className="command-palette__search min-h-[78px] grid items-center gap-[13px] py-0 px-[21px] border-b border-b-[#292a2e] [&_input]:min-w-0 [&_input]:h-[62px] [&_input]:p-0 [&_input]:border-0 [&_input]:outline-0 [&_input]:text-[#f2f2f3] [&_input]:bg-transparent [&_input]:text-[21px] [&_input]:font-[470] [&_input]:tracking-[-0.025em] [&_input::placeholder]:text-[#707176] [&_input::-webkit-search-cancel-button]:hidden [&>kbd]:inline-grid [&>kbd]:place-items-center [&>kbd]:min-w-[23px] [&>kbd]:h-[21px] [&>kbd]:py-0 [&>kbd]:px-[5px] [&>kbd]:border [&>kbd]:border-[#3b3c41] [&>kbd]:border-b-[#2d2e32] [&>kbd]:rounded-[5px] [&>kbd]:text-[#85868b] [&>kbd]:bg-[#1d1e21] [&>kbd]:text-[9px] [&>kbd]:font-[650] [&>kbd]:leading-none [@media_(max-width:620px)]:min-h-[67px] [@media_(max-width:620px)]:py-0 [@media_(max-width:620px)]:px-[16px] [@media_(max-width:620px)]:[&_input]:h-[55px] [@media_(max-width:620px)]:[&_input]:text-[17px]">
          <NavIcon type="search" className="command-palette__search-icon w-[25px] h-[25px] text-[#8f9095]" />
          <input
            ref={inputRef}
            type="search"
            role="combobox"
            aria-autocomplete="list"
            aria-controls="command-palette-results"
            aria-expanded="true"
            aria-activedescendant={activeDescendant}
            autoComplete="off"
            spellCheck="false"
            placeholder="Search projects and issues…"
            value={query}
            onChange={(event) => {
              setQuery(event.target.value);
              setActiveIndex(0);
            }}
          />
          {searchQuery.isFetching || isWaitingForDebounce ? (
            <span className="command-palette__spinner w-[17px] h-[17px] mr-[4px] border-[1.5px] border-solid border-[#34353a] border-t-[#a3a4aa] rounded-full" aria-label="Searching" />
          ) : (
            <kbd>ESC</kbd>
          )}
        </div>

        <div className="command-palette__body min-h-0 overflow-y-auto p-[8px]" id="command-palette-results" role="listbox">
          <PaletteContent
            query={query}
            debouncedQuery={debouncedQuery}
            searchQuery={searchQuery}
            results={orderedResults}
            activeIndex={safeActiveIndex}
            onActivate={setActiveIndex}
            onOpen={openResult}
          />
        </div>

        <footer className="command-palette__footer [&_kbd]:inline-grid [&_kbd]:place-items-center [&_kbd]:min-w-[23px] [&_kbd]:h-[21px] [&_kbd]:py-0 [&_kbd]:px-[5px] [&_kbd]:border [&_kbd]:border-[#3b3c41] [&_kbd]:border-b-[#2d2e32] [&_kbd]:rounded-[5px] [&_kbd]:text-[#85868b] [&_kbd]:bg-[#1d1e21] [&_kbd]:text-[9px] [&_kbd]:font-[650] [&_kbd]:leading-none min-h-[43px] flex items-center gap-[17px] py-0 px-[16px] border-t border-t-[#292a2e] text-[#68696e] bg-[#111214] text-[10px] [&>span]:inline-flex [&>span]:items-center [&>span]:gap-[5px] [&_kbd+kbd]:ml-[-3px] [@media_(max-width:620px)]:gap-[12px]">
          <span><kbd>↑</kbd><kbd>↓</kbd> Navigate</span>
          <span><kbd>↵</kbd> Open</span>
          <span className="command-palette__scope ml-auto text-[#5f6065] tracking-[0.04em]">Projects + issues</span>
        </footer>
      </section>
    </div>,
    document.body,
  );
}

function PaletteContent({
  query,
  debouncedQuery,
  searchQuery,
  results,
  activeIndex,
  onActivate,
  onOpen,
}) {
  const normalizedQuery = query.trim();
  const isWaitingForDebounce = normalizedQuery !== debouncedQuery.trim();

  if (!normalizedQuery) {
    return (
      <PaletteMessage
        icon="search"
        eyebrow="Workspace search"
        title="Find anything in your build"
        copy="Search project names, descriptions, issue titles, and issue details."
      />
    );
  }

  if (normalizedQuery.length < 2) {
    return (
      <PaletteMessage
        icon="compose"
        eyebrow="Keep typing"
        title="Add one more character"
        copy="Search starts after two characters."
      />
    );
  }

  if (isWaitingForDebounce || (searchQuery.isPending && !searchQuery.data)) {
    return <PaletteLoading />;
  }

  if (searchQuery.isError) {
    return (
      <PaletteMessage
        icon="issues"
        eyebrow="Search unavailable"
        title="Couldn’t reach the workspace index"
        copy="Check your connection and try the search again."
        tone="error"
      />
    );
  }

  if (!results.length) {
    return (
      <PaletteMessage
        icon="search"
        eyebrow="No matches"
        title={`Nothing found for “${normalizedQuery}”`}
        copy="Try a project name, issue title, or a term from its description."
      />
    );
  }

  const projectResults = results.filter((result) => result.type === "project");
  const issueResults = results.filter((result) => result.type === "issue");

  return (
    <>
      {projectResults.length ? (
        <ResultGroup label="Projects" count={projectResults.length}>
          {projectResults.map((result, index) => (
            <ResultRow
              key={`project-${result.id}`}
              result={result}
              query={normalizedQuery}
              active={activeIndex === index}
              onActivate={() => onActivate(index)}
              onOpen={() => onOpen(result)}
            />
          ))}
        </ResultGroup>
      ) : null}

      {issueResults.length ? (
        <ResultGroup label="Issues" count={issueResults.length}>
          {issueResults.map((result, issueIndex) => {
            const index = projectResults.length + issueIndex;
            return (
              <ResultRow
                key={`${result.issue_scope}-issue-${result.id}`}
                result={result}
                query={normalizedQuery}
                active={activeIndex === index}
                onActivate={() => onActivate(index)}
                onOpen={() => onOpen(result)}
              />
            );
          })}
        </ResultGroup>
      ) : null}
    </>
  );
}

function ResultGroup({ label, count, children }) {
  return (
    <section className="command-result-group [&+.command-result-group]:mt-[7px] [&+.command-result-group]:pt-[7px] [&+.command-result-group]:border-t [&+.command-result-group]:border-t-[#222326] [&>header]:h-[29px] [&>header]:flex [&>header]:items-center [&>header]:gap-[7px] [&>header]:py-0 [&>header]:px-[11px] [&>header]:text-[#77787d] [&>header]:text-[10px] [&>header]:font-[720] [&>header]:tracking-[0.1em] [&>header]:uppercase [&>header_small]:text-[#4f5054] [&>header_small]:text-[10px] [&>div]:grid [&>div]:gap-[2px]" role="group" aria-label={label}>
      <header>
        <span>{label}</span>
        <small>{count}</small>
      </header>
      <div>{children}</div>
    </section>
  );
}

function ResultRow({ result, query, active, onActivate, onOpen }) {
  const context = result.type === "issue"
    ? result.issue_scope === "team"
      ? `${result.team_name} · Team issue`
      : `${result.project_name} · ${result.team_name}`
    : result.team_name;

  return (
    <button
      id={getResultDomId(result)}
      type="button"
      role="option"
      aria-selected={active}
      className={`command-result w-full min-w-0 min-h-[62px] grid items-center gap-[12px] pt-[7px] pr-[12px] pb-[7px] pl-[9px] border border-transparent rounded-[9px] text-[#d9d9db] bg-transparent text-left cursor-pointer [&.is-active]:text-[#fff] [&.is-active]:bg-[#292b3a] [&.is-active_.command-result__arrow]:opacity-100${active ? " is-active" : ""}`}
      onMouseEnter={onActivate}
      onMouseDown={(event) => event.preventDefault()}
      onClick={onOpen}
      tabIndex={-1}
    >
      <span className={`command-result__mark w-[36px] h-[36px] grid place-items-center border border-[#35363b] rounded-[9px] text-[#9a9ba0] bg-[#1d1e21] [&_svg]:w-[19px] [&_svg]:h-[19px] command-result__mark--${result.type}`}>
        <NavIcon type={result.type === "project" ? "projects" : "issues"} />
      </span>
      <span className="command-result__content min-w-0 grid gap-[4px] [&_strong]:overflow-hidden [&_strong]:text-ellipsis [&_strong]:whitespace-nowrap [&_small]:overflow-hidden [&_small]:text-ellipsis [&_small]:whitespace-nowrap [&_strong]:text-[14px] [&_strong]:font-[590] [&_strong]:tracking-[-0.012em] [&_strong_mark]:text-[#fff] [&_strong_mark]:rounded-[3px] [&_small]:text-[#77787e] [&_small]:text-[11px]">
        <strong><HighlightedText text={result.title} query={query} /></strong>
        <small>{context}</small>
      </span>
      <span className={`command-result__status inline-flex items-center gap-[6px] text-[#818288] text-[10px] whitespace-nowrap [&_i]:w-[6px] [&_i]:h-[6px] [&_i]:rounded-full [&_i]:bg-[#777980] [@media_(max-width:620px)]:hidden ${RESULT_STATUS_TONE_CLASSES[result.status] ?? ""}`}>
        <i />
        {STATUS_LABELS[result.status] ?? result.status}
      </span>
      <NavIcon type="chevron-right" className="command-result__arrow w-[16px] h-[16px] text-[#525359] opacity-0" />
    </button>
  );
}

function getResultDomId(result) {
  const scope = result.issue_scope ?? "workspace";
  return `command-result-${result.type}-${scope}-${result.id}`;
}

function HighlightedText({ text, query }) {
  const index = text.toLocaleLowerCase().indexOf(query.toLocaleLowerCase());
  if (index < 0) return text;

  return (
    <>
      {text.slice(0, index)}
      <mark>{text.slice(index, index + query.length)}</mark>
      {text.slice(index + query.length)}
    </>
  );
}

function PaletteMessage({ icon, eyebrow, title, copy, tone = "default" }) {
  return (
    <div className={`command-palette__message min-h-[255px] flex items-center justify-center gap-[19px] p-[36px] [&>div]:max-w-[390px] [&>div]:grid [&>div>span]:mb-[5px] [&>div>span]:text-[#77787d] [&>div>span]:text-[9px] [&>div>span]:font-[750] [&>div>span]:tracking-[0.12em] [&>div>span]:uppercase [&_strong]:text-[#dedee0] [&_strong]:text-[16px] [&_strong]:font-[590] [&_strong]:tracking-[-0.015em] [&_p]:mt-[5px] [&_p]:mr-0 [&_p]:mb-0 [&_p]:ml-0 [&_p]:text-[#73747a] [&_p]:text-[12px] [&_p]:leading-[1.5] [@media_(max-width:620px)]:min-h-[230px] [@media_(max-width:620px)]:items-start [@media_(max-width:620px)]:flex-col [@media_(max-width:620px)]:py-[38px] [@media_(max-width:620px)]:px-[28px] command-palette__message--${tone}`}>
      <span className="command-palette__message-icon w-[50px] h-[50px] grid flex-none place-items-center border border-[#303136] rounded-[13px] text-[#898a90] [&_svg]:w-[23px] [&_svg]:h-[23px]"><NavIcon type={icon} /></span>
      <div>
        <span>{eyebrow}</span>
        <strong>{title}</strong>
        <p>{copy}</p>
      </div>
    </div>
  );
}

function PaletteLoading() {
  return (
    <div className="command-palette__loading min-h-[255px] flex items-center justify-center gap-[7px] [&_span]:w-[6px] [&_span]:h-[6px] [&_span]:rounded-full [&_span]:bg-[#707177]" aria-live="polite" aria-label="Searching workspace">
      <span /><span /><span />
    </div>
  );
}

function useDebouncedValue(value, delay) {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const timeout = window.setTimeout(() => setDebouncedValue(value), delay);
    return () => window.clearTimeout(timeout);
  }, [delay, value]);

  return debouncedValue;
}
