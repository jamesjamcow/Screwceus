import { useMemo } from "react";
import { Outlet, useNavigate } from "react-router-dom";

import HomeSidebar from "../home/HomeSidebar";
import { NavIcon } from "../home/HomeIcons";
import { useDeleteTeam, useWorkspaceHome } from "../../hooks/useDrive";
import ProjectMiniNav from "./ProjectMiniNav";

const EMPTY_TEAMS = [];

export default function ProjectWorkspaceShell({ project }) {
  const navigate = useNavigate();
  const projectTeamId = project?.team_id ? String(project.team_id) : null;
  const workspaceQuery = useWorkspaceHome(projectTeamId);
  const deleteTeam = useDeleteTeam();

  const teams = workspaceQuery.data?.teams ?? EMPTY_TEAMS;
  const currentTeam = useMemo(
    () => teams.find((team) => String(team.id) === projectTeamId),
    [projectTeamId, teams],
  );
  const isGeneralProject = !projectTeamId || currentTeam?.key === "GENERAL";
  const sidebarActiveView = isGeneralProject ? "projects" : "team-projects";
  const sidebarActiveTeamId = isGeneralProject ? null : projectTeamId;
  const projectsPath = projectTeamId && currentTeam?.key !== "GENERAL"
    ? `/?view=team-projects&team=${encodeURIComponent(projectTeamId)}`
    : "/?view=projects";

  function selectWorkspaceView(view, teamId = null) {
    const next = new URLSearchParams();
    next.set("view", view);
    if (teamId) next.set("team", String(teamId));
    navigate(`/?${next.toString()}`);
  }

  async function handleDeleteTeam(team) {
    await deleteTeam.mutateAsync(team.id);
    if (String(projectTeamId) === String(team.id)) {
      navigate("/?view=projects");
    }
  }

  return (
    <div className="linear-shell min-h-screen grid overflow-hidden bg-[var(--linear-bg)] text-[var(--linear-text)] text-[13px] [@media_(max-width:720px)]:block [@media_(max-width:720px)]:overflow-auto project-workspace [&_.part-card]:text-[#d7d7da]">
      <HomeSidebar
        activeView={sidebarActiveView}
        activeTeamId={sidebarActiveTeamId}
        teams={teams}
        onSelect={selectWorkspaceView}
        onDeleteTeam={handleDeleteTeam}
        deletingTeamId={deleteTeam.isPending ? deleteTeam.variables : null}
      />

      <main className="linear-main min-w-0 min-h-screen bg-[var(--linear-bg)] project-workspace__main h-screen min-h-0 flex flex-col overflow-hidden [@media_(max-width:720px)]:h-auto [@media_(max-width:720px)]:min-h-screen [@media_(max-width:720px)]:overflow-visible">
        <header className="project-workspace__header min-h-[118px] flex-none pt-[22px] pr-[32px] pb-0 pl-[32px] border-b border-b-[var(--linear-border-soft)] [@media_(max-width:720px)]:sticky [@media_(max-width:720px)]:top-0 [@media_(max-width:720px)]:z-[20] [@media_(max-width:720px)]:px-[18px] [@media_(max-width:720px)]:pt-[18px]">
          <div className="project-workspace__identity h-[38px] flex items-center gap-[10px] min-w-0 text-[#75777c] text-[14px] [&_button]:h-[32px] [&_button]:inline-flex [&_button]:items-center [&_button]:gap-[8px] [&_button]:py-0 [&_button]:px-[10px] [&_button]:border-0 [&_button]:rounded-[5px] [&_button]:text-[#8d8f94] [&_button]:bg-transparent [&_button]:cursor-pointer [&_button:hover]:text-[#e7e7e9] [&_button:hover]:bg-[#202124] [&_button_svg]:w-[15px] [&_button_svg]:h-[15px]">
            <button type="button" onClick={() => navigate(projectsPath)}>
              <NavIcon type="projects" />
              <span>Projects</span>
            </button>
            <span className="project-workspace__separator text-[#414349]">/</span>
            <span className="project-workspace__project-name overflow-hidden text-[#dddde0] font-[560] text-ellipsis whitespace-nowrap">{project.name}</span>
          </div>

          <ProjectMiniNav projectId={project.id} />
        </header>

        <div className="project-workspace__view min-h-0 flex-1 overflow-auto [@media_(max-width:720px)]:overflow-visible">
          <Outlet key={project.id} context={{ project }} />
        </div>
      </main>
    </div>
  );
}
