import { SignIn, useAuth } from "@clerk/clerk-react";
import { Navigate, useLocation } from "react-router-dom";

import { BrandIcon } from "../components/home/HomeIcons";
import HomeTopNav from "../components/home/HomeTopNav";
import { AUTH_ROUTES, clerkAppearance, getSafeRedirectPath } from "../lib/clerkAppearance";

export default function LoginPage() {
  const { isLoaded, isSignedIn } = useAuth();
  const location = useLocation();
  const redirectPath = getSafeRedirectPath(location.search);

  if (isLoaded && isSignedIn) {
    return <Navigate to={redirectPath} replace />;
  }

  return (
    <div className="min-h-screen bg-[#efefef] text-[#141414]">
      <HomeTopNav />

      <main className="auth-page mx-auto grid min-h-[calc(100vh-65px)] w-full max-w-[1080px] items-center gap-8 px-5 py-10 md:grid-cols-[0.9fr_1fr] md:px-7">
        <section className="max-w-[430px]">
          <div className="mb-5 inline-flex h-12 w-12 items-center justify-center rounded-[8px] border border-[#b8b0a5] bg-[#f7f4ee]">
            <BrandIcon className="h-7 w-7 text-[#141414]" />
          </div>
          <h1 className="text-[2.35rem] font-semibold leading-none md:text-[3rem]">Screwceus</h1>
          <p className="mt-4 max-w-[34rem] text-[1.05rem] leading-6 text-[#5f584d]">
            Sign in to manage project files, part records, drawings, and assembly notes.
          </p>
        </section>

        <section className="flex justify-start md:justify-end">
          <SignIn
            routing="path"
            path={AUTH_ROUTES.signIn}
            signUpUrl={AUTH_ROUTES.signUp}
            fallbackRedirectUrl={redirectPath}
            appearance={clerkAppearance}
          />
        </section>
      </main>
    </div>
  );
}
