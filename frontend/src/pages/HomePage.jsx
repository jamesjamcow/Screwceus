import { useOrganization } from "@clerk/clerk-react";
import { useNavigate, useSearchParams } from "react-router-dom";

import { EmptyStateIcon, NavIcon } from "../components/home/HomeIcons";
import HomeSidebar from "../components/home/HomeSidebar";
import IssuesDatabase from "../components/issues/IssuesDatabase";
import { createTeamIssues } from "../components/issues/issueData";
import ProjectsTable from "../components/home/ProjectsTable";
import { getDriveErrorMessage, useWorkspaceHome } from "../hooks/useDrive";

const EMPTY_ITEMS = [];

const VIEW_TITLES = {
  inbox: "Inbox",
  "my-issues": "My issues",
  projects: "Projects",
  inventory: "Inventory",
  more: "More",
};

export default function HomePage() {
  const navigate = useNavigate();
  const { organization } = useOrganization();
  const [searchParams, setSearchParams] = useSearchParams();
  const workspaceQuery = useWorkspaceHome();
  const activeView = searchParams.get("view") || "projects";
  const activeTeamId = searchParams.get("team");

  const projects = workspaceQuery.data?.projects ?? EMPTY_ITEMS;
  const parts = workspaceQuery.data?.parts ?? EMPTY_ITEMS;
  const teams = workspaceQuery.data?.teams ?? EMPTY_ITEMS;
  const folders = workspaceQuery.data?.folders ?? EMPTY_ITEMS;
  const currentTeam = teams.find((team) => String(team.id) === String(activeTeamId));
  const error = workspaceQuery.error ? getDriveErrorMessage(workspaceQuery.error) : "";

  function selectView(view, teamId = null) {
    if (view === "new-project") {
      navigate("/projects/new");
      return;
    }

    const next = new URLSearchParams();
    next.set("view", view);
    if (teamId) next.set("team", String(teamId));
    setSearchParams(next);
  }

  const title = currentTeam && activeView.startsWith("team")
    ? currentTeam.name
    : VIEW_TITLES[activeView] || "Workspace";

  return (
    <div className="linear-shell">
      <HomeSidebar
        activeView={activeView}
        activeTeamId={activeTeamId}
        onSelect={selectView}
        teams={teams}
      />

      <main className="linear-main">
        <header className="linear-main__header">
          <div>
            <span className="linear-main__workspace">{organization?.name}</span>
            <h1>{title}</h1>
          </div>
          <button
            type="button"
            className="linear-header-action"
            aria-label="Create project"
            onClick={() => navigate("/projects/new")}
          >
            <NavIcon type="plus" />
          </button>
        </header>

        {error ? <div className="linear-error">{error}</div> : null}

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
            />
          )}
        </div>
      </main>
    </div>
  );
}

function ViewContent({ view, currentTeam, projects, folders, parts }) {
  if (view === "projects" || view === "team-projects") {
    return <ProjectsView projects={projects} folders={folders} />;
  }

  if (view === "inventory" || view === "team-inventory") {
    return <InventoryView parts={parts} currentTeam={currentTeam} />;
  }

  if (view === "team-issues") {
    return <TeamIssuesView currentTeam={currentTeam} />;
  }

  if (view === "team") {
    return (
      <EmptyPanel
        icon="team"
        title={currentTeam ? `${currentTeam.name} is ready` : "Team overview"}
        copy="Team projects and inventory stay inside the active organization workspace."
      />
    );
  }

  if (view === "inbox") {
    return <EmptyPanel icon="inbox" title="Inbox zero" copy="Updates and assignments for this organization will appear here." />;
  }

  if (view === "my-issues") {
    return <EmptyPanel icon="issues" title="No issues assigned" copy="Issues assigned to you in this organization will appear here." />;
  }

  return <EmptyPanel icon="more" title="Workspace tools" copy="Additional organization settings and workflows will live here." />;
}

function TeamIssuesView({ currentTeam }) {
  if (!currentTeam) {
    return <EmptyPanel icon="issues" title="Select a team" copy="Choose a team to open its issue register." />;
  }

  return (
    <div className="team-issues-view">
      <IssuesDatabase
        key={currentTeam.id}
        initialIssues={createTeamIssues(currentTeam)}
        title={`${currentTeam.name} issues`}
        subtitle={`${currentTeam.key} team · Grouped by status`}
      />
    </div>
  );
}

function ProjectsView({ projects, folders }) {
  return <ProjectsTable projects={projects} folders={folders} />;
}

function InventoryView({ parts, currentTeam }) {
  return (
    <section className="linear-content-section">
      <div className="linear-tabs">
        <button type="button" className="is-active">Parts</button>
        <button type="button">Types</button>
        <button type="button" className="linear-filter-button" aria-label="Filter inventory"><NavIcon type="filter" /></button>
      </div>
      {parts.length ? (
        <div className="linear-list">
          {parts.map((part) => (
            <div className="linear-project-row" key={part.id}>
              <span className="linear-project-row__icon"><NavIcon type="inventory" /></span>
              <span className="linear-project-row__body"><strong>{part.name}</strong><small>{part.type}</small></span>
              <span className="linear-project-row__meta">{part.notes || "Available"}</span>
            </div>
          ))}
        </div>
      ) : (
        <EmptyPanel
          icon="inventory"
          title={currentTeam ? `No ${currentTeam.name} inventory yet` : "Inventory is empty"}
          copy="Parts created in this organization will appear here."
        />
      )}
    </section>
  );
}

function EmptyPanel({ icon, title, copy }) {
  return (
    <div className="linear-empty-state">
      <EmptyStateIcon type={icon} />
      <h2>{title}</h2>
      <p>{copy}</p>
    </div>
  );
}

function LoadingState() {
  return (
    <div className="linear-loading" aria-busy="true" aria-label="Loading workspace">
      <span /><span /><span />
    </div>
  );
}
