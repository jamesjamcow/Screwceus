import { useOutletContext, useParams } from "react-router-dom";

import HomeTopNav from "../components/home/HomeTopNav";
import IssuesDatabase from "../components/issues/IssuesDatabase";
import ProjectMiniNav from "../components/project/ProjectMiniNav";

export default function ProjectIssueLogPage() {
  const { projectId } = useParams();
  const { project } = useOutletContext();

  return (
    <div className="issues-page">
      <HomeTopNav theme="dark" />

      <main className="issues-page__main">
        <header className="issues-project-header">
          <div>
            <p className="issues-project-header__eyebrow">Project workspace</p>
            <h1><span>SpaceX / </span>{project.name}</h1>
          </div>
        </header>

        <ProjectMiniNav active="issue-log" projectId={projectId} theme="dark" />

        <IssuesDatabase key={`project-${projectId}`} />
      </main>
    </div>
  );
}
