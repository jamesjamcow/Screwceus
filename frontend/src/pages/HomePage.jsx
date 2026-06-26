import { useOrganization, useUser } from "@clerk/clerk-react";
import { useCallback } from "react";
import { useSearchParams } from "react-router-dom";

import { CreateFolderModal, CreatePartModal, CreateProjectModal } from "../components/home/CreateModals";
import { EmptyStateIcon, NavIcon } from "../components/home/HomeIcons";
import HomeSidebar from "../components/home/HomeSidebar";
import IssuesDatabase from "../components/issues/IssuesDatabase";
import ProjectsTable from "../components/home/ProjectsTable";
import InventoryDatabase from "../components/inventory/InventoryDatabase";
import TeamOverview from "../components/team/TeamOverview";
import CreateTeamPage from "../components/team/CreateTeamPage";
import {
  getDriveErrorMessage,
  getTeamIssuesErrorMessage,
  useCreateTeamIssue,
  useDeleteTeam,
  useTeamIssues,
  useUpdateTeamIssue,
  useWorkspaceHome,
} from "../hooks/useDrive";

const EMPTY_ITEMS = [];

const VIEW_TITLES = {
  issues: "Issues",
  projects: "Projects",
  inventory: "Inventory",
};

const LEGACY_VIEW_REDIRECTS = {
  inbox: "projects",
  "my-issues": "issues",
  more: "projects",
};

export default function HomePage() {
  const { organization } = useOrganization();
  const { user } = useUser();
  const [searchParams, setSearchParams] = useSearchParams();
  const requestedView = searchParams.get("view") || "projects";
  const activeView = LEGACY_VIEW_REDIRECTS[requestedView] || requestedView;
  const activeTeamId = searchParams.get("team");
  const workspaceQuery = useWorkspaceHome(activeTeamId);
  const deleteTeam = useDeleteTeam();
  const createModal = searchParams.get("create");
  const initialFolderId = searchParams.get("folder") || "";

  const projects = workspaceQuery.data?.projects ?? EMPTY_ITEMS;
  const parts = workspaceQuery.data?.parts ?? EMPTY_ITEMS;
  const teams = workspaceQuery.data?.teams ?? EMPTY_ITEMS;
  const folders = workspaceQuery.data?.folders ?? EMPTY_ITEMS;
  const parsedActiveTeamId = Number(activeTeamId);
  const storageTeamId = workspaceQuery.data?.storageTeamId
    ?? (Number.isSafeInteger(parsedActiveTeamId) && parsedActiveTeamId > 0 ? parsedActiveTeamId : null);
  const currentTeam = teams.find((team) => String(team.id) === String(activeTeamId));
  const error = workspaceQuery.error ? getDriveErrorMessage(workspaceQuery.error) : "";

  function selectView(view, teamId = null) {
    if (view === "new-project") {
      openCreateModal("project");
      return;
    }

    const next = new URLSearchParams();
    next.set("view", view);
    if (teamId) next.set("team", String(teamId));
    setSearchParams(next);
  }

  function openCreateModal(type) {
    const next = new URLSearchParams(searchParams);
    next.set("view", type === "part"
      ? (activeView === "team-inventory" ? "team-inventory" : "inventory")
      : (activeTeamId ? "team-projects" : "projects"));
    next.set("create", type);
    setSearchParams(next, { replace: false });
  }

  async function handleDeleteTeam(team) {
    await deleteTeam.mutateAsync(team.id);
    if (String(activeTeamId) === String(team.id)) {
      selectView("projects");
    }
  }

  const closeCreateModal = useCallback(() => {
    setSearchParams((current) => {
      const next = new URLSearchParams(current);
      next.delete("create");
      return next;
    }, { replace: true });
  }, [setSearchParams]);

  const title = currentTeam && activeView.startsWith("team")
    ? currentTeam.name
    : VIEW_TITLES[activeView] || "Workspace";
  const isTeamOverview = activeView === "team" && currentTeam;
  const isTeamCreation = activeView === "create-team";
  const isInventory = activeView === "inventory" || activeView === "team-inventory";
  const isProjects = activeView === "projects" || activeView === "team-projects";
  const isTeamIssues = activeView === "team-issues";

  return (
    <div className="home-shell linear-shell min-h-screen grid overflow-hidden bg-[var(--linear-bg)] text-[var(--linear-text)] text-[13px]">
      <HomeSidebar
        activeView={activeView}
        activeTeamId={activeTeamId}
        teams={teams}
        onSelect={selectView}
        onDeleteTeam={handleDeleteTeam}
        deletingTeamId={deleteTeam.isPending ? deleteTeam.variables : null}
      />

      <main className="linear-main min-w-0 min-h-screen bg-[var(--linear-bg)]">
        {!isTeamOverview && !isTeamCreation && !isInventory && !isProjects && !isTeamIssues ? (
          <header className="linear-main__header h-[61px] flex items-center justify-between pt-[9px] pr-[28px] pb-0 pl-[19px] border-b border-b-[var(--linear-border-soft)] [&_h1]:mt-[1px] [&_h1]:mr-0 [&_h1]:mb-0 [&_h1]:ml-0 [&_h1]:text-[#e2e2e4] [&_h1]:text-[14px] [&_h1]:font-[600] [&_h1]:tracking-[-0.01em] [@media_(max-width:720px)]:pt-0">
            <div>
              <span className="linear-main__workspace hidden text-[var(--linear-faint)] text-[10px] uppercase tracking-[.08em] [@media_(max-width:720px)]:block">{organization?.name}</span>
              <h1>{title}</h1>
            </div>
            <button
              type="button"
              className="linear-header-action inline-grid place-items-center border-0 text-[#9a9ba0] bg-transparent cursor-pointer [&:hover]:text-[#fff] [&:hover]:bg-[#26272b] w-[27px] h-[27px] rounded-[5px] [&_svg]:w-[15px] [&_svg]:h-[15px]"
              aria-label="Create project"
              onClick={() => openCreateModal("project")}
            >
              <NavIcon type="plus" />
            </button>
          </header>
        ) : null}

        {error ? <div className="linear-error my-[16px] mx-[var(--linear-content-gutter)] py-[10px] px-[12px] border border-[#633f43] rounded-[6px] text-[#ddb1b5] bg-[#28191b]">{error}</div> : null}

        <div className="linear-view">
          {workspaceQuery.isPending ? (
            <LoadingState />
          ) : (
            <ViewContent
              view={activeView}
              currentTeam={currentTeam}
              projects={projects}
              folders={folders}
              parts={parts}
              user={user}
              onSelect={selectView}
              onCreateProject={() => openCreateModal("project")}
              onCreateFolder={() => openCreateModal("folder")}
              onCreatePart={() => openCreateModal("part")}
              onTeamCreated={(team) => selectView("team", team.id)}
            />
          )}
        </div>
      </main>

      {createModal === "project" ? <CreateProjectModal teamId={storageTeamId} folders={folders} initialFolderId={initialFolderId} onClose={closeCreateModal} /> : null}
      {createModal === "folder" ? <CreateFolderModal teamId={storageTeamId} folders={folders} initialFolderId={initialFolderId} onClose={closeCreateModal} /> : null}
      {createModal === "part" ? <CreatePartModal onClose={closeCreateModal} /> : null}
    </div>
  );
}

function ViewContent({ view, currentTeam, projects, folders, parts, user, onSelect, onCreateFolder, onCreatePart, onCreateProject, onTeamCreated }) {
  if (view === "create-team") {
    return <CreateTeamPage onCancel={() => onSelect("projects")} onTeamCreated={onTeamCreated} />;
  }

  if (view === "projects" || view === "team-projects") {
    return <ProjectsView projects={projects} folders={folders} onCreateFolder={onCreateFolder} onCreateProject={onCreateProject} />;
  }

  if (view === "inventory" || view === "team-inventory") {
    return <InventoryDatabase parts={parts} currentTeam={currentTeam} userId={user?.id} onCreatePart={onCreatePart} />;
  }

  if (view === "team-issues") {
    return <TeamIssuesView currentTeam={currentTeam} />;
  }

  if (view === "team") {
    return currentTeam ? (
      <TeamOverview
        key={currentTeam.id}
        team={currentTeam}
        user={user}
        onSelect={onSelect}
      />
    ) : (
      <EmptyPanel icon="team" title="Team not found" copy="Choose a team from the workspace navigation." />
    );
  }

  if (view === "issues") {
    return <EmptyPanel icon="issues" title="No issues assigned" copy="Issues assigned to you in this organization will appear here." />;
  }

  return <EmptyPanel icon="more" title="Workspace tools" copy="Additional organization settings and workflows will live here." />;
}

function TeamIssuesView({ currentTeam }) {
  const teamId = currentTeam?.id;
  const issuesQuery = useTeamIssues(teamId);
  const createIssue = useCreateTeamIssue(teamId);
  const updateIssue = useUpdateTeamIssue(teamId);

  if (!currentTeam) {
    return <EmptyPanel icon="issues" title="Select a team" copy="Choose a team to open its issue register." />;
  }

  return (
    <div className="team-issues-view [&_*]:box-border [&_*::before]:box-border [&_*::after]:box-border [&_button]:cursor-pointer [&_select]:cursor-pointer [&_svg]:block [&_svg]:fill-none [&_svg]:stroke-current p-0 text-[var(--issues-text)] bg-transparent [&_.issues-database]:mt-0 [@media_(max-width:620px)]:min-h-0 [@media_(max-width:620px)]:p-0 [@media_(max-width:620px)]:[&_.issues-database]:min-h-0 [@media_(max-width:620px)]:[&_.issues-database]:pt-[20px] [@media_(max-width:620px)]:[&_.issues-database]:pr-[14px] [@media_(max-width:620px)]:[&_.issues-database]:pb-[40px] [@media_(max-width:620px)]:[&_.issues-database]:pl-[14px]">
      <IssuesDatabase
        key={currentTeam.id}
        issues={issuesQuery.data ?? EMPTY_ITEMS}
        title="All issues"
        isLoading={issuesQuery.isPending}
        error={issuesQuery.error ? getTeamIssuesErrorMessage(issuesQuery.error) : ""}
        onRetry={() => issuesQuery.refetch()}
        onCreateIssue={(issue) => createIssue.mutateAsync(issue)}
        onUpdateIssue={(issueId, issue) => updateIssue.mutateAsync({ issueId, issue })}
      />
    </div>
  );
}

function ProjectsView({ projects, folders, onCreateFolder, onCreateProject }) {
  return <ProjectsTable projects={projects} folders={folders} onCreateFolder={onCreateFolder} onCreateProject={onCreateProject} />;
}

function EmptyPanel({ icon, title, copy }) {
  return (
    <div className="linear-empty-state flex flex-col items-center justify-center text-center [&_h2]:mt-[24px] [&_h2]:mr-0 [&_h2]:mb-0 [&_h2]:ml-0 [&_h2]:text-[#e4e4e6] [&_h2]:text-[15px] [&_h2]:font-[620] [&_h2]:tracking-[-0.01em] [&_p]:max-w-[340px] [&_p]:mt-[9px] [&_p]:mr-0 [&_p]:mb-0 [&_p]:ml-0 [&_p]:text-[#828389] [&_p]:text-[13px] [&_p]:leading-[1.55] [&>button]:h-[30px] [&>button]:mt-[18px] [&>button]:py-0 [&>button]:px-[13px] [&>button]:border [&>button]:border-[#7177d9] [&>button]:rounded-[6px] [&>button]:text-[#fff] [&>button]:bg-[var(--linear-accent)] [&>button]:font-[570] [&>button]:cursor-pointer [&>button:hover]:bg-[#6873dc]">
      <EmptyStateIcon type={icon} />
      <h2>{title}</h2>
      <p>{copy}</p>
    </div>
  );
}

function LoadingState() {
  return (
    <div className="linear-loading flex items-center justify-center gap-[5px] [&_span]:w-[5px] [&_span]:h-[5px] [&_span]:rounded-full [&_span]:bg-[#77797e]" aria-busy="true" aria-label="Loading workspace">
      <span /><span /><span />
    </div>
  );
}
