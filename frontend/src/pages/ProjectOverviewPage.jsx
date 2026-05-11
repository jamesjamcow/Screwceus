import { useMemo, useRef, useState } from "react";
import { useOutletContext, useParams } from "react-router-dom";
import { Sphere } from "@react-three/drei";

import PartCard from "../components/parts/PartCard";
import HomeTopNav from "../components/home/HomeTopNav";
import ProjectMiniNav from "../components/project/ProjectMiniNav";
import ProjectModelViewer from "../components/project/ProjectModelViewer";
import { createPartRecords } from "../lib/partSchema";

export default function ProjectOverviewPage() {
  const { projectId } = useParams();
  const { project } = useOutletContext();
  const projectName = project.name;
  const [parts, setParts] = useState(() =>
    createPartRecords().map((part, index) => ({
      ...part,
      point:
        index < 2
          ? [
              Number((0.35 + index * 0.45).toFixed(3)),
              Number((0.4 - index * 0.18).toFixed(3)),
              Number((0.12 + index * 0.1).toFixed(3)),
            ]
          : undefined,
    })),
  );
  const [selectedPartId, setSelectedPartId] = useState(null);
  const modelClickRef = useRef(false);

  const markers = useMemo(() => parts.filter((part) => part.point), [parts]);

  const handlePartSelect = (partId) => {
    setSelectedPartId(partId);
  };

  const handleClearSelection = () => {
    setSelectedPartId(null);
  };

  const handleModelClick = (event) => {
    if (selectedPartId === null) {
      return;
    }

    modelClickRef.current = true;
    event.stopPropagation();

    const clickedPoint = [
      Number(event.point.x.toFixed(3)),
      Number(event.point.y.toFixed(3)),
      Number(event.point.z.toFixed(3)),
    ];

    setParts((currentParts) =>
      currentParts.map((part) =>
        part.id === selectedPartId
          ? {
              ...part,
              point: clickedPoint,
            }
          : part,
      ),
    );
  };

  return (
    <div className="min-h-screen bg-[#efefef] text-[#141414]">
      <HomeTopNav />

      <main
        className="mx-auto max-w-[1060px] px-5 pb-10 pt-8 md:px-0"
        onClick={(event) => {
          if (modelClickRef.current) {
            modelClickRef.current = false;
            return;
          }

          if (event.target.closest("[data-part-card='true']")) {
            return;
          }

          handleClearSelection();
        }}
      >
        <h1 className="text-[2rem] leading-none md:text-[2.15rem]">
          <span className="font-normal">SpaceX/</span>
          <span className="font-semibold">{projectName}</span>
        </h1>

        <ProjectMiniNav active="overview" projectId={projectId} />

        <section className="mt-10 md:mt-12">
          <ProjectModelViewer
            project={project}
            projectId={projectId}
            label="Overview"
            onModelClick={handleModelClick}
            onPointerMissed={handleClearSelection}
            className="mx-auto max-w-[760px]"
            viewportClassName="h-[280px] md:h-[420px]"
            footer={
              <span>
                {!project.model_url
                  ? "Upload a GLB, GLTF, or GIB file."
                  : selectedPartId === null
                    ? "Select a card below, then click the 3D model to store a point."
                    : `Selected card ${selectedPartId}. Click the model to update its point.`}
              </span>
            }
          >
            {markers.map((part) => (
              <Sphere
                key={part.id}
                args={[0.08, 18, 18]}
                position={part.point}
                onClick={(event) => {
                  modelClickRef.current = true;
                  event.stopPropagation();
                  handlePartSelect(part.id);
                }}
              >
                <meshStandardMaterial color="#d92727" />
              </Sphere>
            ))}
          </ProjectModelViewer>
        </section>

        <section className="mt-7">
          <div className="max-h-[300px] space-y-3 overflow-y-auto pr-1 md:max-h-[340px]">
            {parts.map((part) => (
              <PartCard
                key={part.id}
                part={part}
                data-part-card="true"
                badge={`#${part.id}`}
                preview={<PartPreviewIcon className="h-[54px] w-[54px] text-[#8ca7b8]" />}
                footer={<span>Point: {part.point ? formatPoint(part.point) : "Not set"}</span>}
                selected={selectedPartId === part.id}
                onClick={() => handlePartSelect(part.id)}
                onKeyDown={(event) => {
                  if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    handlePartSelect(part.id);
                  }
                }}
                className="md:px-6 md:py-4"
              />
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}

function PartPreviewIcon({ className = "" }) {
  return (
    <svg viewBox="0 0 64 64" aria-hidden="true" className={className}>
      <path d="M13 18 32 7l19 11v28L32 57 13 46Z" fill="none" stroke="currentColor" strokeWidth="1.2" />
      <path d="M13 18 32 29v28M51 18 32 29M32 7v22" fill="none" stroke="currentColor" strokeWidth="1.2" />
    </svg>
  );
}

function formatPoint(point) {
  return point.map((value) => value.toFixed(2)).join(", ");
}
