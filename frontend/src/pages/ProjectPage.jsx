import { useMemo } from "react";
import { useParams } from "react-router-dom";

import HomeTopNav from "../components/home/HomeTopNav";
import ProjectMiniNav from "../components/project/ProjectMiniNav";

const PART_ROWS = [
  { id: 1, name: "Screw", type: "M4", sizing: "Length: 40mm", quantity: 50, status: "IN stock" },
  { id: 2, name: "Screw", type: "M4", sizing: "Length: 40mm", quantity: 50, status: "IN stock" },
  { id: 3, name: "Screw", type: "M4", sizing: "Length: 40mm", quantity: 50, status: "IN stock" },
];

export default function ProjectPage() {
  const { projectId } = useParams();

  const projectName = useMemo(() => formatProjectName(projectId), [projectId]);

  return (
    <div className="min-h-screen bg-[#efefef] text-[#141414]">
      <HomeTopNav />

      <main className="mx-auto max-w-[1060px]">
        <section className="min-h-[300px] border-b border-[#b8b0a5] px-5 pb-10 pt-8 md:min-h-[420px] md:px-0">
          <h1 className="text-[2rem] leading-none md:text-[2.15rem]">
            <span className="font-normal">SpaceX/</span>
            <span className="font-semibold">{projectName}</span>
          </h1>

          <ProjectMiniNav active="design" />

          <div className="mt-16 flex items-center justify-center md:mt-28">
            <button
              type="button"
              className="flex flex-col items-center text-center text-[#141414] transition-opacity hover:opacity-80"
            >
              <UploadIcon className="h-16 w-16 md:h-[76px] md:w-[76px]" />
              <span className="mt-2 text-[2rem] leading-none md:text-[2.15rem]">Paste Image</span>
              <span className="mt-2 text-[1.6rem] leading-none md:text-[1.5rem]">or upload</span>
              <span className="mt-2 text-[1.6rem] leading-none md:text-[1.5rem]">or blank</span>
            </button>
          </div>
        </section>

        <section className="px-5 pb-10 pt-6 md:px-0">
          <label htmlFor="project-part-search" className="sr-only">
            Search parts
          </label>
          <div className="relative">
            <input
              id="project-part-search"
              type="text"
              placeholder="Type here to search"
              className="h-10 w-full rounded-lg border border-[#6f6d6a] bg-[#efefef] px-4 pr-14 text-[1.75rem] text-[#141414] placeholder:text-[#b5b5b5] focus:outline-none"
            />

            <button
              type="button"
              aria-label="Search inventory"
              className="absolute right-2 top-1/2 -translate-y-1/2 text-[#141414] transition-opacity hover:opacity-70"
            >
              <SearchCatalogIcon className="h-7 w-7" />
            </button>
          </div>

          <div className="mt-6 space-y-3">
            {PART_ROWS.map((part) => (
              <article
                key={part.id}
                className="relative rounded-lg border border-[#b8b0a5] bg-[#efefef] px-4 py-5 text-[1.35rem] md:px-6 md:py-6"
              >
                <div className="absolute right-5 top-2 text-[1.5rem]">{part.id}</div>
                <div className="grid grid-cols-2 gap-x-4 gap-y-3 md:grid-cols-[1.1fr_1fr_1.45fr_1fr_1.2fr] md:items-center">
                  <p>
                    Name: <span className="ml-2">{part.name}</span>
                  </p>
                  <p>
                    Type <span className="ml-2">{part.type}</span>
                  </p>
                  <p>Sizing {part.sizing}</p>
                  <p>Quantity {part.quantity}</p>
                  <p>
                    Status <span className="ml-2">{part.status}</span>
                  </p>
                </div>
              </article>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}

function formatProjectName(projectId) {
  if (!projectId) return "Untitled";

  return decodeURIComponent(projectId)
    .trim()
    .replace(/[-_]+/g, " ")
    .replace(/\s+/g, " ")
    .replace(/\b\w/g, (character) => character.toUpperCase());
}

function UploadIcon({ className = "" }) {
  return (
    <svg viewBox="0 0 64 64" aria-hidden="true" className={className}>
      <path
        d="M19 46H14c-5 0-9-3.9-9-8.7 0-4.4 3.4-8 7.8-8.6.9-6.7 6.9-11.9 14.3-11.9 6.7 0 12.6 4.3 14.1 10.2a9.8 9.8 0 0 1 4.4-1c5.3 0 9.6 4 9.6 9s-4.3 9-9.6 9H38"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M28 36.5 32 32l4 4.5M32 32v20"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function SearchCatalogIcon({ className = "" }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className={className}>
      <path
        d="M7 4h8a2 2 0 0 1 2 2v11a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2Zm0 4h10M9 12h3m-3 3h2m6.5 4.5L20 22m-1.5-2.5a3 3 0 1 1 0-6 3 3 0 0 1 0 6Z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
