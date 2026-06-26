import { useMemo, useState } from "react";

import { NavIcon } from "../home/HomeIcons";

const EMPTY_LINKS = [];

const PART_ICON_TONE_CLASSES = {
  fastener: "text-[#abc2d4] bg-[#1c252c] border-[#293b47]",
  bearing: "text-[#c8b0dc] bg-[#261f2c] border-[#3d3047]",
  connector: "text-[#d1b18a] bg-[#29231c] border-[#443727]",
  bracket: "text-[#9ecab2] bg-[#1d2822] border-[#2c4236]",
  spacer: "text-[#d1c99c] bg-[#29271c] border-[#44402a]",
};

const PART_TYPE_TONE_CLASSES = {
  fastener: "border-[#32424c] text-[#96b7ca] bg-[#192228]",
  bearing: "border-[#41344a] text-[#bea5cf] bg-[#241e29]",
  connector: "border-[#473a2a] text-[#c8a67c] bg-[#272118]",
  bracket: "border-[#304437] text-[#91bba3] bg-[#1a251f]",
  spacer: "border-[#45412d] text-[#c5bd8b] bg-[#27251a]",
};

export default function ProjectPartsTable({
  links = EMPTY_LINKS,
  isLoading = false,
  isError = false,
  selectable = false,
  selectedLinkId = null,
  showPoint = false,
  searchPlaceholder = "Search project parts...",
  emptyTitle = "No parts linked",
  emptyCopy = "Parts linked to this project will appear here.",
  onSelect,
}) {
  const [query, setQuery] = useState("");
  const [expanded, setExpanded] = useState(() => new Set());

  const rows = useMemo(() => links.map(normalizeProjectPartLink).filter(Boolean), [links]);
  const displayedRows = useMemo(() => {
    const normalizedQuery = query.trim().toLocaleLowerCase();
    if (!normalizedQuery) return rows;

    return rows.filter((row) => (
      [
        row.name,
        row.type,
        row.notes,
        row.projectNotes,
        dimensionsText(row.dimensions),
        row.point ? formatPoint(row.point) : "",
      ].some((value) => String(value ?? "").toLocaleLowerCase().includes(normalizedQuery))
    ));
  }, [query, rows]);

  function toggleExpanded(linkId) {
    setExpanded((current) => {
      const next = new Set(current);
      if (next.has(linkId)) next.delete(linkId);
      else next.add(linkId);
      return next;
    });
  }

  function handleAction(row) {
    toggleExpanded(row.linkId);
    if (selectable) onSelect?.(row.link);
  }

  const emptyMessage = query ? "No parts match your search" : emptyTitle;
  const emptyDescription = query ? "Clear the search to show every linked part." : emptyCopy;

  return (
    <section className="project-parts-db grid gap-[14px]" aria-label="Project parts">
      <div className="project-parts-db__toolbar flex items-center justify-between">
        <label className="project-parts-db__search w-full h-[38px] flex items-center gap-[9px] py-0 px-[12px] border border-[#303136] rounded-[6px] text-[#77797e] bg-[#151619] [&:focus-within]:border-[#5a5e9e] [&_svg]:w-[16px] [&_svg]:h-[16px] [&_svg]:flex-none [&_input]:min-w-0 [&_input]:flex-1 [&_input]:h-full [&_input]:p-0 [&_input]:border-0 [&_input]:outline-0 [&_input]:text-[#d8d8da] [&_input]:bg-transparent [&_input]:text-[12px] [&_input::placeholder]:text-[#5c5e63]">
          <NavIcon type="search" />
          <input
            type="search"
            value={query}
            placeholder={searchPlaceholder}
            aria-label="Search project parts"
            onChange={(event) => setQuery(event.target.value)}
          />
        </label>
      </div>

      <div className="inventory-db__scroll w-full overflow-x-auto project-parts-db__scroll">
        <div className={`inventory-table min-w-[1080px] project-parts-table min-w-[1040px] border border-[#292a2e] rounded-[7px] overflow-hidden bg-[#121315]${showPoint ? " has-point" : ""}`} role="table">
          <div className="inventory-table__header grid items-stretch min-h-[37px] border-b border-b-[#303134] text-[#aaa9ad] bg-[#151617] [&>span]:min-w-0 [&>span]:flex [&>span]:items-center [&>span]:gap-[7px] [&>span]:py-0 [&>span]:px-[11px] [&>span]:border-0 [&>span]:border-r [&>span]:border-r-[#2b2c2f] [&>span]:bg-transparent [&>span]:text-[11px] [&>span]:font-[510] [&>span]:text-left [&>button]:min-w-0 [&>button]:flex [&>button]:items-center [&>button]:gap-[7px] [&>button]:py-0 [&>button]:px-[11px] [&>button]:border-0 [&>button]:border-r [&>button]:border-r-[#2b2c2f] [&>button]:bg-transparent [&>button]:text-[11px] [&>button]:font-[510] [&>button]:text-left [&>button]:cursor-pointer [&>button:hover]:text-[#e2e2e3] [&>button:hover]:bg-[#1d1e20] [&>:last-child]:border-r-0 [&_svg]:w-[14px] [&_svg]:h-[14px] [&_svg]:flex-none [&_svg]:text-[#77787c] project-parts-table__header" role="row">
            <span role="columnheader"><NavIcon type={selectable ? "link" : "table"} />{selectable ? "Map" : "Open"}</span>
            <span role="columnheader"><NavIcon type="inventory" />Name</span>
            <span role="columnheader"><NavIcon type="filter-lines" />Type</span>
            <span role="columnheader"><NavIcon type="table" />Specifications</span>
            <span role="columnheader"><NavIcon type="compose" />Notes</span>
            <span role="columnheader"><NavIcon type="calendar" />{showPoint ? "Point" : "Linked"}</span>
          </div>

          <div role="rowgroup">
            {displayedRows.map((row, index) => (
              <ProjectPartsRow
                key={row.linkId}
                row={row}
                index={index}
                expanded={expanded.has(row.linkId)}
                selected={selectedLinkId === row.linkId}
                selectable={selectable}
                showPoint={showPoint}
                onAction={() => handleAction(row)}
              />
            ))}
          </div>

          {!displayedRows.length ? (
            <div className="inventory-table__empty flex flex-col items-center justify-center text-[#66676c] text-center [&>span]:w-[42px] [&>span]:h-[42px] [&>span]:grid [&>span]:place-items-center [&>span]:mb-[14px] [&>span]:border [&>span]:border-[#323338] [&>span]:rounded-[9px] [&>span]:text-[#898b91] [&>span]:bg-[#1a1b1d] [&_svg]:w-[20px] [&_svg]:h-[20px] [&_strong]:text-[#c7c7ca] [&_strong]:text-[12px] [&_strong]:font-[570] [&_p]:mt-[6px] [&_p]:mr-0 [&_p]:mb-0 [&_p]:ml-0 [&_p]:text-[11px] [&_button]:mt-[13px] [&_button]:p-0 [&_button]:border-0 [&_button]:text-[#9cabe1] [&_button]:bg-transparent [&_button]:text-[11px] [&_button]:cursor-pointer project-parts-table__empty min-h-[260px]">
              <span><NavIcon type={isError ? "issues" : "inventory"} /></span>
              <strong>{isError ? "Could not load project parts" : isLoading ? "Loading project parts" : emptyMessage}</strong>
              <p>{isError ? "Refresh and try again." : isLoading ? "Linked parts are being loaded." : emptyDescription}</p>
              {query ? <button type="button" onClick={() => setQuery("")}>Clear search</button> : null}
            </div>
          ) : null}
        </div>
      </div>
    </section>
  );
}

function ProjectPartsRow({ row, index, expanded, selected, selectable, showPoint, onAction }) {
  const tone = partTone(row.type);
  const dimensions = Object.entries(row.dimensions ?? {});
  const actionLabel = selectable ? "Select" : expanded ? "Hide" : "Expand";

  return (
    <div
      className={`inventory-row-wrap border-b border-b-[var(--inventory-line)] [&:hover]:bg-[#18191b] [&.is-expanded]:bg-[#18191b] [&.is-expanded_.inventory-table__expand-cell_button]:border-[#3c3d40] [&.is-expanded_.inventory-table__expand-cell_button]:text-[#aaaacd] [&.is-expanded_.inventory-table__expand-cell_button]:bg-[#1e1f21] project-parts-row-wrap [&.is-selected]:bg-[#1b1c27] [&.is-selected:hover]:bg-[#1b1c27] [&.is-selected_.inventory-table__expand-cell_button]:border-[#4e55a8] [&.is-selected_.inventory-table__expand-cell_button]:text-[#d6d8ff] [&.is-selected_.inventory-table__expand-cell_button]:bg-[#232542]${expanded ? " is-expanded" : ""}${selected ? " is-selected" : ""}`}
      style={{ "--row-delay": `${Math.min(index, 12) * 18}ms` }}
    >
      <div className="inventory-table__row grid items-stretch min-h-[47px] text-[#dadadc] [&>span]:min-w-0 [&>span]:flex [&>span]:items-center [&>span]:py-[6px] [&>span]:px-[11px] [&>span]:border-r [&>span]:border-r-[var(--inventory-line)] [&>span]:overflow-hidden [&>span]:text-[11px] [&>span:last-child]:border-r-0 [&:hover_.inventory-table__name>button]:text-[#66676b] project-parts-table__row" role="row">
        <span className="inventory-table__expand-cell [&_button]:h-[25px] [&_button]:inline-flex [&_button]:items-center [&_button]:gap-[4px] [&_button]:pt-0 [&_button]:pr-[6px] [&_button]:pb-0 [&_button]:pl-[4px] [&_button]:border [&_button]:border-[#2d2e31] [&_button]:rounded-[5px] [&_button]:text-[#66676b] [&_button]:bg-[#151617] [&_button]:text-[10px] [&_button]:cursor-pointer [&_button:hover]:border-[#3c3d40] [&_button:hover]:text-[#aaaacd] [&_button:hover]:bg-[#1e1f21] [&_svg]:w-[11px] [&_svg]:h-[11px]" role="cell">
          <button
            type="button"
            aria-label={`${actionLabel} ${row.name}`}
            aria-pressed={selectable ? selected : undefined}
            aria-expanded={expanded}
            onClick={onAction}
          >
            <NavIcon type={selectable ? "link" : "chevron-right"} />
            <span>{actionLabel}</span>
          </button>
        </span>
        <span className="inventory-table__name gap-[9px] [&_strong]:min-w-0 [&_strong]:overflow-hidden [&_strong]:text-[#e8e8e9] [&_strong]:text-[12px] [&_strong]:font-[540] [&_strong]:text-ellipsis [&_strong]:whitespace-nowrap [&>button]:w-[22px] [&>button]:h-[22px] [&>button]:flex-none [&>button]:grid [&>button]:place-items-center [&>button]:ml-auto [&>button]:p-0 [&>button]:border-0 [&>button]:rounded-[4px] [&>button]:text-transparent [&>button]:bg-transparent [&>button]:cursor-pointer [&>button:focus-visible]:text-[#66676b] [&>button.is-starred]:text-[#66676b] [&>button:hover]:text-[#c8c9cc] [&>button:hover]:bg-[#292a2d] [&>button.is-starred]:text-[#d5ab60] [&>button_svg]:w-[13px] [&>button_svg]:h-[13px]" role="cell">
          <span className={`inventory-part-icon w-[24px] h-[24px] flex-none grid place-items-center border border-[#34363b] rounded-[5px] text-[#a2a5b3] bg-[#202126] [&_svg]:w-[13px] [&_svg]:h-[13px] ${PART_ICON_TONE_CLASSES[tone] ?? ""}`}><NavIcon type="inventory" /></span>
          <strong title={row.name}>{row.name}</strong>
        </span>
        <span role="cell"><i className={`inventory-type max-w-full overflow-hidden py-[3px] px-[7px] border border-[#38393d] rounded-[4px] text-[#a8a9ad] bg-[#1c1d1f] text-[9px] not-italic text-ellipsis whitespace-nowrap ${PART_TYPE_TONE_CLASSES[tone] ?? ""}`}>{labelType(row.type)}</i></span>
        <span className="inventory-table__specs text-[#a7a8ac] text-ellipsis whitespace-nowrap" role="cell" title={dimensionsText(row.dimensions)}>{dimensionsText(row.dimensions)}</span>
        <span className="inventory-table__notes text-[#a7a8ac] text-ellipsis whitespace-nowrap text-[#b8b8ba] [&_em]:text-[#505156] [&_em]:not-italic" role="cell" title={row.notes || row.projectNotes || ""}>{row.notes || row.projectNotes || <em>No notes</em>}</span>
        <span className="inventory-table__updated text-[#a7a8ac] text-ellipsis whitespace-nowrap text-[#6e6f74] tabular-nums" role="cell">{showPoint ? (row.point ? formatPoint(row.point) : "Not set") : formatRelativeDate(row.linkedAt)}</span>
      </div>

      {expanded ? (
        <div className="inventory-row-detail grid gap-[34px] pt-[18px] pr-[26px] pb-[21px] pl-[105px] border-t border-t-[#242529] bg-[#17181a] [&_dl]:grid [&_dl]:grid-cols-2 [&_dl]:m-0 [&_dl>div]:min-w-0 [&_dl>div]:grid [&_dl>div]:gap-[3px] [&_dt]:text-[#626368] [&_dt]:text-[9px] [&_dd]:overflow-hidden [&_dd]:m-0 [&_dd]:text-[#b3b4b7] [&_dd]:text-[11px] [&_dd]:text-ellipsis [&_dd]:whitespace-nowrap [@media_(max-width:880px)]:grid-cols-2 [@media_(max-width:880px)]:pl-[24px] [@media_(max-width:620px)]:grid-cols-1 project-parts-row-detail pl-[26px]">
          <div className="inventory-row-detail__identity flex items-start gap-[10px] [&>div]:min-w-0 [&>div]:grid [&>div]:gap-[4px] [&>div]:pt-[1px] [&_strong]:overflow-hidden [&_strong]:text-[#d5d5d7] [&_strong]:text-[11px] [&_strong]:font-[560] [&_strong]:text-ellipsis [&_strong]:whitespace-nowrap [&_small]:text-[#606166] [&_small]:text-[9px] [&_small]:tracking-[.04em] [&_small]:uppercase">
            <span className={`inventory-part-icon w-[24px] h-[24px] flex-none grid place-items-center border border-[#34363b] rounded-[5px] text-[#a2a5b3] bg-[#202126] [&_svg]:w-[13px] [&_svg]:h-[13px] ${PART_ICON_TONE_CLASSES[tone] ?? ""}`}><NavIcon type="inventory" /></span>
            <div><strong>{row.name}</strong><small>Part #{String(row.partId).padStart(4, "0")}</small></div>
          </div>
          <dl>
            {dimensions.length ? dimensions.map(([key, value]) => (
              <div key={key}><dt>{labelType(key)}</dt><dd>{formatDimensionValue(value)}</dd></div>
            )) : <div><dt>Specifications</dt><dd>None recorded</dd></div>}
            <div><dt>Point</dt><dd>{row.point ? formatPoint(row.point) : "Not set"}</dd></div>
          </dl>
          <div className="inventory-row-detail__notes [&>span]:text-[#606166] [&>span]:text-[9px] [&>span]:tracking-[.04em] [&>span]:uppercase [&_p]:mt-[6px] [&_p]:mr-0 [&_p]:mb-0 [&_p]:ml-0 [&_p]:text-[#9c9da1] [&_p]:text-[11px] [&_p]:leading-[1.55] [@media_(max-width:880px)]:col-span-full [@media_(max-width:620px)]:col-auto"><span>Project notes</span><p>{row.projectNotes || row.notes || "No notes recorded."}</p></div>
        </div>
      ) : null}
    </div>
  );
}

function normalizeProjectPartLink(link) {
  const part = link?.part;
  if (!link || !part) return null;

  return {
    link,
    linkId: link.id,
    partId: part.id ?? link.part_id,
    name: part.name || "Untitled part",
    type: part.type || "uncategorized",
    dimensions: part.dimensions ?? {},
    notes: part.notes ?? "",
    projectNotes: link.notes ?? "",
    point: Array.isArray(link.point) ? link.point : null,
    linkedAt: link.created_at,
  };
}

function labelType(value) {
  return String(value || "Uncategorized")
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/[_-]+/g, " ")
    .replace(/\b\w/g, (character) => character.toUpperCase());
}

function dimensionsText(dimensions) {
  const entries = Object.entries(dimensions ?? {});
  if (!entries.length) return "No specifications";
  return entries.map(([key, value]) => `${labelType(key)} ${formatDimensionValue(value)}`).join(" · ");
}

function formatDimensionValue(value) {
  if (value === null) return "-";
  if (typeof value === "object") return JSON.stringify(value);
  return String(value);
}

function formatRelativeDate(value) {
  if (!value) return "-";
  const date = new Date(value);
  const elapsed = Date.now() - date.getTime();
  const days = Math.floor(elapsed / 86400000);
  if (days <= 0) return "Today";
  if (days === 1) return "Yesterday";
  if (days < 30) return `${days} days ago`;
  return new Intl.DateTimeFormat(undefined, { month: "short", day: "numeric" }).format(date);
}

function formatPoint(point) {
  return point.map((value) => Number(value).toFixed(2)).join(", ");
}

function partTone(type) {
  return ["fastener", "bearing", "connector", "bracket", "spacer"].includes(type) ? type : "default";
}
