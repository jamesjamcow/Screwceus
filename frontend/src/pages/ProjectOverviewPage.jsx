import { useMemo } from "react";
import { useParams } from "react-router-dom";
import { Canvas } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";

import HomeTopNav from "../components/home/HomeTopNav";
import ProjectMiniNav from "../components/project/ProjectMiniNav";
import { formatProjectName } from "../lib/projectRouting";

const MODEL_FILE_PLACEHOLDER = "src/assets/models/project-model.glb";

const PART_ROWS = [
  { id: 1, name: "Screw", type: "M4", sizing: "Length: 40mm", quantity: 50, status: "IN stock", part: "Body", label: "Assembly 1" },
  { id: 2, name: "Spacer", type: "Nylon", sizing: "Outer: 8mm", quantity: 30, status: "IN stock", part: "Rail", label: "Assembly 1" },
  { id: 3, name: "Washer", type: "M4", sizing: "Inner: 4.3mm", quantity: 120, status: "IN stock", part: "Body", label: "Assembly 2" },
  { id: 4, name: "Nut", type: "M4", sizing: "Hex", quantity: 65, status: "Low stock", part: "Mount", label: "Assembly 2" },
  { id: 5, name: "Bearing", type: "625ZZ", sizing: "5x16x5", quantity: 10, status: "IN stock", part: "Slider", label: "Assembly 3" },
  { id: 6, name: "Bracket", type: "Aluminum", sizing: "120x35mm", quantity: 12, status: "IN stock", part: "Base", label: "Assembly 3" },
  { id: 7, name: "Wire Set", type: "18AWG", sizing: "Length: 1m", quantity: 8, status: "Low stock", part: "Control", label: "Assembly 4" },
  { id: 8, name: "Connector", type: "JST-XH", sizing: "4 pin", quantity: 40, status: "IN stock", part: "Control", label: "Assembly 4" },
];

export default function ProjectOverviewPage() {
  const { projectId } = useParams();
  const projectName = useMemo(() => formatProjectName(projectId), [projectId]);

  return (
    <div className="min-h-screen bg-[#efefef] text-[#141414]">
      <HomeTopNav />

      <main className="mx-auto max-w-[1060px] px-5 pb-10 pt-8 md:px-0">
        <h1 className="text-[2rem] leading-none md:text-[2.15rem]">
          <span className="font-normal">SpaceX/</span>
          <span className="font-semibold">{projectName}</span>
        </h1>

        <ProjectMiniNav active="overview" projectId={projectId} />

        <section className="mt-10 md:mt-12">
          <div className="mx-auto w-full max-w-[620px] rounded-[6px] border border-[#b8b0a5] bg-[#eceae6] p-2 shadow-[0_1px_0_rgba(0,0,0,0.08)]">
            <div className="h-[250px] w-full overflow-hidden rounded-[4px] border border-[#c8c0b5] bg-[#d8d3cb] md:h-[340px]">
              <Canvas camera={{ position: [2.6, 1.6, 2.5], fov: 45 }}>
                <ambientLight intensity={0.7} />
                <directionalLight position={[3, 3, 2]} intensity={1.2} />
                <directionalLight position={[-3, 2, -1]} intensity={0.65} />
                <mesh rotation={[0.28, 0.58, 0.08]}>
                  <cylinderGeometry args={[0.35, 0.35, 1.4, 6]} />
                  <meshStandardMaterial color="#90989f" metalness={0.7} roughness={0.34} />
                </mesh>
                <mesh position={[0, 0.84, 0]} rotation={[0.2, 0.58, 0.08]}>
                  <cylinderGeometry args={[0.57, 0.57, 0.25, 6]} />
                  <meshStandardMaterial color="#a5adb5" metalness={0.75} roughness={0.31} />
                </mesh>
                <OrbitControls enablePan={false} enableDamping dampingFactor={0.08} minDistance={1.7} maxDistance={5.2} />
              </Canvas>
            </div>
            <p className="mt-2 text-right text-[0.78rem] text-[#5d5d5d]">
              3D model placeholder: <span className="font-medium">{MODEL_FILE_PLACEHOLDER}</span>
            </p>
          </div>
        </section>

        <section className="mt-7">
          <div className="max-h-[300px] space-y-3 overflow-y-auto pr-1 md:max-h-[340px]">
            {PART_ROWS.map((part) => (
              <article
                key={part.id}
                className="relative rounded-lg border border-[#b8b0a5] bg-[#efefef] px-3 py-3 text-[1.2rem] shadow-[0_1px_0_rgba(0,0,0,0.04)] md:px-6 md:py-4 md:text-[1rem]"
              >
                <div className="absolute right-4 top-2 text-[1.2rem] md:text-[1rem]">{part.id}</div>

                <div className="grid grid-cols-[90px_1fr] gap-3 md:grid-cols-[120px_1.35fr_0.8fr_1fr_0.8fr_0.85fr_0.9fr] md:items-center md:gap-4">
                  <div className="flex h-[70px] w-[90px] items-center justify-center rounded bg-[#e7e6e2] md:h-[84px] md:w-[108px]">
                    <PartPreviewIcon className="h-[54px] w-[54px] text-[#8ca7b8]" />
                  </div>
                  <p>
                    Name: <span className="ml-1">{part.name}</span>
                  </p>
                  <p>
                    Type <span className="ml-1">{part.type}</span>
                  </p>
                  <p>Sizing {part.sizing}</p>
                  <p>Quantity {part.quantity}</p>
                  <p>Status {part.status}</p>
                  <p>
                    Part {part.part} <span className="ml-2">Label {part.label}</span>
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

function PartPreviewIcon({ className = "" }) {
  return (
    <svg viewBox="0 0 64 64" aria-hidden="true" className={className}>
      <path d="M13 18 32 7l19 11v28L32 57 13 46Z" fill="none" stroke="currentColor" strokeWidth="1.2" />
      <path d="M13 18 32 29v28M51 18 32 29M32 7v22" fill="none" stroke="currentColor" strokeWidth="1.2" />
    </svg>
  );
}
