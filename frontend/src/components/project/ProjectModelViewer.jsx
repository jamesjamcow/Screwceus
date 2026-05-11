import { Suspense, useRef, useState } from "react";
import { Center, OrbitControls, useGLTF } from "@react-three/drei";
import { Canvas } from "@react-three/fiber";

import { getUploadProjectModelErrorMessage, useUploadProjectModel } from "../../hooks/useDrive";
import { resolveApiAssetUrl } from "../../lib/axios";

export default function ProjectModelViewer({
  project,
  projectId,
  label = "Assembly View",
  caption = "Drag to rotate • Scroll to zoom",
  footer,
  children,
  onModelClick,
  onPointerMissed,
  className = "",
  viewportClassName = "h-[360px] md:h-[470px]",
}) {
  const modelUrl = resolveApiAssetUrl(project.model_url);
  const modelUploadInputRef = useRef(null);
  const uploadModelMutation = useUploadProjectModel();
  const [modelUploadError, setModelUploadError] = useState("");

  const handlePickModel = (event) => {
    event.stopPropagation();
    setModelUploadError("");
    modelUploadInputRef.current?.click();
  };

  const handleModelSelected = async (event) => {
    const selectedFile = event.target.files?.[0];
    event.target.value = "";
    if (!selectedFile) return;

    if (!isSupportedModelFile(selectedFile)) {
      setModelUploadError("Upload a GLB, GLTF, or GIB file.");
      return;
    }

    setModelUploadError("");

    try {
      await uploadModelMutation.mutateAsync({
        projectId,
        file: selectedFile,
      });
    } catch (error) {
      setModelUploadError(getUploadProjectModelErrorMessage(error));
    }
  };

  return (
    <article
      className={`overflow-hidden rounded-[8px] border border-[#cfc7ba] bg-[#faf8f3] shadow-[0_1px_0_rgba(0,0,0,0.08)] ${className}`}
    >
      <div className={`relative w-full border-b border-[#dfd8cc] bg-[#18382f] ${viewportClassName}`}>
        {modelUrl ? (
          <Canvas
            key={modelUrl}
            camera={{ position: [5.8, 3.2, 5.8], fov: 34 }}
            onPointerMissed={onPointerMissed}
          >
            <color attach="background" args={["#173229"]} />
            <fog attach="fog" args={["#173229", 7, 15]} />
            <ambientLight intensity={1.15} />
            <directionalLight position={[8, 10, 5]} intensity={1.9} color="#fff6dd" castShadow />
            <directionalLight position={[-5, 4, -3]} intensity={0.8} color="#9ec8ff" />
            <pointLight position={[0, 2.3, 0]} intensity={0.6} color="#bfd8ff" />
            <Suspense fallback={null}>
              <UploadedProjectModel url={modelUrl} onClick={onModelClick} />
            </Suspense>
            {children}
            <OrbitControls
              enablePan={false}
              enableDamping
              dampingFactor={0.08}
              minDistance={1.7}
              maxDistance={8.2}
              minPolarAngle={0.35}
              maxPolarAngle={1.75}
              target={[0, 0.5, 0]}
            />
          </Canvas>
        ) : (
          <div className="flex h-full flex-col items-center justify-center px-5 text-center text-sm text-[#efe8db]">
            <ModelUploadIcon className="mb-3 h-14 w-14 text-[#f4ecdc]" />
            <span>No project model is attached yet.</span>
          </div>
        )}

        <div className="pointer-events-none absolute inset-x-0 top-0 h-16 bg-linear-to-b from-[#f6f0e4]/10 to-transparent" />
        <div className="pointer-events-none absolute left-4 top-4 rounded-full border border-white/18 bg-black/18 px-3 py-1 text-[0.72rem] uppercase tracking-[0.22em] text-[#f4ecdc] backdrop-blur-sm">
          {label}
        </div>
        <div className="pointer-events-none absolute bottom-4 left-4 rounded-full border border-white/18 bg-black/18 px-3 py-1 text-[0.74rem] text-[#efe8db] backdrop-blur-sm">
          {caption}
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 text-[0.83rem] text-[#5d564a] md:px-5">
        <div className="min-w-0">
          {footer ?? (
            <>
              <span>{modelUrl ? "Project model loaded from the database." : "Upload a GLB, GLTF, or GIB file."}</span>
              {project.model_filename ? (
                <span className="ml-2 inline-block max-w-[220px] truncate align-bottom text-[#332f28]">
                  {project.model_filename}
                </span>
              ) : null}
            </>
          )}
          {modelUploadError ? (
            <p role="alert" className="mt-1 text-[#9d3434]">
              {modelUploadError}
            </p>
          ) : null}
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <button
            type="button"
            onClick={handlePickModel}
            disabled={uploadModelMutation.isPending}
            className="inline-flex h-9 items-center rounded-[6px] bg-[#141414] px-3 text-sm font-semibold text-[#efefef] transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {uploadModelMutation.isPending ? "Uploading..." : modelUrl ? "Replace model" : "Upload model"}
          </button>
          <input
            ref={modelUploadInputRef}
            type="file"
            accept=".glb,.gltf,.gib,model/gltf-binary,model/gltf+json"
            className="hidden"
            onChange={handleModelSelected}
          />
        </div>
      </div>
    </article>
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

function ModelUploadIcon({ className = "" }) {
  return (
    <svg viewBox="0 0 64 64" aria-hidden="true" className={className}>
      <path d="M13 18 32 7l19 11v28L32 57 13 46Z" fill="none" stroke="currentColor" strokeWidth="1.4" />
      <path d="M13 18 32 29v28M51 18 32 29M32 7v22" fill="none" stroke="currentColor" strokeWidth="1.4" />
      <path
        d="M25 42.5 32 35l7 7.5M32 35v17"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function isSupportedModelFile(file) {
  if (!file) return true;
  const extension = file.name.split(".").pop()?.toLowerCase();
  return ["glb", "gltf", "gib"].includes(extension);
}
