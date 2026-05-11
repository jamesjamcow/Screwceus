import { Link } from "react-router-dom";

import HomeTopNav from "../home/HomeTopNav";

export default function ProjectRouteError({
  title = "Project not found",
  message = "This project does not exist or you do not have access to it.",
  onRetry,
}) {
  return (
    <div className="min-h-screen bg-[#efefef] text-[#141414]">
      <HomeTopNav />

      <main className="mx-auto flex min-h-[calc(100vh-64px)] max-w-[1060px] items-center px-5 py-12 md:px-0">
        <section className="w-full border-y border-[#b8b0a5] py-10 md:py-14">
          <p className="text-[0.78rem] font-semibold uppercase tracking-[0.22em] text-[#6f6d6a]">Project route</p>
          <h1 className="mt-4 text-[2.25rem] font-semibold leading-none text-[#141414] md:text-[3rem]">{title}</h1>
          <p className="mt-4 max-w-[560px] text-[1rem] leading-6 text-[#4d4943]">{message}</p>

          <div className="mt-8 flex flex-wrap items-center gap-3">
            <Link
              to="/"
              className="inline-flex h-10 items-center justify-center rounded-[6px] border border-[#141414] bg-[#141414] px-4 text-sm text-[#efefef] transition-opacity hover:opacity-90"
            >
              Go home
            </Link>
            {onRetry ? (
              <button
                type="button"
                onClick={onRetry}
                className="inline-flex h-10 items-center justify-center rounded-[6px] border border-[#6f6d6a] px-4 text-sm text-[#141414] transition-colors hover:bg-[#e3dfd8]"
              >
                Try again
              </button>
            ) : null}
          </div>
        </section>
      </main>
    </div>
  );
}
