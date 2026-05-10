import { useAuth } from "@clerk/clerk-react";
import { Navigate, useLocation } from "react-router-dom";

import { AUTH_ROUTES } from "../../lib/clerkAppearance";

export default function ProtectedRoute({ children }) {
  const { isLoaded, isSignedIn } = useAuth();
  const location = useLocation();

  if (!isLoaded) {
    return <div className="min-h-screen bg-[#efefef]" aria-busy="true" />;
  }

  if (!isSignedIn) {
    const returnTo = `${location.pathname}${location.search}${location.hash}`;
    return <Navigate to={`${AUTH_ROUTES.signIn}?redirect_url=${encodeURIComponent(returnTo)}`} replace />;
  }

  return children;
}
