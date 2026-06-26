import { Suspense, useMemo, useRef, useState } from "react";
import { useOutletContext } from "react-router-dom";
import { Canvas } from "@react-three/fiber";
import { Center, OrbitControls, Sphere, useGLTF } from "@react-three/drei";

import { NavIcon } from "../components/home/HomeIcons";
import ProjectPartsTable from "../components/project/ProjectPartsTable";
import {
  getDriveErrorMessage,
  useAddProjectPart,
  useParts,
  useProjectParts,
  useRemoveProjectPart,
  useUpdateProjectPart,
} from "../hooks/useDrive";
import { resolveApiAssetUrl } from "../lib/axios";

const EMPTY_ITEMS = [];

export default function ProjectLabelingPage() {
  const { project } = useOutletContext();
  const projectId = project.id;
  const modelUrl = resolveApiAssetUrl(project.model_url);
  const modelClickRef = useRef(false);

  const [selectedLinkId, setSelectedLinkId] = useState(null);
  const [newPartId, setNewPartId] = useState("");

  const partsQuery = useParts();
  const projectPartsQuery = useProjectParts(projectId);
  const addProjectPartMutation = useAddProjectPart(projectId);
  const updateProjectPartMutation = useUpdateProjectPart(projectId);
  const removeProjectPartMutation = useRemoveProjectPart(projectId);

  const inventoryParts = partsQuery.data ?? EMPTY_ITEMS;
  const projectPartLinks = projectPartsQuery.data ?? EMPTY_ITEMS;
  const partsById = useMemo(
    () => new Map(inventoryParts.map((part) => [part.id, part])),
    [inventoryParts],
  );
  const linkedPartIds = useMemo(
    () => new Set(projectPartLinks.map((link) => link.part_id)),
    [projectPartLinks],
  );
  const labels = useMemo(
    () => projectPartLinks.map((link) => ({
      ...link,
      part: link.part ?? partsById.get(link.part_id) ?? createMissingPart(link.part_id),
      point: normalizePoint(link.point),
    })),
    [partsById, projectPartLinks],
  );
  const markers = useMemo(() => labels.filter((label) => label.point), [labels]);
  const availableParts = useMemo(
    () => inventoryParts.filter((part) => !linkedPartIds.has(part.id)),
    [inventoryParts, linkedPartIds],
  );
  const activeLinkId = labels.some((label) => label.id === selectedLinkId) ? selectedLinkId : null;
  const selectedLabel = labels.find((label) => label.id === activeLinkId) ?? null;
  const selectedNewPartId = newPartId && availableParts.some((part) => String(part.id) === newPartId)
    ? newPartId
    : availableParts[0]
      ? String(availableParts[0].id)
      : "";

  const labelQueryError = projectPartsQuery.error
    ? getDriveErrorMessage(projectPartsQuery.error)
    : partsQuery.error
      ? getDriveErrorMessage(partsQuery.error)
      : "";
  const labelMutationError = addProjectPartMutation.error
    ? getDriveErrorMessage(addProjectPartMutation.error)
    : updateProjectPartMutation.error
      ? getDriveErrorMessage(updateProjectPartMutation.error)
      : removeProjectPartMutation.error
        ? getDriveErrorMessage(removeProjectPartMutation.error)
        : "";
  const isLabelWorking = (
    addProjectPartMutation.isPending
    || updateProjectPartMutation.isPending
    || removeProjectPartMutation.isPending
  );

  async function addLabel(event) {
    event.preventDefault();
    const partId = Number(selectedNewPartId);
    if (!partId) return;

    try {
      const createdLink = await addProjectPartMutation.mutateAsync({ partId });
      setSelectedLinkId(createdLink.id);
    } catch {
      // The request error is rendered in the labels panel.
    }
  }

  function removeLabel(event, linkId) {
    event?.stopPropagation();
    if (activeLinkId === linkId) {
      setSelectedLinkId(null);
    }
    removeProjectPartMutation.mutate(linkId);
  }

  const handleClearSelection = () => {
    setSelectedLinkId(null);
  };

  const handleModelClick = (event) => {
    if (activeLinkId === null) {
      return;
    }

    modelClickRef.current = true;
    event.stopPropagation();

    const clickedPoint = [
      Number(event.point.x.toFixed(3)),
      Number(event.point.y.toFixed(3)),
      Number(event.point.z.toFixed(3)),
    ];

    updateProjectPartMutation.mutate({
      linkId: activeLinkId,
      point: clickedPoint,
    });
  };

  return (
    <div className="project-page min-h-full text-[#dddde0] project-labeling-page">
      <main
        className="project-page__inner my-0 mx-auto pt-[36px] pr-0 pb-[64px] pl-0 [@media_(max-width:720px)]:pt-[26px] [@media_(max-width:720px)]:pr-0 [@media_(max-width:720px)]:pb-[44px] [@media_(max-width:720px)]:pl-0 project-labeling-page__inner project-overview-page__inner [@media_(max-width:720px)]:pt-[26px] [@media_(max-width:720px)]:pr-0 [@media_(max-width:720px)]:pb-[44px] [@media_(max-width:720px)]:pl-0"
        onClick={(event) => {
          if (modelClickRef.current) {
            modelClickRef.current = false;
            return;
          }

          if (event.target.closest(".project-parts-db, .project-overview-label-controls")) {
            return;
          }

          handleClearSelection();
        }}
      >
        <section className="project-overview-main min-w-0 [&_.project-overview-model__frame]:w-full [&_.project-overview-model__frame]:m-0">
          <section className="project-overview-model pt-[4px] pr-0 pb-[2px] pl-0" aria-label="Project model labels">
            <div className="project-page__section-heading flex items-end justify-between gap-[40px] mb-[24px] [&>div>span]:block [&>div>span]:mb-[7px] [&>div>span]:text-[#64666c] [&>div>span]:text-[10px] [&>div>span]:font-[680] [&>div>span]:tracking-[.1em] [&>div>span]:uppercase [&_h1]:m-0 [&_h1]:text-[#eeeeef] [&_h1]:text-[22px] [&_h1]:font-[560] [&_h1]:tracking-[-.035em] [&_h1]:leading-[1.05] [&_h2]:m-0 [&_h2]:text-[#eeeeef] [&_h2]:text-[22px] [&_h2]:font-[560] [&_h2]:tracking-[-.035em] [&_h2]:leading-[1.05] [&_h2]:text-[17px] [&>p]:max-w-[430px] [&>p]:m-0 [&>p]:text-[#77797e] [&>p]:text-[12px] [&>p]:leading-[1.55] [&>p]:text-right [@media_(max-width:720px)]:items-start [@media_(max-width:720px)]:flex-col [@media_(max-width:720px)]:gap-[10px] [@media_(max-width:720px)]:[&>p]:text-left project-page__section-heading--compact items-center mb-[14px]">
              <div><span>Model labels</span><h1>Placement map</h1></div>
              <span className="project-page__count min-w-[24px] h-[20px] grid place-items-center border border-[#303136] rounded-[10px] text-[#77797e] text-[10px] bg-[#17181a]">{labels.length}</span>
            </div>

            <div className="project-overview-model__frame my-0 mx-auto p-0 border-0 rounded-none bg-transparent">
              <div className="project-overview-model__viewport h-[430px] overflow-hidden border-0 rounded-none bg-transparent [@media_(max-width:720px)]:h-[300px]">
                {modelUrl ? (
                  <Canvas camera={{ position: [2.6, 1.6, 2.5], fov: 45 }} onPointerMissed={handleClearSelection}>
                    <ambientLight intensity={0.7} />
                    <directionalLight position={[3, 3, 2]} intensity={1.2} />
                    <directionalLight position={[-3, 2, -1]} intensity={0.65} />
                    <Suspense fallback={null}>
                      <UploadedProjectModel url={modelUrl} onClick={handleModelClick} />
                    </Suspense>
                    {markers.map((label) => (
                      <Sphere
                        key={label.id}
                        args={[0.08, 18, 18]}
                        position={label.point}
                        onClick={(event) => {
                          modelClickRef.current = true;
                          event.stopPropagation();
                          setSelectedLinkId(label.id);
                        }}
                      >
                        <meshStandardMaterial color={activeLinkId === label.id ? "#7d86ff" : "#d95c5c"} />
                      </Sphere>
                    ))}
                    <OrbitControls enablePan={false} enableDamping dampingFactor={0.08} minDistance={1.7} maxDistance={5.2} />
                  </Canvas>
                ) : (
                  <div className="project-overview-model__empty h-full flex items-center justify-center p-[20px] text-[#707278] text-[12px] text-center">
                    Upload a GLB, GLTF, or GIB file when creating the project to view it here.
                  </div>
                )}
              </div>
              <p className="project-overview-model__hint mt-[9px] mr-[3px] mb-[2px] ml-[3px] text-[#717278] text-[11px]">
                {!modelUrl
                  ? "No project model is attached yet."
                  : selectedLabel
                    ? `${selectedLabel.part.name}: ${updateProjectPartMutation.isPending ? "saving point..." : "click the model to set its point."}`
                    : "Select a label below, then click the model to set its point."}
              </p>
            </div>
          </section>

          <section className="project-overview-parts pt-[30px]" aria-label="Project labels">
            <div className="project-page__section-heading flex items-end justify-between gap-[40px] mb-[24px] [&>div>span]:block [&>div>span]:mb-[7px] [&>div>span]:text-[#64666c] [&>div>span]:text-[10px] [&>div>span]:font-[680] [&>div>span]:tracking-[.1em] [&>div>span]:uppercase [&_h1]:m-0 [&_h1]:text-[#eeeeef] [&_h1]:text-[22px] [&_h1]:font-[560] [&_h1]:tracking-[-.035em] [&_h1]:leading-[1.05] [&_h2]:m-0 [&_h2]:text-[#eeeeef] [&_h2]:text-[22px] [&_h2]:font-[560] [&_h2]:tracking-[-.035em] [&_h2]:leading-[1.05] [&_h2]:text-[17px] [&>p]:max-w-[430px] [&>p]:m-0 [&>p]:text-[#77797e] [&>p]:text-[12px] [&>p]:leading-[1.55] [&>p]:text-right [@media_(max-width:720px)]:items-start [@media_(max-width:720px)]:flex-col [@media_(max-width:720px)]:gap-[10px] [@media_(max-width:720px)]:[&>p]:text-left project-page__section-heading--compact items-center mb-[14px]">
              <div><span>Database labels</span><h2>Linked parts</h2></div>
              <span className="project-page__count min-w-[24px] h-[20px] grid place-items-center border border-[#303136] rounded-[10px] text-[#77797e] text-[10px] bg-[#17181a]">{labels.length}</span>
            </div>

            <div className="project-overview-label-controls grid gap-[8px] mb-[12px] [@media_(max-width:720px)]:grid-cols-1">
              <label htmlFor="project-label-part" className="sr-only">Inventory part</label>
              <div className="project-overview-label-select [&:focus-within]:border-[#5a5e9e] min-w-0 h-[34px] grid items-center gap-[8px] py-0 px-[10px] border border-[#303136] rounded-[7px] bg-[#151619] [&_svg]:w-[15px] [&_svg]:h-[15px] [&_svg]:text-[#77797f] [&_select]:w-full [&_select]:min-w-0 [&_select]:h-full [&_select]:p-0 [&_select]:border-0 [&_select]:outline-0 [&_select]:text-[#d7d7da] [&_select]:bg-transparent [&_select]:text-[12px] [&_select]:appearance-none [&_select]:cursor-pointer [&_select_option]:text-[#dddde0] [&_select_option]:bg-[#17181a]">
                <NavIcon type="inventory" />
                <select
                  id="project-label-part"
                  value={selectedNewPartId}
                  disabled={isLabelWorking || !availableParts.length}
                  onChange={(event) => setNewPartId(event.target.value)}
                >
                  {availableParts.length ? (
                    availableParts.map((part) => (
                      <option key={part.id} value={part.id}>{part.name}</option>
                    ))
                  ) : (
                    <option value="">All inventory parts linked</option>
                  )}
                </select>
                <NavIcon type="chevron-down" />
              </div>
              <button
                type="button"
                className="project-page__button min-h-[32px] py-0 px-[13px] border border-[#35363b] rounded-[6px] text-[#c7c7ca] bg-[#1a1b1e] text-[12px] cursor-pointer [&:hover]:border-[#47494f] [&:hover]:text-[#fff] [&:hover]:bg-[#222327] [&:disabled]:opacity-[.5] [&:disabled]:cursor-not-allowed project-page__button--primary border-[#6c72cf] text-[#fff] bg-[#5964c7] [&:hover]:border-[#7e84dc] [&:hover]:bg-[#6570d2]"
                disabled={isLabelWorking || !selectedNewPartId}
                onClick={addLabel}
              >
                Add label
              </button>
              {selectedLabel ? (
                <button
                  type="button"
                  className="project-page__button min-h-[32px] py-0 px-[13px] border border-[#35363b] rounded-[6px] text-[#c7c7ca] bg-[#1a1b1e] text-[12px] cursor-pointer [&:hover]:border-[#47494f] [&:hover]:text-[#fff] [&:hover]:bg-[#222327] [&:disabled]:opacity-[.5] [&:disabled]:cursor-not-allowed"
                  disabled={isLabelWorking}
                  onClick={(event) => removeLabel(event, selectedLabel.id)}
                >
                  Remove selected
                </button>
              ) : null}
            </div>

            {labelQueryError || labelMutationError ? (
              <p role="alert" className="project-page__error mt-[12px] mr-0 mb-0 ml-0 text-[#df8f96] text-[12px] text-center project-overview-labels__error mt-0 mr-0 mb-[10px] ml-0 text-left">
                {labelQueryError || labelMutationError}
              </p>
            ) : null}

            <ProjectPartsTable
              links={labels}
              isLoading={projectPartsQuery.isPending || partsQuery.isPending}
              isError={projectPartsQuery.isError || partsQuery.isError}
              selectable
              selectedLinkId={activeLinkId}
              showPoint
              searchPlaceholder="Search linked parts..."
              emptyTitle="No labels linked"
              emptyCopy="Linked project parts can be mapped to this model."
              onSelect={(link) => setSelectedLinkId(link.id)}
            />
          </section>
        </section>
      </main>
    </div>
  );
}

function UploadedProjectModel({ url, onClick }) {
  const gltf = useGLTF(url);

  return (
    <Center>
      <primitive object={gltf.scene} onClick={onClick} />
    </Center>
  );
}

function normalizePoint(point) {
  if (!Array.isArray(point) || point.length !== 3) {
    return null;
  }

  return point.map((value) => Number(value));
}

function createMissingPart(partId) {
  return {
    id: partId,
    name: `Part #${partId}`,
    type: "linked part",
    dimensions: {},
    notes: "This part is no longer available in inventory.",
  };
}
