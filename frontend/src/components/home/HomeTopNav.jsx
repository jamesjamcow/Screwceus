import { SignedIn, SignedOut, SignInButton, SignOutButton, UserButton } from "@clerk/clerk-react";
import { Link } from "react-router-dom";

import { AUTH_ROUTES } from "../../lib/clerkAppearance";
import { BrandIcon } from "./HomeIcons";

export default function HomeTopNav() {
  return (
    <header className="flex items-center justify-between border-b border-[#b8b0a5] bg-[#efefef] px-4 py-3 md:px-7">
      <Link to="/" className="flex min-w-0 items-center gap-2 transition-opacity hover:opacity-80">
        <BrandIcon className="h-[22px] w-[22px] shrink-0 text-[#121212]" />
        <span className="text-3xl font-medium tracking-[-0.02em] text-[#141414] md:text-[1.85rem]">
          Screwceus
        </span>
      </Link>

      <nav className="flex items-center gap-2" aria-label="Account">
        <SignedOut>
          <SignInButton mode="modal" fallbackRedirectUrl={AUTH_ROUTES.afterSignIn}>
            <button
              type="button"
              className="rounded-[6px] border border-[#6f6d6a] px-3 py-1.5 text-sm text-[#141414] transition-colors hover:bg-[#e3dfd8]"
            >
              Sign in
            </button>
          </SignInButton>
          <Link
            to={AUTH_ROUTES.signIn}
            className="rounded-[6px] border border-[#141414] bg-[#141414] px-3 py-1.5 text-sm text-[#efefef] transition-opacity hover:opacity-90"
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
                userButtonBox: "gap-2 text-sm text-[#141414]",
                userButtonOuterIdentifier: "font-normal text-[#141414]",
              },
            }}
          />
          <SignOutButton redirectUrl={AUTH_ROUTES.afterSignOut}>
            <button
              type="button"
              className="rounded-[6px] border border-[#6f6d6a] px-3 py-1.5 text-sm text-[#141414] transition-colors hover:bg-[#e3dfd8]"
            >
              Sign out
            </button>
          </SignOutButton>
        </SignedIn>
      </nav>
    </header>
  );
}
