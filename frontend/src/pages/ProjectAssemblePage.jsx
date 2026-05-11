import { useMemo } from "react";
import { useOutletContext, useParams } from "react-router-dom";

import PartCard from "../components/parts/PartCard";
import HomeTopNav from "../components/home/HomeTopNav";
import ProjectMiniNav from "../components/project/ProjectMiniNav";
import ProjectModelViewer from "../components/project/ProjectModelViewer";
import { PART_FIELDS, createPartRecords, formatPartValue } from "../lib/partSchema";

export default function ProjectAssemblePage() {
  const { projectId } = useParams();
  const { project } = useOutletContext();
  const projectName = project.name;
  const selectedPart = useMemo(() => createPartRecords()[0], []);
  const inventorySummary = useMemo(
    () =>
      PART_FIELDS.map((field) => ({
        label: field.label,
        value: formatPartValue(field.name, selectedPart[field.name]),
      })),
    [selectedPart],
  );

  return (
    <div className="min-h-screen bg-[#efefef] text-[#141414]">
      <HomeTopNav userName="James Jam Cow" />

      <main className="mx-auto max-w-[1180px] px-5 pb-8 pt-4 md:px-8 md:pb-12 md:pt-5">
        <h1 className="text-[2rem] leading-none md:text-[2.15rem]">
          <span className="font-normal">SpaceX/</span>
          <span className="font-semibold">{projectName}</span>
        </h1>

        <ProjectMiniNav active="assemble" projectId={projectId} />

        <section className="mt-7 grid gap-6 lg:grid-cols-[minmax(0,1.7fr)_320px] xl:grid-cols-[minmax(0,1.82fr)_350px]">
          <ProjectModelViewer
            project={project}
            projectId={projectId}
            footer={
              <>
                <span>{project.model_url ? "Project model loaded from the database." : "Upload a GLB, GLTF, or GIB file."}</span>
                <span className="ml-2 inline-block max-w-[220px] truncate align-bottom text-[#332f28]">
                  {project.model_filename || "No model selected"}
                </span>
              </>
            }
          />

          <aside className="flex flex-col gap-5">
            <section className="rounded-[8px] border border-[#d5cec2] bg-[#faf8f3] px-4 py-4 shadow-[0_1px_0_rgba(0,0,0,0.05)]">
              <h2 className="text-[1.8rem] font-medium leading-none md:text-[1.55rem]">Part Schema</h2>
              <div className="mt-4 grid grid-cols-2 gap-x-5 gap-y-4 text-[1rem] md:grid-cols-2 xl:grid-cols-4 xl:gap-x-4 xl:text-[0.94rem]">
                {inventorySummary.map((item) => (
                  <div key={item.label}>
                    <p className="text-[#5f584d]">{item.label}</p>
                    <p className="mt-1 font-medium text-[#141414]">{item.value}</p>
                  </div>
                ))}
              </div>
            </section>

            <PartCard
              part={selectedPart}
              badge={`#${selectedPart.id}`}
              preview={<MiniPartCardPreview />}
              className="rounded-[8px] border-[#bdb6a8] bg-[#f5f4f0]"
            />
          </aside>
        </section>

        <div className="mt-9 flex items-center justify-between px-2 text-[1.2rem] md:px-36 md:text-[0.98rem]">
          <button
            type="button"
            className="min-w-24 rounded-full border border-transparent px-4 py-2 text-center transition-colors hover:border-[#d1c8bb] hover:bg-[#f7f4ee]"
          >
            Done
          </button>
          <button
            type="button"
            className="min-w-24 rounded-full border border-transparent px-4 py-2 text-center transition-colors hover:border-[#d1c8bb] hover:bg-[#f7f4ee]"
          >
            Skip
          </button>
        </div>
      </main>
    </div>
  );
}

function MiniPartCardPreview() {
  return (
    <svg viewBox="0 0 180 180" aria-hidden="true" className="h-[76px] w-[76px] text-[#8db7d8]">
      <path d="M38 26 131 51v92l-93-25Z" fill="none" stroke="currentColor" strokeWidth="1.4" />
      <path d="m131 51 15-18v92l-15 18m-93-117 15-18 93 25" fill="none" stroke="#f2a34a" strokeWidth="1.4" />
      <path d="M38 89 131 114m-78-92v92" fill="none" stroke="currentColor" strokeWidth="1.1" opacity="0.88" />
      <circle cx="92" cy="89" r="2.5" fill="#202020" />
    </svg>
  );
}
