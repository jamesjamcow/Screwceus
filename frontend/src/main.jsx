import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";

import App from "./App";
import ClerkProviderWithRouter from "./components/auth/ClerkProviderWithRouter";
import "./index.css";

const clerkPubKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;

if (!clerkPubKey) {
  console.warn("Missing VITE_CLERK_PUBLISHABLE_KEY. Auth UI will not work until it is set.");
}

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <BrowserRouter>
      <ClerkProviderWithRouter publishableKey={clerkPubKey || ""}>
        <App />
      </ClerkProviderWithRouter>
    </BrowserRouter>
  </React.StrictMode>
);
