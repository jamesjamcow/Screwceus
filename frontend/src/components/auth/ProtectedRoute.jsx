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
      <main className="organization-gate min-h-screen grid items-center bg-[#0d0e10] text-[#f4f4f5] [&_h1]:mt-[1rem] [&_h1]:mr-0 [&_h1]:mb-0 [&_h1]:ml-0 [&_h1]:font-[520] [&_h1]:tracking-[-0.065em] [&_h1]:leading-[0.94] [&_p]:max-w-[31rem] [&_p]:mt-[1.5rem] [&_p]:mr-0 [&_p]:mb-0 [&_p]:ml-0 [&_p]:text-[#9c9da1] [&_p]:text-[1rem] [&_p]:leading-[1.65] [@media_(max-width:720px)]:grid-cols-1 [@media_(max-width:720px)]:content-center [@media_(max-width:720px)]:py-[2rem] [@media_(max-width:720px)]:px-[1.25rem]">
        <div className="organization-gate__copy max-w-[36rem]">
          <span className="organization-gate__eyebrow text-[#8b8d91] text-[0.72rem] font-[650] tracking-[0.14em] uppercase">Screwceus workspace</span>
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
