import { Suspense, lazy } from "react";
import { Navigate, Route, Routes } from "react-router-dom";

import ProtectedRoute from "./components/auth/ProtectedRoute";
import HomePage from "./pages/HomePage";
import LoginPage from "./pages/LoginPage";
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
          path="/project/:projectId"
          element={
            <ProtectedRoute>
              <ProjectPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/project/:projectId/overview"
          element={
            <ProtectedRoute>
              <ProjectOverviewPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/project/:projectId/assemble"
          element={
            <ProtectedRoute>
              <ProjectAssemblePage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/project/:projectId/issue-log"
          element={
            <ProtectedRoute>
              <ProjectIssueLogPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/project/:projectId/new-entry"
          element={
            <ProtectedRoute>
              <NewEntryPage />
            </ProtectedRoute>
          }
        />
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
