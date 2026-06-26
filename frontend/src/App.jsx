import { Suspense, lazy } from "react";
import { Navigate, Route, Routes, useLocation } from "react-router-dom";

import ProtectedRoute from "./components/auth/ProtectedRoute";
import ProjectRouteGuard from "./components/project/ProjectRouteGuard";
import CommandPaletteProvider from "./components/search/CommandPaletteProvider";
import HomePage from "./pages/HomePage";
import LoginPage from "./pages/LoginPage";
import NotFoundPage from "./pages/NotFoundPage";

const NewEntryPage = lazy(() => import("./pages/NewEntryPage"));
const ProjectPage = lazy(() => import("./pages/ProjectPage"));
const ProjectAssemblePage = lazy(() => import("./pages/ProjectAssemblePage"));
const ProjectLabelingPage = lazy(() => import("./pages/ProjectLabelingPage"));
const ProjectOverviewPage = lazy(() => import("./pages/ProjectOverviewPage"));

function App() {
  return (
    <CommandPaletteProvider>
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
            path="/folders/new"
            element={
              <ProtectedRoute>
                <LegacyCreateRedirect type="folder" />
              </ProtectedRoute>
            }
          />
          <Route
            path="/projects/new"
            element={
              <ProtectedRoute>
                <LegacyCreateRedirect type="project" />
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
            <Route path="labeling" element={<ProjectLabelingPage />} />
            <Route path="assemble" element={<ProjectAssemblePage />} />
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
    </CommandPaletteProvider>
  );
}

function LegacyCreateRedirect({ type }) {
  const location = useLocation();
  const source = new URLSearchParams(location.search);
  const target = new URLSearchParams({ view: "projects", create: type });
  if (source.get("folder")) target.set("folder", source.get("folder"));
  return <Navigate to={`/?${target.toString()}`} replace />;
}

function RouteLoadingFallback() {
  return <div className="min-h-screen bg-[#101113]" aria-busy="true" />;
}

export default App;
