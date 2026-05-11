import { useEffect, useMemo, useState } from "react";
import { useOutletContext, useParams } from "react-router-dom";

import PartCard from "../components/parts/PartCard";
import HomeTopNav from "../components/home/HomeTopNav";
import ProjectMiniNav from "../components/project/ProjectMiniNav";
import ProjectModelViewer from "../components/project/ProjectModelViewer";
import { PART_FIELDS, formatPartValue } from "../lib/partSchema";
import { useAuthedApi } from "../hooks/useAuthedApi";
import { listProjectParts } from "../services/driveService";

export default function ProjectAssemblePage() {
  const { projectId } = useParams();
  const { project } = useOutletContext();
  const { authedFetch } = useAuthedApi();
  const projectName = project.name;
  const [projectParts, setProjectParts] = useState([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [partsError, setPartsError] = useState("");
  const [isLoadingParts, setIsLoadingParts] = useState(true);
  const selectedProjectPart = projectParts[selectedIndex] ?? null;
  const selectedPart = selectedProjectPart?.part ?? null;
  const inventorySummary = useMemo(
    () =>
      selectedPart
        ? PART_FIELDS.map((field) => ({
            label: field.label,
            value: formatPartValue(field.name, selectedPart[field.name]),
          }))
        : [],
    [selectedPart],
  );

  useEffect(() => {
    let ignore = false;

    async function loadProjectParts() {
      setIsLoadingParts(true);
      setPartsError("");

      try {
        const records = await authedFetch((token) => listProjectParts(token, { projectId }));
        if (!ignore) {
          setProjectParts(records);
          setSelectedIndex(0);
        }
      } catch {
        if (!ignore) {
          setPartsError("Could not load project parts.");
        }
      } finally {
        if (!ignore) {
          setIsLoadingParts(false);
        }
      }
    }

    loadProjectParts();

    return () => {
      ignore = true;
    };
  }, [authedFetch, projectId]);

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
              {isLoadingParts ? <p className="mt-4 text-sm text-[#5f584d]">Loading project parts...</p> : null}
              {partsError ? <p className="mt-4 text-sm text-[#9d3434]">{partsError}</p> : null}
              {!isLoadingParts && !partsError && !selectedPart ? (
                <p className="mt-4 text-sm text-[#5f584d]">No parts have been linked to this project.</p>
              ) : null}
              {selectedPart ? (
                <div className="mt-4 grid grid-cols-2 gap-x-5 gap-y-4 text-[1rem] md:grid-cols-2 xl:grid-cols-4 xl:gap-x-4 xl:text-[0.94rem]">
                  {inventorySummary.map((item) => (
                    <div key={item.label}>
                      <p className="text-[#5f584d]">{item.label}</p>
                      <p className="mt-1 font-medium text-[#141414]">{item.value}</p>
                    </div>
                  ))}
                  <div>
                    <p className="text-[#5f584d]">Needed</p>
                    <p className="mt-1 font-medium text-[#141414]">{selectedProjectPart.quantity_needed}</p>
                  </div>
                </div>
              ) : null}
            </section>

            {selectedPart ? (
              <div className="space-y-3">
                {projectParts.map((projectPart, index) => (
                  <PartCard
                    key={projectPart.id}
                    part={projectPart.part}
                    footer={<span>Needed: {projectPart.quantity_needed}</span>}
                    selected={index === selectedIndex}
                    onClick={() => setSelectedIndex(index)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter" || event.key === " ") {
                        event.preventDefault();
                        setSelectedIndex(index);
                      }
                    }}
                    className="rounded-[8px] border-[#bdb6a8] bg-[#f5f4f0]"
                  />
                ))}
              </div>
            ) : null}
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
