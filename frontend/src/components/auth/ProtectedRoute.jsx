import { OrganizationList, useAuth } from "@clerk/clerk-react";
import { Navigate, useLocation } from "react-router-dom";

import { AUTH_ROUTES } from "../../lib/clerkAppearance";

export default function ProtectedRoute({ children }) {
  const { isLoaded, isSignedIn, orgId } = useAuth();
  const location = useLocation();

  if (!isLoaded) {
    return <div className="min-h-screen bg-[#efefef]" aria-busy="true" />;
  }

  if (!isSignedIn) {
    const returnTo = `${location.pathname}${location.search}${location.hash}`;
    return <Navigate to={`${AUTH_ROUTES.signIn}?redirect_url=${encodeURIComponent(returnTo)}`} replace />;
  }

  if (!orgId) {
    return (
      <main className="organization-gate">
        <div className="organization-gate__copy">
          <span className="organization-gate__eyebrow">Screwceus workspace</span>
          <h1>Choose an organization</h1>
          <p>Your projects, inventory, and teams are isolated by the active Clerk organization.</p>
        </div>
        <OrganizationList
          hidePersonal
          afterCreateOrganizationUrl="/"
          afterSelectOrganizationUrl="/"
        />
      </main>
    );
  }

  return children;
}
