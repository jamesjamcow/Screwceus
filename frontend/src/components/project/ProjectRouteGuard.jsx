import { Outlet, useParams } from "react-router-dom";

import { getProjectErrorMessage, normalizeProjectId, useProject } from "../../hooks/useDrive";
import ProjectRouteError from "./ProjectRouteError";

export default function ProjectRouteGuard() {
  const { projectId } = useParams();
  const normalizedProjectId = normalizeProjectId(projectId);
  const projectQuery = useProject(projectId);

  if (!normalizedProjectId || projectQuery.error?.response?.status === 404) {
    return <ProjectRouteError />;
  }

  if (projectQuery.isPending) {
    return <ProjectRouteLoading />;
  }

  if (projectQuery.isError) {
    return (
      <ProjectRouteError
        title="Could not load project"
        message={getProjectErrorMessage(projectQuery.error)}
        onRetry={() => projectQuery.refetch()}
      />
    );
  }

  return <Outlet context={{ project: projectQuery.data }} />;
}

function ProjectRouteLoading() {
  return <div className="min-h-screen bg-[#efefef]" aria-busy="true" aria-label="Loading project" />;
}
