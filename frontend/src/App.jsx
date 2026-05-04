import { Link, Navigate, Route, Routes } from "react-router-dom";

import EditorPage from "./pages/EditorPage";
import HomePage from "./pages/HomePage";
import NotFoundPage from "./pages/NotFoundPage";

function App() {
  return (
    <div className="layout">
      <header className="topbar">
        <h1>Screwceus</h1>
        <nav>
          <Link to="/">Home</Link>
          <Link to="/editor">Editor</Link>
        </nav>
      </header>

      <main>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/editor" element={<EditorPage />} />
          <Route path="/home" element={<Navigate to="/" replace />} />
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </main>
    </div>
  );
}

export default App;
