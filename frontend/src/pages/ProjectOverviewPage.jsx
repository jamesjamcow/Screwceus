import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useOutletContext, useParams } from "react-router-dom";
import { Sphere } from "@react-three/drei";

import PartCard from "../components/parts/PartCard";
import HomeTopNav from "../components/home/HomeTopNav";
import ProjectMiniNav from "../components/project/ProjectMiniNav";
import ProjectModelViewer from "../components/project/ProjectModelViewer";
import { useAuthedApi } from "../hooks/useAuthedApi";
import { listProjectParts, updateProjectPart } from "../services/driveService";

export default function ProjectOverviewPage() {
  const { projectId } = useParams();
  const { project } = useOutletContext();
  const { authedFetch } = useAuthedApi();
  const projectName = project.name;
  const [projectParts, setProjectParts] = useState([]);
  const [selectedLinkId, setSelectedLinkId] = useState(null);
  const [partsError, setPartsError] = useState("");
  const [isLoadingParts, setIsLoadingParts] = useState(true);
  const modelClickRef = useRef(false);

  const markers = useMemo(() => projectParts.filter((projectPart) => projectPart.point), [projectParts]);

  useEffect(() => {
    let ignore = false;

    async function loadProjectParts() {
      setIsLoadingParts(true);
      setPartsError("");

      try {
        const records = await authedFetch((token) => listProjectParts(token, { projectId }));
        if (!ignore) {
          setProjectParts(records);
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

  const handlePartSelect = (linkId) => {
    setSelectedLinkId(linkId);
  };

  const handleClearSelection = () => {
    setSelectedLinkId(null);
  };

  const handleModelClick = useCallback(async (event) => {
    if (selectedLinkId === null) {
      return;
    }

    modelClickRef.current = true;
    event.stopPropagation();

    const clickedPoint = [
      Number(event.point.x.toFixed(3)),
      Number(event.point.y.toFixed(3)),
      Number(event.point.z.toFixed(3)),
    ];

    setProjectParts((currentParts) =>
      currentParts.map((projectPart) =>
        projectPart.id === selectedLinkId
          ? {
              ...projectPart,
              point: clickedPoint,
            }
          : projectPart,
      ),
    );

    try {
      const updatedProjectPart = await authedFetch((token) =>
        updateProjectPart(token, {
          projectId,
          linkId: selectedLinkId,
          values: { point: clickedPoint },
        }),
      );
      setProjectParts((currentParts) =>
        currentParts.map((projectPart) => (projectPart.id === selectedLinkId ? updatedProjectPart : projectPart)),
      );
    } catch {
      setPartsError("Could not save the selected point.");
    }
  }, [authedFetch, projectId, selectedLinkId]);

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
                  : selectedLinkId === null
                    ? "Select a card below, then click the 3D model to store a point."
                    : `Selected card ${selectedLinkId}. Click the model to update its point.`}
              </span>
            }
          >
            {markers.map((projectPart) => (
              <Sphere
                key={projectPart.id}
                args={[0.08, 18, 18]}
                position={projectPart.point}
                onClick={(event) => {
                  modelClickRef.current = true;
                  event.stopPropagation();
                  handlePartSelect(projectPart.id);
                }}
              >
                <meshStandardMaterial color="#d92727" />
              </Sphere>
            ))}
          </ProjectModelViewer>
        </section>

        <section className="mt-7">
          <div className="max-h-[300px] space-y-3 overflow-y-auto pr-1 md:max-h-[340px]">
            {isLoadingParts ? <p className="text-sm text-[#5f584d]">Loading project parts...</p> : null}
            {partsError ? <p className="text-sm text-[#9d3434]">{partsError}</p> : null}
            {!isLoadingParts && !partsError && projectParts.length === 0 ? (
              <p className="text-sm text-[#5f584d]">No parts have been linked to this project.</p>
            ) : null}
            {projectParts.map((projectPart) => (
              <PartCard
                key={projectPart.id}
                part={projectPart.part}
                imageUrl={projectPart.source_image_url}
                annotationJson={projectPart.annotation_json}
                data-part-card="true"
                footer={
                  <span>
                    Needed: {projectPart.quantity_needed} · Point:{" "}
                    {projectPart.point ? formatPoint(projectPart.point) : "Not set"}
                  </span>
                }
                selected={selectedLinkId === projectPart.id}
                onClick={() => handlePartSelect(projectPart.id)}
                onKeyDown={(event) => {
                  if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    handlePartSelect(projectPart.id);
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

function formatPoint(point) {
  return point.map((value) => value.toFixed(2)).join(", ");
}
