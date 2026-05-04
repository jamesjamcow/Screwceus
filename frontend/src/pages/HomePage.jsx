import { useEffect, useState } from "react";

import { api } from "../lib/api";

export default function HomePage() {
  const [status, setStatus] = useState("Checking API...");

  useEffect(() => {
    async function run() {
      try {
        await api.get("/v1/photos/");
        setStatus("API reachable (auth may still be required).");
      } catch {
        setStatus("API not reachable yet. Start backend on port 8000.");
      }
    }
    run();
  }, []);

  return (
    <section className="hero">
      <h2>Photo + 3D workspace</h2>
      <p>Stack initialized with React, Router, Zustand, Clerk, Axios, R3F, and Konva.</p>
      <p className="status">{status}</p>
    </section>
  );
}
