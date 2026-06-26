import { useEffect, useMemo, useRef, useState } from "react";

const CORE_VIEWS = [
  { id: "mine", label: "My parts", icon: "user" },
  { id: "recent", label: "Recently edited", icon: "hourglass" },
  { id: "all", label: "All parts", icon: "table" },
  { id: "starred", label: "Starred", icon: "star" },
];

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

export default function InventoryDatabase({ parts, currentTeam, userId, onCreatePart }) {
  const [activeView, setActiveView] = useState("all");
  const [openMenu, setOpenMenu] = useState(null);
  const [query, setQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [notesOnly, setNotesOnly] = useState(false);
  const [sort, setSort] = useState("updated-desc");
  const [expanded, setExpanded] = useState(() => new Set());
  const [starred, setStarred] = useState(() => new Set());
  const [compact, setCompact] = useState(true);
  const [visibleColumns, setVisibleColumns] = useState({ specifications: true, notes: true });
  const [currentTime] = useState(Date.now);
  const controlsRef = useRef(null);

  const types = useMemo(() => [...new Set(parts.map((part) => part.type).filter(Boolean))].sort(), [parts]);
  const views = useMemo(() => [
    ...CORE_VIEWS,
    ...types.slice(0, 3).map((type) => ({ id: `type:${type}`, label: labelType(type), icon: "file" })),
  ], [types]);

  useEffect(() => {
    function closeMenus(event) {
      if (!controlsRef.current?.contains(event.target)) setOpenMenu(null);
    }

    function closeOnEscape(event) {
      if (event.key === "Escape") setOpenMenu(null);
    }

    document.addEventListener("pointerdown", closeMenus);
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.removeEventListener("pointerdown", closeMenus);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, []);

  const displayedParts = useMemo(() => {
    const normalizedQuery = query.trim().toLocaleLowerCase();
    return parts
      .filter((part) => {
        if (activeView === "mine" && userId && part.owner_id !== userId) return false;
        if (activeView === "recent" && currentTime - new Date(part.updated_at ?? part.created_at ?? 0).getTime() > 30 * 86400000) return false;
        if (activeView === "starred" && !starred.has(part.id)) return false;
        if (activeView.startsWith("type:") && part.type !== activeView.slice(5)) return false;
        if (typeFilter !== "all" && part.type !== typeFilter) return false;
        if (notesOnly && !part.notes?.trim()) return false;
        if (!normalizedQuery) return true;

        return [part.name, part.type, part.notes, dimensionsText(part.dimensions)]
          .some((value) => String(value ?? "").toLocaleLowerCase().includes(normalizedQuery));
      })
      .sort((left, right) => compareParts(left, right, sort));
  }, [activeView, currentTime, notesOnly, parts, query, sort, starred, typeFilter, userId]);

  const allExpanded = displayedParts.length > 0 && displayedParts.every((part) => expanded.has(part.id));
  const activeFilters = Number(typeFilter !== "all") + Number(notesOnly);
  const currentView = views.find((view) => view.id === activeView) ?? CORE_VIEWS[2];
  const columnClass = `${visibleColumns.specifications ? "has-specifications" : "no-specifications"} ${visibleColumns.notes ? "has-notes" : "no-notes"}`;

  function selectView(viewId) {
    setActiveView(viewId);
    setOpenMenu(null);
  }

  function toggleExpanded(partId) {
    setExpanded((current) => toggleSetValue(current, partId));
  }

  function toggleStarred(partId) {
    setStarred((current) => toggleSetValue(current, partId));
  }

  function toggleAllRows() {
    setExpanded((current) => {
      const next = new Set(current);
      if (allExpanded) displayedParts.forEach((part) => next.delete(part.id));
      else displayedParts.forEach((part) => next.add(part.id));
      return next;
    });
  }

  return (
    <section
      className={`inventory-db min-h-screen pt-[72px] pr-[var(--linear-content-gutter)] pb-0 pl-[var(--linear-content-gutter)] box-border text-[var(--inventory-text)] [&_*]:box-border [&_*::before]:box-border [&_*::after]:box-border [&.is-compact_.inventory-table__row]:min-h-[37px] [&.is-compact_.inventory-part-icon]:w-[20px] [&.is-compact_.inventory-part-icon]:h-[20px] [&.is-compact_.inventory-part-icon]:rounded-[4px]${compact ? " is-compact" : ""}`}
      aria-label={`${currentTeam ? `${currentTeam.name} inventory` : "Organization inventory"}: ${currentView.label}`}
    >
      <div className="inventory-db__viewbar relative z-[20] min-h-[52px] flex items-center justify-between gap-[18px] pt-0 pr-[12px] pb-0 pl-[14px] border-b border-b-[var(--inventory-line-soft)] [@media_(max-width:880px)]:items-stretch [@media_(max-width:880px)]:flex-col [@media_(max-width:880px)]:gap-[2px] [@media_(max-width:880px)]:pt-[9px] [@media_(max-width:880px)]:pr-[12px] [@media_(max-width:880px)]:pb-[7px] [@media_(max-width:880px)]:pl-[12px]">
        <div className="inventory-db__views min-w-0 flex items-center gap-[3px] overflow-x-auto p-0 [&::-webkit-scrollbar]:hidden [&_button]:h-[32px] [&_button]:flex-none [&_button]:inline-flex [&_button]:items-center [&_button]:gap-[7px] [&_button]:py-0 [&_button]:px-[10px] [&_button]:border [&_button]:border-transparent [&_button]:rounded-[17px] [&_button]:text-[#9c9c9f] [&_button]:bg-transparent [&_button]:text-[12px] [&_button]:cursor-pointer [&_button:hover]:text-[#e1e1e2] [&_button:hover]:bg-[#1d1e20] [&_button.is-active]:border-[#37383b] [&_button.is-active]:text-[#f0f0f1] [&_button.is-active]:bg-[#303032] [&_svg]:w-[15px] [&_svg]:h-[15px] [&_svg]:flex-none [&_svg]:text-[#aaa9ac] [&_button.is-active_svg]:text-[#d6d6d7] [@media_(max-width:880px)]:w-full" role="tablist" aria-label="Inventory views">
          {views.map((view) => (
            <button
              type="button"
              role="tab"
              aria-selected={activeView === view.id}
              className={activeView === view.id ? "is-active" : ""}
              key={view.id}
              onClick={() => selectView(view.id)}
            >
              <InventoryIcon type={view.icon} />
              <span>{view.label}</span>
            </button>
          ))}
        </div>

        <div className="inventory-db__toolbar flex-none flex items-center gap-[3px] [@media_(max-width:880px)]:justify-end" ref={controlsRef}>
          <ToolbarMenu
            id="inventory-filter-menu"
            icon="filter"
            label="Filter"
            active={Boolean(activeFilters)}
            open={openMenu === "filter"}
            onToggle={() => setOpenMenu(openMenu === "filter" ? null : "filter")}
          >
            <div className="inventory-menu__heading min-h-[31px] flex items-center justify-between gap-[12px] py-0 px-[7px] text-[#77787d] text-[10px] font-[650] tracking-[.045em] uppercase [&_button]:p-0 [&_button]:border-0 [&_button]:text-[#80aee5] [&_button]:bg-transparent [&_button]:text-[10px] [&_button]:normal-case [&_button]:cursor-pointer">
              <span>Filter inventory</span>
              {activeFilters ? <button type="button" onClick={() => { setTypeFilter("all"); setNotesOnly(false); }}>Clear</button> : null}
            </div>
            <label className="inventory-menu__field grid gap-[6px] p-[7px] [&>span]:text-[#85868b] [&>span]:text-[10px] [&_select]:w-full [&_select]:h-[31px] [&_select]:pt-0 [&_select]:pr-[28px] [&_select]:pb-0 [&_select]:pl-[9px] [&_select]:border [&_select]:border-[#36373a] [&_select]:rounded-[6px] [&_select]:outline-0 [&_select]:text-[#d8d8da] [&_select]:bg-[#151618] [&_select]:text-[11px] [&_select:focus]:border-[#616268]">
              <span>Part type</span>
              <select value={typeFilter} onChange={(event) => setTypeFilter(event.target.value)}>
                <option value="all">Any type</option>
                {types.map((type) => <option value={type} key={type}>{labelType(type)}</option>)}
              </select>
            </label>
            <label className="inventory-menu__check min-h-[34px] flex items-center justify-between gap-[10px] py-0 px-[7px] rounded-[5px] text-[#b7b7ba] text-[11px] cursor-pointer [&:hover]:text-[#e8e8e9] [&:hover]:bg-[#27282b] [&_input]:absolute [&_input]:opacity-0 [&_input]:pointer-events-none [&>span]:flex [&>span]:items-center [&>span]:gap-[8px] [&_span>i]:w-[15px] [&_span>i]:h-[15px] [&_span>i]:grid [&_span>i]:place-items-center [&_span>i]:border [&_span>i]:border-[#45464a] [&_span>i]:rounded-[4px] [&_span>i]:text-transparent [&_span>i]:bg-[#151618] [&_span>i_svg]:w-[11px] [&_span>i_svg]:h-[11px] [&_input:checked+span>i]:border-[#6686bd] [&_input:checked+span>i]:text-[#fff] [&_input:checked+span>i]:bg-[#5576ae]">
              <input type="checkbox" checked={notesOnly} onChange={(event) => setNotesOnly(event.target.checked)} />
              <span><i><InventoryIcon type="check" /></i>Has notes</span>
            </label>
          </ToolbarMenu>

          <ToolbarMenu
            id="inventory-sort-menu"
            icon="sort"
            label="Sort"
            open={openMenu === "sort"}
            onToggle={() => setOpenMenu(openMenu === "sort" ? null : "sort")}
          >
            <div className="inventory-menu__heading min-h-[31px] flex items-center justify-between gap-[12px] py-0 px-[7px] text-[#77787d] text-[10px] font-[650] tracking-[.045em] uppercase [&_button]:p-0 [&_button]:border-0 [&_button]:text-[#80aee5] [&_button]:bg-transparent [&_button]:text-[10px] [&_button]:normal-case [&_button]:cursor-pointer"><span>Sort by</span></div>
            <MenuChoice active={sort === "updated-desc"} onClick={() => { setSort("updated-desc"); setOpenMenu(null); }}>Recently updated</MenuChoice>
            <MenuChoice active={sort === "name-asc"} onClick={() => { setSort("name-asc"); setOpenMenu(null); }}>Name A–Z</MenuChoice>
            <MenuChoice active={sort === "name-desc"} onClick={() => { setSort("name-desc"); setOpenMenu(null); }}>Name Z–A</MenuChoice>
            <MenuChoice active={sort === "type-asc"} onClick={() => { setSort("type-asc"); setOpenMenu(null); }}>Part type</MenuChoice>
          </ToolbarMenu>

          <button type="button" className="inventory-toolbar-button relative w-[28px] h-[28px] grid place-items-center p-0 border-0 rounded-[5px] text-[#8a8b8f] bg-transparent cursor-pointer [&:hover]:text-[#ededee] [&:hover]:bg-[#252628] [&.is-open]:text-[#ededee] [&.is-open]:bg-[#252628] [&.is-active]:text-[#7eb8e5] [&>svg]:w-[15px] [&>svg]:h-[15px] [&>i]:absolute [&>i]:right-[3px] [&>i]:bottom-[3px] [&>i]:w-[5px] [&>i]:h-[5px] [&>i]:border [&>i]:border-[#141516] [&>i]:rounded-full [&>i]:bg-[#4da5e3]" aria-label={allExpanded ? "Collapse all rows" : "Expand all rows"} title={allExpanded ? "Collapse all" : "Expand all"} onClick={toggleAllRows}>
            <InventoryIcon type="bolt" />
          </button>

          <div className={`inventory-search h-[28px] flex items-center border border-transparent rounded-[6px] [&.is-open]:border-[#343538] [&.is-open]:bg-[#18191b] [&.is-open_.inventory-toolbar-button:hover]:bg-transparent [&_input]:w-[132px] [&_input]:h-[26px] [&_input]:pt-0 [&_input]:pr-[8px] [&_input]:pb-0 [&_input]:pl-0 [&_input]:border-0 [&_input]:outline-0 [&_input]:text-[#dfdfe1] [&_input]:bg-transparent [&_input]:text-[11px] [&_input::placeholder]:text-[#55565a] [@media_(max-width:620px)]:[&_input]:w-[105px]${openMenu === "search" || query ? " is-open" : ""}`}>
            <button type="button" className="inventory-toolbar-button relative w-[28px] h-[28px] grid place-items-center p-0 border-0 rounded-[5px] text-[#8a8b8f] bg-transparent cursor-pointer [&:hover]:text-[#ededee] [&:hover]:bg-[#252628] [&.is-open]:text-[#ededee] [&.is-open]:bg-[#252628] [&.is-active]:text-[#7eb8e5] [&>svg]:w-[15px] [&>svg]:h-[15px] [&>i]:absolute [&>i]:right-[3px] [&>i]:bottom-[3px] [&>i]:w-[5px] [&>i]:h-[5px] [&>i]:border [&>i]:border-[#141516] [&>i]:rounded-full [&>i]:bg-[#4da5e3]" aria-label="Search inventory" aria-expanded={openMenu === "search"} onClick={() => setOpenMenu(openMenu === "search" ? null : "search")}>
              <InventoryIcon type="search" />
            </button>
            {openMenu === "search" || query ? (
              <input
                type="search"
                value={query}
                autoFocus
                aria-label="Search inventory"
                placeholder="Search parts…"
                onChange={(event) => setQuery(event.target.value)}
              />
            ) : null}
          </div>

          <ToolbarMenu
            id="inventory-options-menu"
            icon="sliders"
            label="View options"
            align="right"
            open={openMenu === "options"}
            onToggle={() => setOpenMenu(openMenu === "options" ? null : "options")}
          >
            <div className="inventory-menu__heading min-h-[31px] flex items-center justify-between gap-[12px] py-0 px-[7px] text-[#77787d] text-[10px] font-[650] tracking-[.045em] uppercase [&_button]:p-0 [&_button]:border-0 [&_button]:text-[#80aee5] [&_button]:bg-transparent [&_button]:text-[10px] [&_button]:normal-case [&_button]:cursor-pointer"><span>View options</span></div>
            <OptionToggle label="Specifications" checked={visibleColumns.specifications} onChange={(checked) => setVisibleColumns((current) => ({ ...current, specifications: checked }))} />
            <OptionToggle label="Notes" checked={visibleColumns.notes} onChange={(checked) => setVisibleColumns((current) => ({ ...current, notes: checked }))} />
            <OptionToggle label="Compact rows" checked={compact} onChange={setCompact} />
          </ToolbarMenu>

          <button type="button" className="projects-new-button flex items-center h-[28px] gap-[6px] border border-transparent rounded-[5px] text-[#85878d] bg-transparent text-[12px] py-0 px-[8px] cursor-pointer ml-[5px] pt-0 pr-[6px] pb-0 pl-[10px] border-[#7078d6] text-[#fff] bg-[#5e6ad2] font-[590] [&:hover]:border-[#8189e7] [&:hover]:bg-[#6874dd] [&_svg]:w-[14px] [&_svg]:h-[14px] [&_svg]:pl-[4px] [&_svg]:border-l [&_svg]:border-l-[rgba(255,255,255,.18)] inventory-new-button h-[30px] ml-[7px] pt-0 pr-[7px] pb-0 pl-[11px] rounded-[6px] leading-none [&_svg]:w-[15px] [&_svg]:h-[15px]" onClick={onCreatePart}>
            <span>New</span>
            <InventoryIcon type="plus" />
          </button>
        </div>
      </div>

      <div className="inventory-db__scroll w-full overflow-x-auto">
        <div className={`inventory-table min-w-[1080px] ${columnClass}`} role="table" aria-label={`${currentView.label} inventory`}>
          <div className="inventory-table__header grid items-stretch min-h-[37px] border-b border-b-[#303134] text-[#aaa9ad] bg-[#151617] [&>span]:min-w-0 [&>span]:flex [&>span]:items-center [&>span]:gap-[7px] [&>span]:py-0 [&>span]:px-[11px] [&>span]:border-0 [&>span]:border-r [&>span]:border-r-[#2b2c2f] [&>span]:bg-transparent [&>span]:text-[11px] [&>span]:font-[510] [&>span]:text-left [&>button]:min-w-0 [&>button]:flex [&>button]:items-center [&>button]:gap-[7px] [&>button]:py-0 [&>button]:px-[11px] [&>button]:border-0 [&>button]:border-r [&>button]:border-r-[#2b2c2f] [&>button]:bg-transparent [&>button]:text-[11px] [&>button]:font-[510] [&>button]:text-left [&>button]:cursor-pointer [&>button:hover]:text-[#e2e2e3] [&>button:hover]:bg-[#1d1e20] [&>:last-child]:border-r-0 [&_svg]:w-[14px] [&_svg]:h-[14px] [&_svg]:flex-none [&_svg]:text-[#77787c]" role="row">
            <span role="columnheader"><InventoryIcon type="expand" />Expand</span>
            <span role="columnheader"><InventoryIcon type="text" />Name</span>
            <button type="button" role="columnheader" onClick={() => setSort(sort === "type-asc" ? "updated-desc" : "type-asc")}><InventoryIcon type="tag" />Type</button>
            {visibleColumns.specifications ? <span role="columnheader"><InventoryIcon type="list" />Specifications</span> : null}
            {visibleColumns.notes ? <span role="columnheader"><InventoryIcon type="summary" />Notes</span> : null}
            <button type="button" role="columnheader" onClick={() => setSort("updated-desc")}><InventoryIcon type="clock" />Updated</button>
          </div>

          <div role="rowgroup">
            {displayedParts.map((part, index) => (
              <InventoryRow
                key={part.id}
                part={part}
                index={index}
                expanded={expanded.has(part.id)}
                starred={starred.has(part.id)}
                currentTime={currentTime}
                visibleColumns={visibleColumns}
                onToggle={() => toggleExpanded(part.id)}
                onStar={() => toggleStarred(part.id)}
              />
            ))}
          </div>

          {!displayedParts.length ? (
            <div className="inventory-table__empty flex flex-col items-center justify-center text-[#66676c] text-center [&>span]:w-[42px] [&>span]:h-[42px] [&>span]:grid [&>span]:place-items-center [&>span]:mb-[14px] [&>span]:border [&>span]:border-[#323338] [&>span]:rounded-[9px] [&>span]:text-[#898b91] [&>span]:bg-[#1a1b1d] [&_svg]:w-[20px] [&_svg]:h-[20px] [&_strong]:text-[#c7c7ca] [&_strong]:text-[12px] [&_strong]:font-[570] [&_p]:mt-[6px] [&_p]:mr-0 [&_p]:mb-0 [&_p]:ml-0 [&_p]:text-[11px] [&_button]:mt-[13px] [&_button]:p-0 [&_button]:border-0 [&_button]:text-[#9cabe1] [&_button]:bg-transparent [&_button]:text-[11px] [&_button]:cursor-pointer">
              <span><InventoryIcon type="package" /></span>
              <strong>{parts.length ? "No parts match this view" : "Inventory is empty"}</strong>
              <p>{parts.length ? "Change the view or clear the active filters." : "Parts created for this organization will appear here."}</p>
              {parts.length ? <button type="button" onClick={() => { setActiveView("all"); setTypeFilter("all"); setNotesOnly(false); setQuery(""); }}>Show all parts</button> : null}
            </div>
          ) : null}
        </div>
      </div>
    </section>
  );
}

function InventoryRow({ part, index, expanded, starred, currentTime, visibleColumns, onToggle, onStar }) {
  const dimensions = Object.entries(part.dimensions ?? {});
  const tone = partTone(part.type);

  return (
    <div className={`inventory-row-wrap border-b border-b-[var(--inventory-line)] [&:hover]:bg-[#18191b] [&.is-expanded]:bg-[#18191b] [&.is-expanded_.inventory-table__expand-cell_button]:border-[#3c3d40] [&.is-expanded_.inventory-table__expand-cell_button]:text-[#aaaacd] [&.is-expanded_.inventory-table__expand-cell_button]:bg-[#1e1f21]${expanded ? " is-expanded" : ""}`} style={{ "--row-delay": `${Math.min(index, 12) * 18}ms` }}>
      <div className="inventory-table__row grid items-stretch min-h-[47px] text-[#dadadc] [&>span]:min-w-0 [&>span]:flex [&>span]:items-center [&>span]:py-[6px] [&>span]:px-[11px] [&>span]:border-r [&>span]:border-r-[var(--inventory-line)] [&>span]:overflow-hidden [&>span]:text-[11px] [&>span:last-child]:border-r-0 [&:hover_.inventory-table__name>button]:text-[#66676b]" role="row">
        <span className="inventory-table__expand-cell [&_button]:h-[25px] [&_button]:inline-flex [&_button]:items-center [&_button]:gap-[4px] [&_button]:pt-0 [&_button]:pr-[6px] [&_button]:pb-0 [&_button]:pl-[4px] [&_button]:border [&_button]:border-[#2d2e31] [&_button]:rounded-[5px] [&_button]:text-[#66676b] [&_button]:bg-[#151617] [&_button]:text-[10px] [&_button]:cursor-pointer [&_button:hover]:border-[#3c3d40] [&_button:hover]:text-[#aaaacd] [&_button:hover]:bg-[#1e1f21] [&_svg]:w-[11px] [&_svg]:h-[11px]" role="cell">
          <button type="button" aria-label={`${expanded ? "Collapse" : "Expand"} ${part.name}`} aria-expanded={expanded} onClick={onToggle}>
            <InventoryIcon type="chevron" />
            <span>{expanded ? "Hide" : "Expand"}</span>
          </button>
        </span>
        <span className="inventory-table__name gap-[9px] [&_strong]:min-w-0 [&_strong]:overflow-hidden [&_strong]:text-[#e8e8e9] [&_strong]:text-[12px] [&_strong]:font-[540] [&_strong]:text-ellipsis [&_strong]:whitespace-nowrap [&>button]:w-[22px] [&>button]:h-[22px] [&>button]:flex-none [&>button]:grid [&>button]:place-items-center [&>button]:ml-auto [&>button]:p-0 [&>button]:border-0 [&>button]:rounded-[4px] [&>button]:text-transparent [&>button]:bg-transparent [&>button]:cursor-pointer [&>button:focus-visible]:text-[#66676b] [&>button.is-starred]:text-[#66676b] [&>button:hover]:text-[#c8c9cc] [&>button:hover]:bg-[#292a2d] [&>button.is-starred]:text-[#d5ab60] [&>button_svg]:w-[13px] [&>button_svg]:h-[13px]" role="cell">
          <span className={`inventory-part-icon w-[24px] h-[24px] flex-none grid place-items-center border border-[#34363b] rounded-[5px] text-[#a2a5b3] bg-[#202126] [&_svg]:w-[13px] [&_svg]:h-[13px] ${PART_ICON_TONE_CLASSES[tone] ?? ""}`}><InventoryIcon type="screw" /></span>
          <strong>{part.name}</strong>
          <button type="button" className={starred ? "is-starred" : ""} aria-label={`${starred ? "Unstar" : "Star"} ${part.name}`} onClick={onStar}><InventoryIcon type="star" /></button>
        </span>
        <span role="cell"><i className={`inventory-type max-w-full overflow-hidden py-[3px] px-[7px] border border-[#38393d] rounded-[4px] text-[#a8a9ad] bg-[#1c1d1f] text-[9px] not-italic text-ellipsis whitespace-nowrap ${PART_TYPE_TONE_CLASSES[tone] ?? ""}`}>{labelType(part.type)}</i></span>
        {visibleColumns.specifications ? <span className="inventory-table__specs text-[#a7a8ac] text-ellipsis whitespace-nowrap" role="cell">{dimensionsText(part.dimensions)}</span> : null}
        {visibleColumns.notes ? <span className="inventory-table__notes text-[#a7a8ac] text-ellipsis whitespace-nowrap text-[#b8b8ba] [&_em]:text-[#505156] [&_em]:not-italic" role="cell">{part.notes || <em>No notes</em>}</span> : null}
        <span className="inventory-table__updated text-[#a7a8ac] text-ellipsis whitespace-nowrap text-[#6e6f74] tabular-nums" role="cell" title={formatFullDate(part.updated_at ?? part.created_at)}>{formatRelativeDate(part.updated_at ?? part.created_at, currentTime)}</span>
      </div>

      {expanded ? (
        <div className="inventory-row-detail grid gap-[34px] pt-[18px] pr-[26px] pb-[21px] pl-[105px] border-t border-t-[#242529] bg-[#17181a] [&_dl]:grid [&_dl]:grid-cols-2 [&_dl]:m-0 [&_dl>div]:min-w-0 [&_dl>div]:grid [&_dl>div]:gap-[3px] [&_dt]:text-[#626368] [&_dt]:text-[9px] [&_dd]:overflow-hidden [&_dd]:m-0 [&_dd]:text-[#b3b4b7] [&_dd]:text-[11px] [&_dd]:text-ellipsis [&_dd]:whitespace-nowrap [@media_(max-width:880px)]:grid-cols-2 [@media_(max-width:880px)]:pl-[24px] [@media_(max-width:620px)]:grid-cols-1">
          <div className="inventory-row-detail__identity flex items-start gap-[10px] [&>div]:min-w-0 [&>div]:grid [&>div]:gap-[4px] [&>div]:pt-[1px] [&_strong]:overflow-hidden [&_strong]:text-[#d5d5d7] [&_strong]:text-[11px] [&_strong]:font-[560] [&_strong]:text-ellipsis [&_strong]:whitespace-nowrap [&_small]:text-[#606166] [&_small]:text-[9px] [&_small]:tracking-[.04em] [&_small]:uppercase">
            <span className={`inventory-part-icon w-[24px] h-[24px] flex-none grid place-items-center border border-[#34363b] rounded-[5px] text-[#a2a5b3] bg-[#202126] [&_svg]:w-[13px] [&_svg]:h-[13px] ${PART_ICON_TONE_CLASSES[tone] ?? ""}`}><InventoryIcon type="screw" /></span>
            <div><strong>{part.name}</strong><small>Part #{String(part.id).padStart(4, "0")}</small></div>
          </div>
          <dl>
            {dimensions.length ? dimensions.map(([key, value]) => (
              <div key={key}><dt>{labelType(key)}</dt><dd>{formatDimensionValue(value)}</dd></div>
            )) : <div><dt>Specifications</dt><dd>None recorded</dd></div>}
          </dl>
          <div className="inventory-row-detail__notes [&>span]:text-[#606166] [&>span]:text-[9px] [&>span]:tracking-[.04em] [&>span]:uppercase [&_p]:mt-[6px] [&_p]:mr-0 [&_p]:mb-0 [&_p]:ml-0 [&_p]:text-[#9c9da1] [&_p]:text-[11px] [&_p]:leading-[1.55] [@media_(max-width:880px)]:col-span-full [@media_(max-width:620px)]:col-auto"><span>Notes</span><p>{part.notes || "No handling or assembly notes recorded."}</p></div>
        </div>
      ) : null}
    </div>
  );
}

function ToolbarMenu({ id, icon, label, active = false, open, align = "left", onToggle, children }) {
  return (
    <div className="inventory-toolbar-menu relative">
      <button
        type="button"
        className={`inventory-toolbar-button relative w-[28px] h-[28px] grid place-items-center p-0 border-0 rounded-[5px] text-[#8a8b8f] bg-transparent cursor-pointer [&:hover]:text-[#ededee] [&:hover]:bg-[#252628] [&.is-open]:text-[#ededee] [&.is-open]:bg-[#252628] [&.is-active]:text-[#7eb8e5] [&>svg]:w-[15px] [&>svg]:h-[15px] [&>i]:absolute [&>i]:right-[3px] [&>i]:bottom-[3px] [&>i]:w-[5px] [&>i]:h-[5px] [&>i]:border [&>i]:border-[#141516] [&>i]:rounded-full [&>i]:bg-[#4da5e3]${active ? " is-active" : ""}${open ? " is-open" : ""}`}
        aria-label={label}
        aria-expanded={open}
        aria-controls={id}
        title={label}
        onClick={onToggle}
      >
        <InventoryIcon type={icon} />
        {active ? <i>{active === true ? "" : active}</i> : null}
      </button>
      {open ? <div className={`inventory-menu absolute left-0 z-[50] w-[230px] p-[6px] border border-[#343538] rounded-[8px] text-[#d3d3d5] bg-[#1b1c1e] inventory-menu--${align}`} id={id}>{children}</div> : null}
    </div>
  );
}

function MenuChoice({ active, onClick, children }) {
  return <button type="button" className={`inventory-menu__choice [&:hover]:text-[#e8e8e9] [&:hover]:bg-[#27282b] w-full h-[33px] flex items-center justify-between py-0 px-[8px] border-0 rounded-[5px] text-[#a9aaae] bg-transparent text-[11px] text-left cursor-pointer [&.is-active]:text-[#ececee] [&_svg]:w-[13px] [&_svg]:h-[13px] [&_svg]:text-[#9bb8df]${active ? " is-active" : ""}`} onClick={onClick}><span>{children}</span>{active ? <InventoryIcon type="check" /> : null}</button>;
}

function OptionToggle({ label, checked, onChange }) {
  return (
    <label className="inventory-menu__toggle min-h-[34px] flex items-center justify-between gap-[10px] py-0 px-[7px] rounded-[5px] text-[#b7b7ba] text-[11px] cursor-pointer [&:hover]:text-[#e8e8e9] [&:hover]:bg-[#27282b] [&_input]:absolute [&_input]:opacity-0 [&_input]:pointer-events-none [&>i]:relative [&>i]:w-[27px] [&>i]:h-[16px] [&>i]:flex-none [&>i]:border [&>i]:border-[#424348] [&>i]:rounded-[9px] [&>i]:bg-[#141517] [&>i::after]:absolute [&>i::after]:top-[2px] [&>i::after]:left-[2px] [&>i::after]:w-[10px] [&>i::after]:h-[10px] [&>i::after]:rounded-full [&>i::after]:bg-[#77787d] [&_input:checked+i]:border-[#576fa5] [&_input:checked+i]:bg-[#3f578b] [&_input:checked+i::after]:bg-[#e9eef8]">
      <span>{label}</span>
      <input type="checkbox" checked={checked} onChange={(event) => onChange(event.target.checked)} />
      <i />
    </label>
  );
}

function InventoryIcon({ type }) {
  const paths = {
    user: <><circle cx="9" cy="8" r="3" /><path d="M4 19c.3-4 2-6 5-6s4.7 2 5 6M17 8v8M14 13l3 3 3-3" /></>,
    hourglass: <><path d="M7 4h10M7 20h10M8 4c0 4 1.3 5.8 4 8-2.7 2.2-4 4-4 8M16 4c0 4-1.3 5.8-4 8 2.7 2.2 4 4 4 8" /></>,
    table: <><rect x="4" y="5" width="16" height="14" rx="1.5" /><path d="M4 10h16M9 10v9" /></>,
    star: <path d="m12 4 2.4 4.9 5.4.8-3.9 3.8.9 5.4-4.8-2.5-4.8 2.5.9-5.4-3.9-3.8 5.4-.8L12 4Z" />,
    file: <><path d="M6 3.5h8l4 4V20H6Z" /><path d="M14 3.5V8h4M9 12h6M9 16h4" /></>,
    filter: <><path d="M4 6h16M7 12h10M10 18h4" /></>,
    sort: <><path d="M8 6h10M8 12h7M8 18h4M4 5v14M2 7l2-2 2 2" /></>,
    bolt: <path d="m13.5 2.8-8 11h6l-1 7.4 8-11h-6l1-7.4Z" />,
    search: <><circle cx="10.5" cy="10.5" r="5.5" /><path d="m15 15 4.5 4.5" /></>,
    sliders: <><path d="M4 7h9M17 7h3M4 17h3M11 17h9" /><circle cx="15" cy="7" r="2" /><circle cx="9" cy="17" r="2" /></>,
    check: <path d="m5 12 4 4L19 6" />,
    plus: <path d="M12 5v14M5 12h14" />,
    expand: <><path d="M8 3H3v5M16 3h5v5M8 21H3v-5M16 21h5v-5M3 8l6-6M21 8l-6-6M3 16l6 6M21 16l-6 6" /></>,
    text: <><path d="M5 6h14M12 6v13M8 19h8" /></>,
    tag: <><path d="M4 5h8l8 8-7 7-8-8Z" /><circle cx="9" cy="9" r="1" /></>,
    list: <><path d="M9 6h11M9 12h11M9 18h11" /><circle cx="5" cy="6" r=".7" fill="currentColor" /><circle cx="5" cy="12" r=".7" fill="currentColor" /><circle cx="5" cy="18" r=".7" fill="currentColor" /></>,
    summary: <><path d="M4 6h16M4 12h12M4 18h8" /></>,
    clock: <><circle cx="12" cy="12" r="8" /><path d="M12 7v5l3 2" /></>,
    package: <><path d="m12 3 8 4.5v9L12 21l-8-4.5v-9Z" /><path d="m4 7.5 8 4.5 8-4.5M12 12v9" /></>,
    screw: <><path d="m7 5 12 12M5 7l2-2 3 1-4 4-1-3ZM13 11l-3 3 7 7 3-3-7-7ZM13 17l3-3M15 19l3-3" /></>,
    chevron: <path d="m9 6 6 6-6 6" />,
  };

  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      {paths[type] ?? paths.package}
    </svg>
  );
}

function toggleSetValue(current, value) {
  const next = new Set(current);
  if (next.has(value)) next.delete(value);
  else next.add(value);
  return next;
}

function compareParts(left, right, sort) {
  if (sort === "name-asc") return left.name.localeCompare(right.name);
  if (sort === "name-desc") return right.name.localeCompare(left.name);
  if (sort === "type-asc") return String(left.type).localeCompare(String(right.type)) || left.name.localeCompare(right.name);
  return new Date(right.updated_at ?? right.created_at ?? 0) - new Date(left.updated_at ?? left.created_at ?? 0);
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
  if (value === null) return "—";
  if (typeof value === "object") return JSON.stringify(value);
  return String(value);
}

function formatRelativeDate(value, currentTime) {
  if (!value) return "—";
  const date = new Date(value);
  const elapsed = currentTime - date.getTime();
  const days = Math.floor(elapsed / 86400000);
  if (days <= 0) return "Today";
  if (days === 1) return "Yesterday";
  if (days < 30) return `${days} days ago`;
  return new Intl.DateTimeFormat(undefined, { month: "short", day: "numeric" }).format(date);
}

function partTone(type) {
  return ["fastener", "bearing", "connector", "bracket", "spacer"].includes(type) ? type : "default";
}

function formatFullDate(value) {
  if (!value) return "";
  return new Intl.DateTimeFormat(undefined, { dateStyle: "medium", timeStyle: "short" }).format(new Date(value));
}
