import { useMemo } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";

import { ChevronRightIcon, FolderIcon } from "../components/home/HomeIcons";
import HomeSidebar from "../components/home/HomeSidebar";
import HomeTopNav from "../components/home/HomeTopNav";
import {
  getCreateFolderErrorMessage,
  getCreateProjectErrorMessage,
  getDriveErrorMessage,
  useCreateFolder,
  useCreateProject,
  useDriveContents,
} from "../hooks/useDrive";

const EMPTY_ITEMS = [];

function getFolderSearchParam(searchParams) {
  const rawFolderId = searchParams.get("folder");
  if (!rawFolderId) return null;

  const parsedFolderId = Number(rawFolderId);
  return Number.isInteger(parsedFolderId) && parsedFolderId > 0 ? parsedFolderId : null;
}

function getFolderPath(tree, folderId) {
  if (!folderId) return [];

  const visit = (nodes, trail) => {
    for (const node of nodes) {
      const nextTrail = [...trail, node];
      if (node.id === folderId) {
        return nextTrail;
      }

      const result = visit(node.children ?? [], nextTrail);
      if (result.length) {
        return result;
      }
    }

    return [];
  };

  return visit(tree, []);
}

function formatUpdatedAt(value) {
  if (!value) return "";

  return new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(value));
}

export default function HomePage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const currentFolderId = getFolderSearchParam(searchParams);
  const driveQuery = useDriveContents(currentFolderId);
  const createFolderMutation = useCreateFolder();
  const createProjectMutation = useCreateProject();

  const folders = driveQuery.data?.folders ?? EMPTY_ITEMS;
  const projects = driveQuery.data?.projects ?? EMPTY_ITEMS;
  const folderTree = driveQuery.data?.folderTree ?? EMPTY_ITEMS;

  const folderPath = useMemo(() => getFolderPath(folderTree, currentFolderId), [folderTree, currentFolderId]);
  const error =
    (driveQuery.error && getDriveErrorMessage(driveQuery.error)) ||
    (createFolderMutation.error && getCreateFolderErrorMessage(createFolderMutation.error)) ||
    (createProjectMutation.error && getCreateProjectErrorMessage(createProjectMutation.error)) ||
    "";

  function openFolder(folderId) {
    setSearchParams({ folder: String(folderId) });
  }

  function openRoot() {
    setSearchParams({});
  }

  async function handleNewFolder() {
    const name = window.prompt("Folder name");
    if (!name?.trim()) return;

    try {
      await createFolderMutation.mutateAsync({ name: name.trim(), parentId: currentFolderId });
    } catch {
      // The mutation error is rendered from TanStack Query state.
    }
  }

  async function handleNewProject() {
    const name = window.prompt("Project file name");
    if (!name?.trim()) return;

    try {
      const project = await createProjectMutation.mutateAsync({ name: name.trim(), folderId: currentFolderId });
      navigate(`/project/${project.id}`);
    } catch {
      // The mutation error is rendered from TanStack Query state.
    }
  }

  const hasContents = folders.length > 0 || projects.length > 0;
  const isLoading = driveQuery.isLoading || driveQuery.isFetching;

  return (
    <div className="min-h-screen bg-[#efefef] text-[#141414]">
      <HomeTopNav />

      <div className="grid min-h-[calc(100vh-65px)] grid-cols-1 md:grid-cols-[240px_1fr]">
        <HomeSidebar onNewFolder={handleNewFolder} onNewProject={handleNewProject} />

        <section className="px-4 py-7 md:px-6">
          <div className="flex flex-wrap items-center gap-1 text-[1.35rem] leading-none text-[#141414] md:text-[1.8rem]">
            <button type="button" className="transition-opacity hover:opacity-70" onClick={openRoot}>
              Folders
            </button>
            {folderPath.map((folder) => (
              <div key={folder.id} className="inline-flex items-center gap-1">
                <ChevronRightIcon className="h-4 w-4 md:h-5 md:w-5" />
                <button type="button" className="transition-opacity hover:opacity-70" onClick={() => openFolder(folder.id)}>
                  {folder.name}
                </button>
              </div>
            ))}
          </div>

          <div className="mt-1 w-full max-w-[1040px] border-b border-[#b8b0a5]" />

          {error && (
            <div className="mt-5 max-w-[1040px] rounded-[7px] border border-[#b16858] bg-[#f4dfd9] px-3 py-2 text-sm text-[#5f2118]">
              {error}
            </div>
          )}

          <div className="mt-8 grid w-full max-w-[1040px] grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {folders.map((folder) => (
              <button
                key={folder.id}
                type="button"
                onClick={() => openFolder(folder.id)}
                className="flex h-[92px] items-start gap-3 rounded-[7px] border border-[#c6bdb1] bg-[#f7f4ee] p-3 text-left transition-colors hover:bg-[#ebe5dc]"
              >
                <FolderIcon className="mt-0.5 h-6 w-6 shrink-0 text-[#7d6e5f]" />
                <span className="min-w-0 break-words text-[1rem] font-medium leading-snug">{folder.name}</span>
              </button>
            ))}
          </div>

          <h2 className="mb-3 mt-12 text-[1.4rem] font-medium text-[#141414] md:text-[2rem]">Files</h2>

          <div className="grid w-full max-w-[1040px] grid-cols-2 gap-x-3 gap-y-2 border-b border-[#b8b0a5] px-2 pb-2 text-sm text-[#171717] md:grid-cols-[1.6fr_0.28fr_0.65fr_0.65fr] md:gap-6 md:text-[0.98rem]">
            <span>Named</span>
            <span>Time</span>
            <span>Modified By</span>
            <span>Owned By</span>
          </div>

          <div className="w-full max-w-[1040px]">
            {projects.map((project) => (
              <Link
                key={project.id}
                to={`/project/${project.id}`}
                className="grid min-h-[46px] grid-cols-2 items-center gap-x-3 gap-y-1 border-b border-[#d2cbc2] px-2 py-2 text-sm transition-colors hover:bg-[#e8e3dc] md:grid-cols-[1.6fr_0.28fr_0.65fr_0.65fr] md:gap-6 md:text-[0.98rem]"
              >
                <span className="inline-flex min-w-0 items-center gap-2">
                  <ProjectFileIcon className="h-4 w-4 shrink-0 text-[#6f6d6a]" />
                  <span className="truncate">{project.name}</span>
                </span>
                <span>{formatUpdatedAt(project.updated_at)}</span>
                <span className="truncate">Me</span>
                <span className="truncate">Me</span>
              </Link>
            ))}
          </div>

          {!isLoading && !error && !hasContents && (
            <div className="mt-10 max-w-[1040px] rounded-[7px] border border-dashed border-[#b8b0a5] px-5 py-8 text-center text-[#5f584d]">
              This folder is empty.
            </div>
          )}

          {isLoading && (
            <div className="mt-10 max-w-[1040px] rounded-[7px] border border-[#d2cbc2] px-5 py-8 text-center text-[#5f584d]">
              Loading...
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

function ProjectFileIcon({ className = "" }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className={className}>
      <path
        d="M6 3.5h8.2L18 7.3v13.2H6zM14 3.8V8h4"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.55"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
