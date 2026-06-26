import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";

import {
  getDeleteFolderErrorMessage,
  getDeleteProjectErrorMessage,
  getUpdateProjectErrorMessage,
  useDeleteFolder,
  useDeleteProject,
  useUpdateProject,
} from "../../hooks/useDrive";
import { ChevronDownIcon, ChevronRightIcon, FolderIcon, NavIcon } from "./HomeIcons";
import { resolveApiAssetUrl } from "../../lib/axios";

const EMPTY_ITEMS = [];

const PROJECT_STATUS_TONE_CLASSES = {
  slate: "[&_i]:shadow-[0_0_0_3px_rgba(119,122,130,.12)]",
  blue: "[&_i]:bg-[#6884e8] [&_i]:shadow-[0_0_0_3px_rgba(104,132,232,.12)]",
  amber: "[&_i]:bg-[#c8934d] [&_i]:shadow-[0_0_0_3px_rgba(200,147,77,.12)]",
  green: "[&_i]:bg-[#5da578] [&_i]:shadow-[0_0_0_3px_rgba(93,165,120,.12)]",
};

export default function ProjectsTable({ folders = EMPTY_ITEMS, projects = EMPTY_ITEMS, onCreateFolder, onCreateProject }) {
  const [expandedFolders, setExpandedFolders] = useState(() => new Set());
  const [newMenuOpen, setNewMenuOpen] = useState(false);
  const [projectAction, setProjectAction] = useState(null);
  const [folderToDelete, setFolderToDelete] = useState(null);
  const controlsRef = useRef(null);
  const closeProjectAction = useCallback(() => setProjectAction(null), []);
  const closeFolderDelete = useCallback(() => setFolderToDelete(null), []);

  useEffect(() => {
    function closeMenus(event) {
      if (!controlsRef.current?.contains(event.target)) {
        setNewMenuOpen(false);
      }
    }

    function closeOnEscape(event) {
      if (event.key === "Escape") {
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
    () => buildRows(folders, projects, expandedFolders, "", "updated"),
    [expandedFolders, folders, projects],
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
    <section className="projects-database text-[var(--linear-text)] [@media_(max-width:720px)]:pt-[20px] [@media_(max-width:720px)]:pr-[14px] [@media_(max-width:720px)]:pb-[40px] [@media_(max-width:720px)]:pl-[14px]" aria-labelledby="projects-database-title">
      <div className="linear-table-toolbar projects-database__toolbar relative z-[4] min-h-[38px] flex items-center justify-between gap-[20px] pt-0 pr-0 pb-[12px] pl-0 [@media_(max-width:720px)]:items-start [@media_(max-width:720px)]:flex-col [@media_(max-width:720px)]:gap-[8px]">
        <div className="linear-view-tabs flex items-center gap-[6px] min-w-0" aria-label="Project views">
          <button type="button" className="linear-view-tab" aria-label="My projects"><NavIcon type="team" /><span>My projects</span></button>
          <button type="button" className="linear-view-tab is-active" aria-current="page"><NavIcon type="hourglass" /><span id="projects-database-title">Recently edited</span></button>
          <button type="button" className="linear-view-tab"><NavIcon type="table" /><span>All projects</span><small>{projects.length}</small></button>
          <button type="button" className="linear-view-tab"><NavIcon type="star" /><span>Starred</span></button>
        </div>

        <div className="projects-database__controls flex items-center gap-[2px] [@media_(max-width:720px)]:w-full [@media_(max-width:720px)]:[&_.projects-database__control-wrap:last-child]:ml-auto" ref={controlsRef}>
          <ToolbarIconButton label="Filter projects" icon="filter-lines" />
          <ToolbarIconButton label="Sort projects" icon="sort" />
          <ToolbarIconButton label="Quick actions" icon="lightning" />
          <ToolbarIconButton label="Search projects" icon="search" />
          <ToolbarIconButton label="View options" icon="sliders" />

          <div className="projects-database__control-wrap relative">
            <button
              type="button"
              className="linear-new-button projects-new-button flex items-center h-[28px] gap-[6px] border rounded-[5px] text-[12px] py-0 pr-[6px] pl-[10px] cursor-pointer ml-[5px] font-[590] [&_svg]:w-[14px] [&_svg]:h-[14px]"
              aria-expanded={newMenuOpen}
              aria-controls="project-new-menu"
              onClick={() => {
                setNewMenuOpen((open) => !open);
              }}
            >
              <span>New</span>
              <ChevronDownIcon />
            </button>
            {newMenuOpen ? (
              <div className="projects-popover absolute right-0 z-[20] border border-[#34353a] rounded-[7px] text-[#d9d9db] bg-[#1b1c1f] projects-new-menu w-[218px] p-[5px] [&_a]:w-full [&_a]:grid [&_a]:items-center [&_a]:gap-[9px] [&_a]:p-[8px] [&_a]:border-0 [&_a]:rounded-[5px] [&_a]:text-[#dcdcdf] [&_a]:bg-transparent [&_a]:text-left [&_a]:no-underline [&_a]:cursor-pointer [&_button]:w-full [&_button]:grid [&_button]:items-center [&_button]:gap-[9px] [&_button]:p-[8px] [&_button]:border-0 [&_button]:rounded-[5px] [&_button]:text-[#dcdcdf] [&_button]:bg-transparent [&_button]:text-left [&_button]:no-underline [&_button]:cursor-pointer [&_a:hover]:bg-[#28292d] [&_button:hover]:bg-[#28292d] [&_strong]:block [&_small]:block [&_strong]:text-[12px] [&_strong]:font-[570] [&_small]:mt-[2px] [&_small]:text-[#74767c] [&_small]:text-[10px]" id="project-new-menu">
                <button type="button" onClick={() => { setNewMenuOpen(false); onCreateProject(); }}>
                  <span className="projects-new-menu__icon w-[27px] h-[27px] grid place-items-center text-[#d2ad71] [&_svg]:w-[15px] [&_svg]:h-[15px] projects-new-menu__icon--project text-[#aeb3ef]"><NavIcon type="projects" /></span>
                  <span><strong>New project</strong><small>Create an empty project</small></span>
                </button>
                <button type="button" onClick={() => { setNewMenuOpen(false); onCreateFolder(); }}>
                  <span className="projects-new-menu__icon w-[27px] h-[27px] grid place-items-center text-[#d2ad71] [&_svg]:w-[15px] [&_svg]:h-[15px]"><FolderIcon /></span>
                  <span><strong>New folder</strong><small>Group related projects</small></span>
                </button>
              </div>
            ) : null}
          </div>
        </div>
      </div>

      <div className="projects-table-scroll overflow-x-auto rounded-[7px]">
        <div className="projects-table min-w-[1062px]" aria-label="All projects">
          <div className="projects-table__header grid items-center h-[35px] text-[#777980] bg-[#141517] select-none [&>span]:min-w-0 [&>span]:flex [&>span]:items-center [&>span]:gap-[7px] [&>span]:py-0 [&>span]:px-[11px] [&>span]:text-[11px] [&>span]:font-[400] [&_.is-numeric]:text-right [&_.is-numeric]:tabular-nums">
            <span>Name</span>
            <span>Health</span>
            <span>Priority</span>
            <span>Lead</span>
            <span>Target date</span>
            <span className="projects-table__issues">Issues</span>
            <span>Status</span>
            <span aria-hidden="true" />
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
                onDelete={() => setFolderToDelete({ folder: row.item, itemCount: row.itemCount })}
              />
            ) : (
              <ProjectRow
                key={`project-${row.item.id}`}
                project={row.item}
                depth={row.depth}
                onMove={() => setProjectAction({ project: row.item, mode: "move" })}
                onDelete={() => setProjectAction({ project: row.item, mode: "delete" })}
              />
            ))}
          </div>

          {!rows.length ? (
            <div className="projects-table__empty min-h-[290px] flex flex-col items-center justify-center p-[36px] text-[#777980] text-center [&_strong]:text-[#c9c9cc] [&_strong]:text-[13px] [&_strong]:font-[580] [&_p]:mt-[6px] [&_p]:mr-0 [&_p]:mb-0 [&_p]:ml-0 [&_p]:text-[#6e7076] [&_p]:text-[11px] [&_a]:mt-[14px] [&_a]:p-0 [&_a]:border-0 [&_a]:text-[#aab0ee] [&_a]:bg-transparent [&_a]:text-[11px] [&_a]:no-underline [&_a]:cursor-pointer [&_button]:mt-[14px] [&_button]:p-0 [&_button]:border-0 [&_button]:text-[#aab0ee] [&_button]:bg-transparent [&_button]:text-[11px] [&_button]:no-underline [&_button]:cursor-pointer [&_a:hover]:text-[#c4c8f5] [&_button:hover]:text-[#c4c8f5]">
              <span className="projects-table__empty-icon w-[38px] h-[38px] grid place-items-center mb-[13px] border border-[#303136] rounded-[9px] text-[#b08a57] bg-[#191a1d] [&_svg]:w-[20px] [&_svg]:h-[20px]"><FolderIcon /></span>
              <strong>No projects yet</strong>
              <p>Create a project or folder to start organizing your work.</p>
              <button type="button" onClick={onCreateProject}>Create your first project</button>
            </div>
          ) : null}
        </div>
      </div>

      {projectAction ? (
        <ProjectSettingsModal
          project={projectAction.project}
          folders={folders}
          initialMode={projectAction.mode}
          onClose={closeProjectAction}
        />
      ) : null}

      {folderToDelete ? (
        <FolderDeleteModal
          folder={folderToDelete.folder}
          itemCount={folderToDelete.itemCount}
          onClose={closeFolderDelete}
        />
      ) : null}
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

function FolderRow({ folder, depth, expanded, itemCount, onToggle, onDelete }) {
  return (
    <div className="projects-table__row-wrap relative [&:hover_.projects-table__row]:bg-[#191a1d] [&:focus-within_.projects-table__row]:bg-[#191a1d] [&:hover_.projects-table__actions]:opacity-100 [&:hover_.projects-table__actions]:pointer-events-auto [&:focus-within_.projects-table__actions]:opacity-100 [&:focus-within_.projects-table__actions]:pointer-events-auto">
      <button
        type="button"
        className={`projects-table__row grid items-center [&>span]:min-w-0 [&>span]:m-0 [&>span]:py-[7px] [&>span]:px-[11px] w-full min-h-[47px] p-0 border-0 text-[#a3a4a9] bg-transparent text-[12px] leading-normal text-left no-underline [&:hover]:bg-[#191a1d] [&_.is-numeric]:text-right [&_.is-numeric]:tabular-nums projects-table__row--folder cursor-pointer [&.is-expanded]:bg-[rgba(255,255,255,.016)]${expanded ? " is-expanded" : ""}`}
        aria-expanded={expanded}
        onClick={onToggle}
      >
        <span className="projects-table__name flex items-center gap-[8px] [&_strong]:min-w-0 [&_strong]:overflow-hidden [&_strong]:text-[#dddde0] [&_strong]:text-[12px] [&_strong]:font-[540] [&_strong]:tracking-[-0.008em] [&_strong]:leading-[1.42] [&_strong]:text-ellipsis [&_strong]:whitespace-nowrap [&_small]:min-w-[18px] [&_small]:h-[17px] [&_small]:inline-grid [&_small]:place-items-center [&_small]:py-0 [&_small]:px-[5px] [&_small]:rounded-[9px] [&_small]:text-[#66686e] [&_small]:bg-[#202125] [&_small]:text-[10px] [&_small]:tabular-nums" style={{ "--tree-indent": `${depth * 23}px` }}>
          <span className="projects-table__disclosure w-[14px] h-[20px] grid place-items-center text-[#777980] [&_svg]:w-[13px] [&_svg]:h-[13px]">
            {expanded ? <ChevronDownIcon /> : <ChevronRightIcon />}
          </span>
          <span className="projects-table__folder-icon w-[24px] h-[24px] grid place-items-center text-[#c69a5e] [&_svg]:w-[14px] [&_svg]:h-[14px]"><FolderIcon /></span>
          <strong>{folder.name}</strong>
          <small>{itemCount}</small>
        </span>
        <span className="projects-table__muted text-[#65676d]">Folder</span>
        <span className="projects-table__muted text-[#65676d]" />
        <span className="projects-table__muted text-[#65676d]" />
        <span className="projects-table__muted text-[#65676d]" />
        <span className="projects-table__muted text-[#65676d] is-numeric" />
        <span className="projects-table__muted text-[#65676d]" />
        <span aria-hidden="true" />
      </button>
      <RowActions>
        <RowActionButton label={`Delete folder ${folder.name}`} icon="trash" tone="danger" onClick={onDelete} />
      </RowActions>
    </div>
  );
}

function ProjectRow({ project, depth, onMove, onDelete }) {
  const status = getProjectStatus(project.status);
  return (
    <div className="projects-table__row-wrap relative [&:hover_.projects-table__row]:bg-[#191a1d] [&:focus-within_.projects-table__row]:bg-[#191a1d] [&:hover_.projects-table__actions]:opacity-100 [&:hover_.projects-table__actions]:pointer-events-auto [&:focus-within_.projects-table__actions]:opacity-100 [&:focus-within_.projects-table__actions]:pointer-events-auto">
      <Link className="projects-table__row grid items-center [&>span]:min-w-0 [&>span]:m-0 [&>span]:py-[7px] [&>span]:px-[11px] w-full min-h-[47px] p-0 border-0 text-[#a3a4a9] bg-transparent text-[12px] leading-normal text-left no-underline [&:hover]:bg-[#191a1d] [&_.is-numeric]:text-right [&_.is-numeric]:tabular-nums projects-table__row--project" to={`/project/${project.id}/overview`}>
        <span className="projects-table__name flex items-center gap-[8px] [&_strong]:min-w-0 [&_strong]:overflow-hidden [&_strong]:text-[#dddde0] [&_strong]:text-[12px] [&_strong]:font-[540] [&_strong]:tracking-[-0.008em] [&_strong]:leading-[1.42] [&_strong]:text-ellipsis [&_strong]:whitespace-nowrap [&_small]:min-w-[18px] [&_small]:h-[17px] [&_small]:inline-grid [&_small]:place-items-center [&_small]:py-0 [&_small]:px-[5px] [&_small]:rounded-[9px] [&_small]:text-[#66686e] [&_small]:bg-[#202125] [&_small]:text-[10px] [&_small]:tabular-nums" style={{ "--tree-indent": `${depth * 23}px` }}>
          <span className="projects-table__project-spacer w-[14px]" />
          <span className={`projects-table__project-icon w-[24px] h-[24px] grid place-items-center text-[#a7ace7] [&_svg]:w-[14px] [&_svg]:h-[14px] [&.has-cover]:overflow-hidden [&.has-cover_img]:w-full [&.has-cover_img]:h-full [&.has-cover_img]:block [&.has-cover_img]:object-cover${project.cover_image_url ? " has-cover" : ""}`}>
            {project.cover_image_url
              ? <img src={resolveApiAssetUrl(project.cover_image_url)} alt="" />
              : <NavIcon type="projects" />}
          </span>
          <strong>{project.name}</strong>
        </span>
        <span className="projects-table__health flex items-center gap-[7px] whitespace-nowrap [&_i]:w-[14px] [&_i]:h-[14px] [&_i]:border [&_i]:border-dashed [&_i]:border-[#4e5056] [&_i]:rounded-full"><i />No updates</span>
        <span className="projects-table__muted text-[#65676d]">—</span>
        <span className="projects-table__lead flex items-center gap-[7px] whitespace-nowrap [&>span]:w-[17px] [&>span]:h-[17px] [&>span]:grid [&>span]:place-items-center [&>span]:border [&>span]:border-dashed [&>span]:border-[#55575d] [&>span]:rounded-full [&>span]:text-[#66686e] [&>span]:text-[9px]"><span>?</span>No lead</span>
        <span className="projects-table__target flex items-center gap-[7px] whitespace-nowrap [&_svg]:w-[15px] [&_svg]:h-[15px] [&_svg]:text-[#6f7177]"><NavIcon type="calendar" />{formatDueDate(project.due_date)}</span>
        <span className="projects-table__issues is-numeric">0</span>
        <span className={`projects-table__status flex items-center gap-[7px] whitespace-nowrap [&_i]:w-[14px] [&_i]:h-[14px] [&_i]:rounded-full [&_i]:bg-[#777a82] ${PROJECT_STATUS_TONE_CLASSES[status.tone] ?? ""}`}><i />{status.label}</span>
        <span aria-hidden="true" />
      </Link>
      <RowActions>
        <RowActionButton label={`Move project ${project.name}`} icon="folder-move" onClick={onMove} />
        <RowActionButton label={`Delete project ${project.name}`} icon="trash" tone="danger" onClick={onDelete} />
      </RowActions>
    </div>
  );
}

function RowActions({ children }) {
  return (
    <div className="projects-table__actions absolute top-[50%] right-[7px] flex items-center gap-[4px] opacity-0 pointer-events-none [@media_(max-width:720px)]:opacity-100 [@media_(max-width:720px)]:pointer-events-auto">
      {children}
    </div>
  );
}

function RowActionButton({ label, icon, tone = "neutral", onClick }) {
  return (
    <button
      type="button"
      className={`projects-table__action-button w-[28px] h-[28px] grid place-items-center p-0 border border-[#3a3c42] rounded-[6px] text-[#9b9da4] bg-[#222327] cursor-pointer [&:hover]:border-[#525661] [&:hover]:text-[#d9d9dc] [&:hover]:bg-[#2a2b30] [&_svg]:w-[14px] [&_svg]:h-[14px]${tone === "danger" ? " is-danger" : ""}`}
      aria-label={label}
      title={label}
      onClick={(event) => {
        event.preventDefault();
        event.stopPropagation();
        onClick();
      }}
    >
      <NavIcon type={icon} />
    </button>
  );
}

function ProjectSettingsModal({ project, folders, initialMode = "move", onClose }) {
  const updateMutation = useUpdateProject();
  const deleteMutation = useDeleteProject();
  const dialogRef = useRef(null);
  const folderSelectRef = useRef(null);
  const [name, setName] = useState(project.name);
  const [folderId, setFolderId] = useState(String(project.folder_id ?? ""));
  const [deleteArmed, setDeleteArmed] = useState(initialMode === "delete");
  const [validationError, setValidationError] = useState("");
  const folderOptions = useMemo(() => flattenFolders(folders), [folders]);
  const isWorking = updateMutation.isPending || deleteMutation.isPending;
  const trimmedName = name.trim();
  const isDirty = trimmedName !== project.name || folderId !== String(project.folder_id ?? "");

  useDialogBehavior(dialogRef, onClose, isWorking);

  useEffect(() => {
    if (initialMode === "move") {
      window.setTimeout(() => folderSelectRef.current?.focus(), 0);
    }
  }, [initialMode]);

  async function saveProject(event) {
    event.preventDefault();
    if (!trimmedName) {
      setValidationError("Project name is required.");
      return;
    }
    if (trimmedName.length > 255) {
      setValidationError("Use 255 characters or fewer.");
      return;
    }

    setValidationError("");
    try {
      await updateMutation.mutateAsync({
        projectId: project.id,
        name: trimmedName,
        folderId: folderId ? Number(folderId) : null,
      });
      onClose();
    } catch {
      // The request error is rendered below the fields.
    }
  }

  async function deleteProject() {
    try {
      await deleteMutation.mutateAsync(project.id);
      onClose();
    } catch {
      // The request error is rendered in the destructive action area.
    }
  }

  const requestError = updateMutation.error
    ? getUpdateProjectErrorMessage(updateMutation.error)
    : deleteMutation.error
      ? getDeleteProjectErrorMessage(deleteMutation.error)
      : "";

  return (
    <div
      className="project-settings-backdrop fixed inset-0 z-[400] grid place-items-center p-[24px] overflow-y-auto [@media_(max-width:720px)]:items-end [@media_(max-width:720px)]:p-[10px]"
      onMouseDown={(event) => {
        if (!isWorking && event.target === event.currentTarget) onClose();
      }}
    >
      <section
        ref={dialogRef}
        className="project-settings-dialog overflow-hidden border border-[#373940] rounded-[10px] text-[#dedee1] bg-[#17181b] [&_button:disabled]:opacity-[.55] [&_button:disabled]:cursor-not-allowed [&_input:disabled]:opacity-[.55] [&_input:disabled]:cursor-not-allowed [&_select:disabled]:opacity-[.55] [&_select:disabled]:cursor-not-allowed [@media_(max-width:720px)]:overflow-y-auto"
        role="dialog"
        aria-modal="true"
        aria-labelledby="project-settings-title"
      >
        <header className="project-settings-dialog__header min-h-[76px] grid items-center gap-[11px] py-0 px-[17px] border-b border-b-[#2a2c31] [&_span]:block [&_span]:m-0 [&_h2]:block [&_h2]:m-0 [&_div>span]:mb-[3px] [&_div>span]:text-[#777a82] [&_div>span]:text-[10px] [&_div>span]:font-[650] [&_div>span]:tracking-[.055em] [&_div>span]:uppercase [&_h2]:overflow-hidden [&_h2]:text-[#e7e7e9] [&_h2]:text-[14px] [&_h2]:font-[610] [&_h2]:tracking-[-.01em] [&_h2]:text-ellipsis [&_h2]:whitespace-nowrap [&>button]:w-[28px] [&>button]:h-[28px] [&>button]:pt-0 [&>button]:pr-0 [&>button]:pb-[2px] [&>button]:pl-0 [&>button]:border [&>button]:border-transparent [&>button]:rounded-[6px] [&>button]:text-[#7d7f86] [&>button]:bg-transparent [&>button]:text-[19px] [&>button]:cursor-pointer [&>button:hover]:border-[#36383e] [&>button:hover]:text-[#d1d1d4] [&>button:hover]:bg-[#242529]">
          <span className="project-settings-dialog__mark w-[35px] h-[35px] grid place-items-center border border-[#3d4049] rounded-[8px] text-[#aeb4f3] bg-[#23252b] [&_svg]:w-[17px] [&_svg]:h-[17px]"><NavIcon type="settings" /></span>
          <div>
            <span>Project settings</span>
            <h2 id="project-settings-title">{project.name}</h2>
          </div>
          <button type="button" aria-label="Close project settings" onClick={onClose} disabled={isWorking}>×</button>
        </header>

        <form className="project-settings-form grid gap-[18px] pt-[22px] pr-[22px] pb-[18px] pl-[22px]" onSubmit={saveProject} noValidate>
          <label className="project-settings-field grid gap-[7px] [&>span]:text-[#a7a8ad] [&>span]:text-[11px] [&>span]:font-[590] [&>small]:text-[#65676e] [&>small]:text-[10px]">
            <span>Project name</span>
            <div className="project-settings-input h-[38px] grid items-center gap-[8px] py-0 px-[11px] border border-[#3a3c42] rounded-[7px] bg-[#111214] [&:focus-within]:border-[#6872d4] [&>svg]:w-[16px] [&>svg]:h-[16px] [&>svg]:text-[#787b83] [&_input]:w-full [&_input]:min-w-0 [&_input]:h-full [&_input]:p-0 [&_input]:border-0 [&_input]:outline-0 [&_input]:text-[#e5e5e7] [&_input]:bg-transparent [&_input]:text-[12px]">
              <NavIcon type="projects" />
              <input
                type="text"
                value={name}
                autoFocus
                disabled={isWorking}
                aria-invalid={Boolean(validationError)}
                onChange={(event) => {
                  setName(event.target.value);
                  setValidationError("");
                }}
              />
            </div>
          </label>

          <label className="project-settings-field grid gap-[7px] [&>span]:text-[#a7a8ad] [&>span]:text-[11px] [&>span]:font-[590] [&>small]:text-[#65676e] [&>small]:text-[10px]">
            <span>Folder</span>
            <div className="project-settings-select h-[38px] grid items-center gap-[8px] py-0 px-[11px] border border-[#3a3c42] rounded-[7px] bg-[#111214] [&:focus-within]:border-[#6872d4] [&>svg]:w-[16px] [&>svg]:h-[16px] [&>svg]:text-[#787b83] [&>svg:first-child]:text-[#bc925b] [&_select]:w-full [&_select]:min-w-0 [&_select]:h-full [&_select]:p-0 [&_select]:border-0 [&_select]:outline-0 [&_select]:text-[#e5e5e7] [&_select]:bg-transparent [&_select]:text-[12px] [&_select]:appearance-none [&_select]:cursor-pointer [&_select_option]:text-[#dddde0] [&_select_option]:bg-[#1a1b1e]">
              <FolderIcon />
              <select ref={folderSelectRef} value={folderId} disabled={isWorking} onChange={(event) => setFolderId(event.target.value)}>
                <option value="">No folder · Workspace root</option>
                {folderOptions.map((folder) => <option key={folder.id} value={folder.id}>{folder.label}</option>)}
              </select>
              <NavIcon type="chevron-down" />
            </div>
            <small>Move this project without changing its contents.</small>
          </label>

          {validationError || requestError ? (
            <div className="project-settings-error mt-[-7px] py-[9px] px-[10px] border border-[#5d373c] rounded-[6px] text-[#e1a1a7] bg-[#291719] text-[11px]" role="alert">{validationError || requestError}</div>
          ) : null}

          <div className="project-settings-form__actions flex justify-end gap-[8px] pt-[1px]">
            <button type="button" className="create-button h-[32px] inline-flex items-center justify-center gap-[7px] py-0 px-[12px] border border-transparent rounded-[6px] cursor-pointer [&:disabled]:opacity-[.52] [&:disabled]:cursor-not-allowed create-button--secondary border-[#383a3f] text-[#a9aaae] bg-[#1d1e21] [&:hover]:text-[#dfdfe1] [&:hover]:bg-[#242529]" onClick={onClose} disabled={isWorking}>Cancel</button>
            <button type="submit" className="create-button h-[32px] inline-flex items-center justify-center gap-[7px] py-0 px-[12px] border border-transparent rounded-[6px] cursor-pointer [&:disabled]:opacity-[.52] [&:disabled]:cursor-not-allowed create-button--primary border-[#747dd8] text-[#fff] bg-[#5e6ad2] [&:hover]:bg-[#6a75dc]" disabled={isWorking || !isDirty || !trimmedName}>
              {updateMutation.isPending ? <><span className="create-spinner w-[11px] h-[11px] border-[1.5px] border-solid border-[rgba(255,255,255,.34)] border-t-[#fff] rounded-full" />Saving…</> : "Save changes"}
            </button>
          </div>
        </form>

        <section className={`project-settings-danger min-h-[82px] grid items-center gap-[11px] mt-0 mr-[12px] mb-[12px] ml-[12px] py-[12px] px-[10px] border border-[#332d30] rounded-[8px] bg-[#141416] [&.is-armed]:border-[#63393e] [&.is-armed]:bg-[#211416] [&_strong]:block [&_strong]:m-0 [&_p]:block [&_p]:m-0 [&_strong]:text-[#c9c9cc] [&_strong]:text-[11px] [&_strong]:font-[610] [&_p]:mt-[4px] [&_p]:text-[#696b72] [&_p]:text-[10px] [&_p]:leading-[1.45] [&>button]:min-h-[29px] [&>button]:py-0 [&>button]:px-[10px] [&>button]:border [&>button]:border-[#3a3b40] [&>button]:rounded-[6px] [&>button]:text-[#9b9ca1] [&>button]:bg-[#1c1d20] [&>button]:text-[10px] [&>button]:font-[580] [&>button]:whitespace-nowrap [&>button]:cursor-pointer [&>button:hover]:text-[#d2d2d5] [&>button:hover]:bg-[#242529] [@media_(max-width:720px)]:[&>button]:justify-self-start${deleteArmed ? " is-armed" : ""}`}>
          <span className="project-settings-danger__icon w-[30px] h-[30px] grid place-items-center border border-[#483238] rounded-[7px] text-[#c77d84] bg-[#25171a] [&_svg]:w-[15px] [&_svg]:h-[15px]"><NavIcon type="trash" /></span>
          <div>
            <strong>{deleteArmed ? `Delete “${project.name}”?` : "Delete project"}</strong>
            <p>{deleteArmed ? "This permanently removes the project and its linked issues. This action cannot be undone." : "Permanently remove this project from the workspace."}</p>
          </div>
          {deleteArmed ? (
            <div className="project-settings-danger__actions [&_button]:min-h-[29px] [&_button]:py-0 [&_button]:px-[10px] [&_button]:border [&_button]:border-[#3a3b40] [&_button]:rounded-[6px] [&_button]:text-[#9b9ca1] [&_button]:bg-[#1c1d20] [&_button]:text-[10px] [&_button]:font-[580] [&_button]:whitespace-nowrap [&_button]:cursor-pointer [&_button:hover]:text-[#d2d2d5] [&_button:hover]:bg-[#242529] flex gap-[6px] [&_button.is-danger]:border-[#914c54] [&_button.is-danger]:text-[#fff2f3] [&_button.is-danger]:bg-[#8c4149] [&_button.is-danger:hover]:border-[#a85b64] [&_button.is-danger:hover]:bg-[#9b4b54] [@media_(max-width:720px)]:justify-self-start [@media_(max-width:720px)]:flex-wrap">
              <button type="button" onClick={() => setDeleteArmed(false)} disabled={isWorking}>Keep project</button>
              <button type="button" className="is-danger" onClick={deleteProject} disabled={isWorking}>
                {deleteMutation.isPending ? "Deleting…" : "Delete permanently"}
              </button>
            </div>
          ) : (
            <button type="button" onClick={() => setDeleteArmed(true)} disabled={isWorking}>Delete…</button>
          )}
        </section>
      </section>
    </div>
  );
}

function FolderDeleteModal({ folder, itemCount, onClose }) {
  const deleteMutation = useDeleteFolder();
  const dialogRef = useRef(null);
  const [deleteArmed, setDeleteArmed] = useState(false);
  const isWorking = deleteMutation.isPending;

  useDialogBehavior(dialogRef, onClose, isWorking);

  async function deleteFolder() {
    try {
      await deleteMutation.mutateAsync(folder.id);
      onClose();
    } catch {
      // The request error is rendered in the destructive action area.
    }
  }

  const requestError = deleteMutation.error ? getDeleteFolderErrorMessage(deleteMutation.error) : "";

  return (
    <div
      className="project-settings-backdrop fixed inset-0 z-[400] grid place-items-center p-[24px] overflow-y-auto [@media_(max-width:720px)]:items-end [@media_(max-width:720px)]:p-[10px]"
      onMouseDown={(event) => {
        if (!isWorking && event.target === event.currentTarget) onClose();
      }}
    >
      <section
        ref={dialogRef}
        className="project-settings-dialog overflow-hidden border border-[#373940] rounded-[10px] text-[#dedee1] bg-[#17181b] [&_button:disabled]:opacity-[.55] [&_button:disabled]:cursor-not-allowed [@media_(max-width:720px)]:overflow-y-auto"
        role="dialog"
        aria-modal="true"
        aria-labelledby="folder-delete-title"
      >
        <header className="project-settings-dialog__header min-h-[76px] grid items-center gap-[11px] py-0 px-[17px] border-b border-b-[#2a2c31] [&_span]:block [&_span]:m-0 [&_h2]:block [&_h2]:m-0 [&_div>span]:mb-[3px] [&_div>span]:text-[#777a82] [&_div>span]:text-[10px] [&_div>span]:font-[650] [&_div>span]:tracking-[.055em] [&_div>span]:uppercase [&_h2]:overflow-hidden [&_h2]:text-[#e7e7e9] [&_h2]:text-[14px] [&_h2]:font-[610] [&_h2]:tracking-[-.01em] [&_h2]:text-ellipsis [&_h2]:whitespace-nowrap [&>button]:w-[28px] [&>button]:h-[28px] [&>button]:pt-0 [&>button]:pr-0 [&>button]:pb-[2px] [&>button]:pl-0 [&>button]:border [&>button]:border-transparent [&>button]:rounded-[6px] [&>button]:text-[#7d7f86] [&>button]:bg-transparent [&>button]:text-[19px] [&>button]:cursor-pointer [&>button:hover]:border-[#36383e] [&>button:hover]:text-[#d1d1d4] [&>button:hover]:bg-[#242529]">
          <span className="project-settings-dialog__mark w-[35px] h-[35px] grid place-items-center border border-[#3d4049] rounded-[8px] text-[#c69a5e] bg-[#23252b] [&_svg]:w-[17px] [&_svg]:h-[17px]"><FolderIcon /></span>
          <div>
            <span>Folder delete</span>
            <h2 id="folder-delete-title">{folder.name}</h2>
          </div>
          <button type="button" aria-label="Close folder delete" onClick={onClose} disabled={isWorking}>×</button>
        </header>

        <div className="project-settings-form grid gap-[13px] pt-[20px] pr-[22px] pb-[18px] pl-[22px] [&_p]:m-0 [&_p]:text-[#8d8f96] [&_p]:text-[12px] [&_p]:leading-[1.55]">
          <p>
            Deleting a folder removes the folder and any empty subfolders. Projects inside the folder tree must be moved or deleted first.
          </p>
          <p className="text-[#696b72]">This folder currently contains {itemCount} {itemCount === 1 ? "item" : "items"}.</p>

          {requestError ? (
            <div className="project-settings-error py-[9px] px-[10px] border border-[#5d373c] rounded-[6px] text-[#e1a1a7] bg-[#291719] text-[11px]" role="alert">{requestError}</div>
          ) : null}
        </div>

        <section className={`project-settings-danger min-h-[82px] grid items-center gap-[11px] mt-0 mr-[12px] mb-[12px] ml-[12px] py-[12px] px-[10px] border border-[#332d30] rounded-[8px] bg-[#141416] [&.is-armed]:border-[#63393e] [&.is-armed]:bg-[#211416] [&_strong]:block [&_strong]:m-0 [&_p]:block [&_p]:m-0 [&_strong]:text-[#c9c9cc] [&_strong]:text-[11px] [&_strong]:font-[610] [&_p]:mt-[4px] [&_p]:text-[#696b72] [&_p]:text-[10px] [&_p]:leading-[1.45] [&>button]:min-h-[29px] [&>button]:py-0 [&>button]:px-[10px] [&>button]:border [&>button]:border-[#3a3b40] [&>button]:rounded-[6px] [&>button]:text-[#9b9ca1] [&>button]:bg-[#1c1d20] [&>button]:text-[10px] [&>button]:font-[580] [&>button]:whitespace-nowrap [&>button]:cursor-pointer [&>button:hover]:text-[#d2d2d5] [&>button:hover]:bg-[#242529] [@media_(max-width:720px)]:[&>button]:justify-self-start${deleteArmed ? " is-armed" : ""}`}>
          <span className="project-settings-danger__icon w-[30px] h-[30px] grid place-items-center border border-[#483238] rounded-[7px] text-[#c77d84] bg-[#25171a] [&_svg]:w-[15px] [&_svg]:h-[15px]"><NavIcon type="trash" /></span>
          <div>
            <strong>{deleteArmed ? `Delete "${folder.name}"?` : "Delete folder"}</strong>
            <p>{deleteArmed ? "This action cannot be undone." : "Confirm before removing this folder from the workspace."}</p>
          </div>
          {deleteArmed ? (
            <div className="project-settings-danger__actions [&_button]:min-h-[29px] [&_button]:py-0 [&_button]:px-[10px] [&_button]:border [&_button]:border-[#3a3b40] [&_button]:rounded-[6px] [&_button]:text-[#9b9ca1] [&_button]:bg-[#1c1d20] [&_button]:text-[10px] [&_button]:font-[580] [&_button]:whitespace-nowrap [&_button]:cursor-pointer [&_button:hover]:text-[#d2d2d5] [&_button:hover]:bg-[#242529] flex gap-[6px] [&_button.is-danger]:border-[#914c54] [&_button.is-danger]:text-[#fff2f3] [&_button.is-danger]:bg-[#8c4149] [&_button.is-danger:hover]:border-[#a85b64] [&_button.is-danger:hover]:bg-[#9b4b54] [@media_(max-width:720px)]:justify-self-start [@media_(max-width:720px)]:flex-wrap">
              <button type="button" onClick={() => setDeleteArmed(false)} disabled={isWorking}>Keep folder</button>
              <button type="button" className="is-danger" onClick={deleteFolder} disabled={isWorking}>
                {deleteMutation.isPending ? "Deleting..." : "Delete folder"}
              </button>
            </div>
          ) : (
            <button type="button" onClick={() => setDeleteArmed(true)} disabled={isWorking}>Delete...</button>
          )}
        </section>
      </section>
    </div>
  );
}

function flattenFolders(folders, depth = 0, result = []) {
  for (const folder of folders ?? EMPTY_ITEMS) {
    result.push({ id: folder.id, label: `${"— ".repeat(depth)}${folder.name}` });
    flattenFolders(folder.children, depth + 1, result);
  }
  return result;
}

function useDialogBehavior(dialogRef, onClose, disabled) {
  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    const previouslyFocused = document.activeElement;
    document.body.style.overflow = "hidden";

    function onKeyDown(event) {
      if (event.key === "Escape" && !disabled) onClose();
      if (event.key !== "Tab") return;

      const focusable = dialogRef.current?.querySelectorAll(
        'button:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])',
      );
      if (!focusable?.length) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }

    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", onKeyDown);
      previouslyFocused?.focus?.();
    };
  }, [dialogRef, disabled, onClose]);
}

function getProjectStatus(status) {
  return {
    planned: { label: "Planned", tone: "slate" },
    in_progress: { label: "Active", tone: "blue" },
    on_hold: { label: "On hold", tone: "amber" },
    completed: { label: "Done", tone: "green" },
  }[status] ?? { label: "Planned", tone: "slate" };
}

function formatDueDate(value) {
  if (!value) return "No target";
  const date = new Date(`${value}T00:00:00`);
  return new Intl.DateTimeFormat(undefined, { month: "short", day: "numeric" }).format(date);
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
