import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";

import { ChevronDownIcon, ChevronRightIcon, FolderIcon, NavIcon } from "./HomeIcons";

const EMPTY_ITEMS = [];

export default function ProjectsTable({ folders = EMPTY_ITEMS, projects = EMPTY_ITEMS }) {
  const [expandedFolders, setExpandedFolders] = useState(() => new Set());
  const [filterOpen, setFilterOpen] = useState(false);
  const [newMenuOpen, setNewMenuOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState("updated");
  const controlsRef = useRef(null);

  useEffect(() => {
    function closeMenus(event) {
      if (!controlsRef.current?.contains(event.target)) {
        setFilterOpen(false);
        setNewMenuOpen(false);
      }
    }

    function closeOnEscape(event) {
      if (event.key === "Escape") {
        setFilterOpen(false);
        setNewMenuOpen(false);
      }
    }

    document.addEventListener("pointerdown", closeMenus);
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.removeEventListener("pointerdown", closeMenus);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, []);

  const rows = useMemo(
    () => buildRows(folders, projects, expandedFolders, query, sort),
    [expandedFolders, folders, projects, query, sort],
  );

  function toggleFolder(folderId) {
    setExpandedFolders((current) => {
      const next = new Set(current);
      if (next.has(folderId)) next.delete(folderId);
      else next.add(folderId);
      return next;
    });
  }

  return (
    <section className="projects-database" aria-labelledby="projects-database-title">
      <div className="projects-database__toolbar">
        <div className="projects-database__title-block">
          <span className="projects-database__view-icon"><NavIcon type="table" /></span>
          <h2 id="projects-database-title">All projects</h2>
          <span className="projects-database__count">{projects.length}</span>
        </div>

        <div className="projects-database__controls" ref={controlsRef}>
          <div className="projects-database__control-wrap">
            <button
              type="button"
              className={`projects-database__control${query ? " is-active" : ""}`}
              aria-expanded={filterOpen}
              aria-controls="project-filter-popover"
              onClick={() => {
                setFilterOpen((open) => !open);
                setNewMenuOpen(false);
              }}
            >
              <NavIcon type="filter-lines" />
              <span>Filter</span>
              {query ? <i aria-label="Filter active" /> : null}
            </button>
            {filterOpen ? (
              <div className="projects-popover projects-filter-popover" id="project-filter-popover">
                <label htmlFor="project-filter">Filter by name</label>
                <div className="projects-filter-input">
                  <NavIcon type="search" />
                  <input
                    id="project-filter"
                    type="search"
                    value={query}
                    placeholder="Search projects and folders…"
                    autoFocus
                    onChange={(event) => setQuery(event.target.value)}
                  />
                </div>
                {query ? <button type="button" onClick={() => setQuery("")}>Clear filter</button> : null}
              </div>
            ) : null}
          </div>

          <label className="projects-sort-control">
            <NavIcon type="sort" />
            <span>Sort</span>
            <select value={sort} onChange={(event) => setSort(event.target.value)} aria-label="Sort projects">
              <option value="updated">Recently updated</option>
              <option value="name-asc">Name A–Z</option>
              <option value="name-desc">Name Z–A</option>
            </select>
          </label>

          <div className="projects-database__control-wrap">
            <button
              type="button"
              className="projects-new-button"
              aria-expanded={newMenuOpen}
              aria-controls="project-new-menu"
              onClick={() => {
                setNewMenuOpen((open) => !open);
                setFilterOpen(false);
              }}
            >
              <span>New</span>
              <ChevronDownIcon />
            </button>
            {newMenuOpen ? (
              <div className="projects-popover projects-new-menu" id="project-new-menu">
                <Link to="/projects/new">
                  <span className="projects-new-menu__icon projects-new-menu__icon--project"><NavIcon type="projects" /></span>
                  <span><strong>New project</strong><small>Create an empty project</small></span>
                </Link>
                <Link to="/folders/new">
                  <span className="projects-new-menu__icon"><FolderIcon /></span>
                  <span><strong>New folder</strong><small>Group related projects</small></span>
                </Link>
              </div>
            ) : null}
          </div>
        </div>
      </div>

      <div className="projects-table-scroll">
        <div className="projects-table" aria-label="All projects">
          <div className="projects-table__header">
            <span>Name</span>
            <span>Health</span>
            <span>Priority</span>
            <span>Lead</span>
            <span>Target date</span>
            <span className="is-numeric">Issues</span>
            <span>Status</span>
          </div>

          <div>
            {rows.map((row) => row.type === "folder" ? (
              <FolderRow
                key={`folder-${row.item.id}`}
                folder={row.item}
                depth={row.depth}
                expanded={row.expanded}
                itemCount={row.itemCount}
                onToggle={() => toggleFolder(row.item.id)}
              />
            ) : (
              <ProjectRow key={`project-${row.item.id}`} project={row.item} depth={row.depth} />
            ))}
          </div>

          {!rows.length ? (
            <div className="projects-table__empty">
              <span className="projects-table__empty-icon"><FolderIcon /></span>
              <strong>{query ? "No matching projects" : "No projects yet"}</strong>
              <p>{query ? "Try a different name or clear the filter." : "Create a project or folder to start organizing your work."}</p>
              {!query ? <Link to="/projects/new">Create your first project</Link> : null}
            </div>
          ) : null}
        </div>
      </div>
    </section>
  );
}

function FolderRow({ folder, depth, expanded, itemCount, onToggle }) {
  return (
    <button
      type="button"
      className={`projects-table__row projects-table__row--folder${expanded ? " is-expanded" : ""}`}
      aria-expanded={expanded}
      onClick={onToggle}
    >
      <span className="projects-table__name" style={{ "--tree-indent": `${depth * 23}px` }}>
        <span className="projects-table__disclosure">
          {expanded ? <ChevronDownIcon /> : <ChevronRightIcon />}
        </span>
        <span className="projects-table__folder-icon"><FolderIcon /></span>
        <strong>{folder.name}</strong>
        <small>{itemCount}</small>
      </span>
      <span className="projects-table__muted">Folder</span>
      <span className="projects-table__muted">—</span>
      <span className="projects-table__muted">—</span>
      <span className="projects-table__muted">—</span>
      <span className="projects-table__muted is-numeric">—</span>
      <span className="projects-table__muted">—</span>
    </button>
  );
}

function ProjectRow({ project, depth }) {
  return (
    <Link className="projects-table__row projects-table__row--project" to={`/project/${project.id}`}>
      <span className="projects-table__name" style={{ "--tree-indent": `${depth * 23}px` }}>
        <span className="projects-table__project-spacer" />
        <span className="projects-table__project-icon"><NavIcon type="projects" /></span>
        <strong>{project.name}</strong>
      </span>
      <span className="projects-table__health"><i />No updates</span>
      <span className="projects-table__muted">—</span>
      <span className="projects-table__lead"><span>?</span>No lead</span>
      <span className="projects-table__target"><NavIcon type="calendar" />No target</span>
      <span className="is-numeric">0</span>
      <span className="projects-table__status"><i />0%</span>
    </Link>
  );
}

function buildRows(folders, projects, expandedFolders, query, sort) {
  const normalizedQuery = query.trim().toLocaleLowerCase();
  const projectMap = new Map();
  for (const project of projects) {
    const key = project.folder_id ?? null;
    const current = projectMap.get(key) ?? [];
    current.push(project);
    projectMap.set(key, current);
  }

  const searchableFolderIds = normalizedQuery
    ? findSearchableFolderIds(folders, projects, normalizedQuery)
    : null;
  const rows = [];

  function visit(folderList, depth) {
    for (const folder of sortItems(folderList, sort)) {
      if (searchableFolderIds && !searchableFolderIds.has(folder.id)) continue;

      const folderProjects = sortItems(projectMap.get(folder.id) ?? [], sort)
        .filter((project) => matches(project.name, normalizedQuery));
      const isExpanded = normalizedQuery ? true : expandedFolders.has(folder.id);
      rows.push({
        type: "folder",
        item: folder,
        depth,
        expanded: isExpanded,
        itemCount: countFolderContents(folder, projectMap),
      });

      if (isExpanded) {
        visit(folder.children ?? EMPTY_ITEMS, depth + 1);
        for (const project of folderProjects) rows.push({ type: "project", item: project, depth: depth + 1 });
      }
    }
  }

  visit(folders, 0);
  for (const project of sortItems(projectMap.get(null) ?? [], sort)) {
    if (matches(project.name, normalizedQuery)) rows.push({ type: "project", item: project, depth: 0 });
  }
  return rows;
}

function findSearchableFolderIds(folders, projects, query) {
  const matchingProjectFolderIds = new Set(
    projects.filter((project) => matches(project.name, query)).map((project) => project.folder_id),
  );
  const included = new Set();

  function inspect(folder) {
    const childMatches = (folder.children ?? EMPTY_ITEMS).some(inspect);
    const doesMatch = matches(folder.name, query) || matchingProjectFolderIds.has(folder.id) || childMatches;
    if (doesMatch) included.add(folder.id);
    return doesMatch;
  }

  folders.forEach(inspect);
  return included;
}

function countFolderContents(folder, projectMap) {
  return (projectMap.get(folder.id)?.length ?? 0)
    + (folder.children ?? EMPTY_ITEMS).reduce((total, child) => total + 1 + countFolderContents(child, projectMap), 0);
}

function sortItems(items, sort) {
  return [...items].sort((a, b) => {
    if (sort === "name-asc") return a.name.localeCompare(b.name);
    if (sort === "name-desc") return b.name.localeCompare(a.name);
    return new Date(b.updated_at ?? 0) - new Date(a.updated_at ?? 0);
  });
}

function matches(name, query) {
  return !query || name.toLocaleLowerCase().includes(query);
}
