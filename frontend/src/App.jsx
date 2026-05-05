import { Suspense, lazy } from "react";
import { Navigate, Route, Routes } from "react-router-dom";

import HomePage from "./pages/HomePage";
import NotFoundPage from "./pages/NotFoundPage";

const NewEntryPage = lazy(() => import("./pages/NewEntryPage"));
const ProjectPage = lazy(() => import("./pages/ProjectPage"));
const ProjectAssemblePage = lazy(() => import("./pages/ProjectAssemblePage"));
const ProjectIssueLogPage = lazy(() => import("./pages/ProjectIssueLogPage"));
const ProjectOverviewPage = lazy(() => import("./pages/ProjectOverviewPage"));

function App() {
  return (
    <Suspense fallback={<RouteLoadingFallback />}>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/project/:projectId" element={<ProjectPage />} />
        <Route path="/project/:projectId/overview" element={<ProjectOverviewPage />} />
        <Route path="/project/:projectId/assemble" element={<ProjectAssemblePage />} />
        <Route path="/project/:projectId/issue-log" element={<ProjectIssueLogPage />} />
        <Route path="/project/:projectId/new-entry" element={<NewEntryPage />} />
        <Route path="/home" element={<Navigate to="/" replace />} />
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </Suspense>
  );
}

function RouteLoadingFallback() {
  return <div className="min-h-screen bg-[#efefef]" aria-busy="true" />;
}

export default App;
