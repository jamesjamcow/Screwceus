import { Suspense, lazy } from "react";
import { Navigate, Route, Routes } from "react-router-dom";

import ProtectedRoute from "./components/auth/ProtectedRoute";
import ProjectRouteGuard from "./components/project/ProjectRouteGuard";
import HomePage from "./pages/HomePage";
import LoginPage from "./pages/LoginPage";
import NotFoundPage from "./pages/NotFoundPage";

const NewEntryPage = lazy(() => import("./pages/NewEntryPage"));
const NewProjectPage = lazy(() => import("./pages/NewProjectPage"));
const ProjectPage = lazy(() => import("./pages/ProjectPage"));
const ProjectAssemblePage = lazy(() => import("./pages/ProjectAssemblePage"));
const ProjectIssueLogPage = lazy(() => import("./pages/ProjectIssueLogPage"));
const ProjectOverviewPage = lazy(() => import("./pages/ProjectOverviewPage"));

function App() {
  return (
    <Suspense fallback={<RouteLoadingFallback />}>
      <Routes>
        <Route path="/login/*" element={<LoginPage />} />
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <HomePage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/projects/new"
          element={
            <ProtectedRoute>
              <NewProjectPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/project/:projectId"
          element={
            <ProtectedRoute>
              <ProjectRouteGuard />
            </ProtectedRoute>
          }
        >
          <Route index element={<ProjectPage />} />
          <Route path="overview" element={<ProjectOverviewPage />} />
          <Route path="assemble" element={<ProjectAssemblePage />} />
          <Route path="issue-log" element={<ProjectIssueLogPage />} />
          <Route path="new-entry" element={<NewEntryPage />} />
        </Route>
        <Route path="/home" element={<Navigate to="/" replace />} />
        <Route path="/sign-in/*" element={<Navigate to="/login" replace />} />
        <Route
          path="*"
          element={
            <ProtectedRoute>
              <NotFoundPage />
            </ProtectedRoute>
          }
        />
      </Routes>
    </Suspense>
  );
}

function RouteLoadingFallback() {
  return <div className="min-h-screen bg-[#efefef]" aria-busy="true" />;
}

export default App;
