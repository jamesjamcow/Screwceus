import React from "react";
import ReactDOM from "react-dom/client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter } from "react-router-dom";

import App from "./App";
import ClerkProviderWithRouter from "./components/auth/ClerkProviderWithRouter";
import "./index.css";

const clerkPubKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

if (!clerkPubKey) {
  console.warn("Missing VITE_CLERK_PUBLISHABLE_KEY. Auth UI will not work until it is set.");
}

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <ClerkProviderWithRouter publishableKey={clerkPubKey || ""}>
          <App />
        </ClerkProviderWithRouter>
      </BrowserRouter>
    </QueryClientProvider>
  </React.StrictMode>
);
