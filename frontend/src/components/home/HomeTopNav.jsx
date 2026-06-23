import { SignedIn, SignedOut, SignInButton, SignOutButton, UserButton } from "@clerk/clerk-react";
import { Link } from "react-router-dom";

import { AUTH_ROUTES } from "../../lib/clerkAppearance";
import { BrandIcon } from "./HomeIcons";

export default function HomeTopNav({ theme = "light" }) {
  const isDark = theme === "dark";

  return (
    <header
      className={`flex items-center justify-between border-b px-4 py-3 md:px-7 ${
        isDark ? "border-[#2b2c30] bg-[#141517]" : "border-[#b8b0a5] bg-[#efefef]"
      }`}
    >
      <Link to="/" className="flex min-w-0 items-center gap-2 transition-opacity hover:opacity-80">
        <BrandIcon className={`h-[22px] w-[22px] shrink-0 ${isDark ? "text-[#f1f1ee]" : "text-[#121212]"}`} />
        <span className={`text-3xl font-medium tracking-[-0.02em] md:text-[1.85rem] ${isDark ? "text-[#f1f1ee]" : "text-[#141414]"}`}>
          Screwceus
        </span>
      </Link>

      <nav className="flex items-center gap-2" aria-label="Account">
        <SignedOut>
          <SignInButton mode="modal" fallbackRedirectUrl={AUTH_ROUTES.afterSignIn}>
            <button
              type="button"
                className={`rounded-[6px] border px-3 py-1.5 text-sm transition-colors ${
                  isDark
                    ? "border-[#3b3d42] text-[#e5e5e2] hover:bg-[#24262a]"
                    : "border-[#6f6d6a] text-[#141414] hover:bg-[#e3dfd8]"
                }`}
            >
              Sign in
            </button>
          </SignInButton>
          <Link
            to={AUTH_ROUTES.signIn}
            className={`rounded-[6px] border px-3 py-1.5 text-sm transition-opacity hover:opacity-90 ${
              isDark
                ? "border-[#f1f1ee] bg-[#f1f1ee] text-[#17181a]"
                : "border-[#141414] bg-[#141414] text-[#efefef]"
            }`}
          >
            Login
          </Link>
        </SignedOut>

        <SignedIn>
          <UserButton
            showName
            signInUrl={AUTH_ROUTES.signIn}
            appearance={{
              elements: {
                userButtonBox: `gap-2 text-sm ${isDark ? "text-[#e5e5e2]" : "text-[#141414]"}`,
                userButtonOuterIdentifier: `font-normal ${isDark ? "text-[#e5e5e2]" : "text-[#141414]"}`,
              },
            }}
          />
          <SignOutButton redirectUrl={AUTH_ROUTES.afterSignOut}>
            <button
              type="button"
              className={`rounded-[6px] border px-3 py-1.5 text-sm transition-colors ${
                isDark
                  ? "border-[#3b3d42] text-[#e5e5e2] hover:bg-[#24262a]"
                  : "border-[#6f6d6a] text-[#141414] hover:bg-[#e3dfd8]"
              }`}
            >
              Sign out
            </button>
          </SignOutButton>
        </SignedIn>
      </nav>
    </header>
  );
}
