import { useMemo } from "react";
import { useParams } from "react-router-dom";
import { Float, OrbitControls } from "@react-three/drei";
import { Canvas } from "@react-three/fiber";

import HomeTopNav from "../components/home/HomeTopNav";
import ProjectMiniNav from "../components/project/ProjectMiniNav";
import { formatProjectName } from "../lib/projectRouting";

const INVENTORY_SUMMARY = [
  { label: "Type", value: "M4" },
  { label: "Quantity", value: "100 - 50 = 50" },
  { label: "Sizing", value: "Length: 40mm" },
  { label: "Amount Used", value: "50" },
];

const SELECTED_PART = {
  index: 1,
  name: "Screw",
  type: "M4",
  sizing: "Length: 40mm",
  quantity: 50,
  status: "In stock",
  part: "Body",
  label: "Assembly 1",
};

export default function ProjectAssemblePage() {
  const { projectId } = useParams();
  const projectName = useMemo(() => formatProjectName(projectId), [projectId]);

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
          <article className="overflow-hidden rounded-[8px] border border-[#cfc7ba] bg-[#faf8f3] shadow-[0_1px_0_rgba(0,0,0,0.08)]">
            <div className="relative h-[360px] w-full border-b border-[#dfd8cc] bg-[#18382f] md:h-[470px]">
              <Canvas camera={{ position: [5.8, 3.2, 5.8], fov: 34 }}>
                <color attach="background" args={["#173229"]} />
                <fog attach="fog" args={["#173229", 7, 15]} />
                <ambientLight intensity={1.15} />
                <directionalLight position={[8, 10, 5]} intensity={1.9} color="#fff6dd" castShadow />
                <directionalLight position={[-5, 4, -3]} intensity={0.8} color="#9ec8ff" />
                <pointLight position={[0, 2.3, 0]} intensity={0.6} color="#bfd8ff" />
                <Float speed={1.4} rotationIntensity={0.12} floatIntensity={0.18}>
                  <AssemblyRig />
                </Float>
                <OrbitControls
                  enablePan={false}
                  enableDamping
                  dampingFactor={0.08}
                  minDistance={4.8}
                  maxDistance={8.2}
                  minPolarAngle={0.8}
                  maxPolarAngle={1.65}
                  target={[0, 0.95, 0]}
                />
              </Canvas>
              <div className="pointer-events-none absolute inset-x-0 top-0 h-16 bg-linear-to-b from-[#f6f0e4]/10 to-transparent" />
              <div className="pointer-events-none absolute left-4 top-4 rounded-full border border-white/18 bg-black/18 px-3 py-1 text-[0.72rem] uppercase tracking-[0.22em] text-[#f4ecdc] backdrop-blur-sm">
                Assembly View
              </div>
              <div className="pointer-events-none absolute bottom-4 left-4 rounded-full border border-white/18 bg-black/18 px-3 py-1 text-[0.74rem] text-[#efe8db] backdrop-blur-sm">
                Drag to rotate • Scroll to zoom
              </div>
            </div>

            <div className="flex items-center justify-between gap-4 px-4 py-3 text-[0.83rem] text-[#5d564a] md:px-5">
              <div>
                React Three Fiber viewport for the active assembly. Swap `AssemblyRig` for your loaded project model when ready.
              </div>
              <div className="shrink-0 rounded-full border border-[#d6cfbf] bg-[#f3efe6] px-3 py-1 text-[#332f28]">
                Part #{SELECTED_PART.index}
              </div>
            </div>
          </article>

          <aside className="flex flex-col gap-5">
            <section className="rounded-[8px] border border-[#d5cec2] bg-[#faf8f3] px-4 py-4 shadow-[0_1px_0_rgba(0,0,0,0.05)]">
              <h2 className="text-[1.8rem] font-medium leading-none md:text-[1.55rem]">Inventory</h2>
              <div className="mt-4 grid grid-cols-2 gap-x-5 gap-y-4 text-[1rem] md:grid-cols-2 xl:grid-cols-4 xl:gap-x-4 xl:text-[0.94rem]">
                {INVENTORY_SUMMARY.map((item) => (
                  <div key={item.label}>
                    <p className="text-[#5f584d]">{item.label}</p>
                    <p className="mt-1 font-medium text-[#141414]">{item.value}</p>
                  </div>
                ))}
              </div>
            </section>

            <section className="rounded-[8px] border border-[#bdb6a8] bg-[#f5f4f0] px-5 py-4 shadow-[0_1px_0_rgba(0,0,0,0.06)]">
              <div className="flex items-start justify-between gap-4">
                <MiniPartCardPreview />
                <span className="text-[1rem] md:text-[0.95rem]">{SELECTED_PART.index}</span>
              </div>

              <dl className="mt-4 grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 text-[1.05rem] md:text-[0.95rem]">
                <dt className="text-[#504a40]">Name:</dt>
                <dd>{SELECTED_PART.name}</dd>
                <dt className="text-[#504a40]">Type</dt>
                <dd>{SELECTED_PART.type}</dd>
                <dt className="text-[#504a40]">Sizing</dt>
                <dd>{SELECTED_PART.sizing}</dd>
                <dt className="text-[#504a40]">Quantity</dt>
                <dd>{SELECTED_PART.quantity}</dd>
              </dl>

              <div className="mt-6 grid grid-cols-3 gap-4 border-t border-[#ddd5c7] pt-4 text-[1.05rem] md:text-[0.95rem]">
                <div>
                  <p className="text-[#504a40]">Status</p>
                  <p className="mt-1">{SELECTED_PART.status}</p>
                </div>
                <div>
                  <p className="text-[#504a40]">Part</p>
                  <p className="mt-1">{SELECTED_PART.part}</p>
                </div>
                <div>
                  <p className="text-[#504a40]">Label</p>
                  <p className="mt-1">{SELECTED_PART.label}</p>
                </div>
              </div>
            </section>
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

function AssemblyRig() {
  return (
    <group position={[0, -0.7, 0]} rotation={[0, -0.58, 0]}>
      <mesh position={[0, -1.02, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <circleGeometry args={[4.2, 48]} />
        <meshStandardMaterial color="#29483d" roughness={0.95} />
      </mesh>

      <mesh position={[0, -0.95, 0]} receiveShadow>
        <boxGeometry args={[7.3, 0.12, 2.4]} />
        <meshStandardMaterial color="#6c4c35" roughness={0.92} />
      </mesh>

      <mesh position={[0, -0.78, 0]}>
        <boxGeometry args={[6.7, 0.16, 0.2]} />
        <meshStandardMaterial color="#20252b" metalness={0.6} roughness={0.42} />
      </mesh>
      <mesh position={[0, -0.68, 0]}>
        <boxGeometry args={[6.7, 0.06, 0.13]} />
        <meshStandardMaterial color="#37424b" metalness={0.55} roughness={0.35} />
      </mesh>
      <mesh position={[-2.85, -0.74, 0]}>
        <boxGeometry args={[0.4, 0.28, 1.05]} />
        <meshStandardMaterial color="#242a31" metalness={0.64} roughness={0.39} />
      </mesh>
      <mesh position={[2.85, -0.74, 0]}>
        <boxGeometry args={[0.4, 0.28, 1.05]} />
        <meshStandardMaterial color="#242a31" metalness={0.64} roughness={0.39} />
      </mesh>

      <mesh position={[0, 0.04, 0]}>
        <boxGeometry args={[0.72, 1.7, 0.82]} />
        <meshStandardMaterial color="#232b34" metalness={0.45} roughness={0.5} />
      </mesh>
      <mesh position={[0, 0.95, 0]}>
        <boxGeometry args={[1.48, 0.14, 0.42]} />
        <meshStandardMaterial color="#2e3941" metalness={0.45} roughness={0.48} />
      </mesh>

      <mesh position={[0.08, 0.84, 0.1]} rotation={[0.12, 0.08, -0.07]}>
        <boxGeometry args={[0.9, 1.55, 0.13]} />
        <meshStandardMaterial color="#10161d" metalness={0.12} roughness={0.28} />
      </mesh>
      <mesh position={[0.08, 0.84, 0.17]} rotation={[0.12, 0.08, -0.07]}>
        <boxGeometry args={[0.74, 1.36, 0.02]} />
        <meshStandardMaterial color="#74a6ff" emissive="#5f8ce0" emissiveIntensity={0.3} roughness={0.16} />
      </mesh>

      <mesh position={[-0.62, 0.32, 0.25]} rotation={[0.18, 0, 0.82]}>
        <cylinderGeometry args={[0.07, 0.07, 1.12, 18]} />
        <meshStandardMaterial color="#4f5b63" metalness={0.78} roughness={0.28} />
      </mesh>
      <mesh position={[0.62, 0.32, 0.25]} rotation={[0.18, 0, -0.82]}>
        <cylinderGeometry args={[0.07, 0.07, 1.12, 18]} />
        <meshStandardMaterial color="#4f5b63" metalness={0.78} roughness={0.28} />
      </mesh>
      <mesh position={[-0.86, 0.1, 0.16]}>
        <cylinderGeometry args={[0.16, 0.16, 0.3, 24]} />
        <meshStandardMaterial color="#6d7881" metalness={0.8} roughness={0.27} />
      </mesh>
      <mesh position={[0.86, 0.1, 0.16]}>
        <cylinderGeometry args={[0.16, 0.16, 0.3, 24]} />
        <meshStandardMaterial color="#6d7881" metalness={0.8} roughness={0.27} />
      </mesh>

      <mesh position={[-0.05, -0.48, 0.66]} rotation={[0.32, 0, 0.1]}>
        <boxGeometry args={[0.96, 0.26, 0.8]} />
        <meshStandardMaterial color="#c84444" roughness={0.54} />
      </mesh>
      <mesh position={[-0.38, -0.3, 0.92]} rotation={[0.7, 0.12, 1.4]}>
        <cylinderGeometry args={[0.03, 0.03, 2.4, 12]} />
        <meshStandardMaterial color="#2f7ce4" emissive="#2a6dd0" emissiveIntensity={0.18} />
      </mesh>
      <mesh position={[-0.08, -0.36, 0.89]} rotation={[0.78, -0.1, 0.32]}>
        <cylinderGeometry args={[0.03, 0.03, 1.95, 12]} />
        <meshStandardMaterial color="#f0c340" emissive="#ae8f2e" emissiveIntensity={0.14} />
      </mesh>
      <mesh position={[0.28, -0.26, 0.93]} rotation={[0.6, 0.4, -0.26]}>
        <cylinderGeometry args={[0.03, 0.03, 2.15, 12]} />
        <meshStandardMaterial color="#d15252" emissive="#9d3e3e" emissiveIntensity={0.16} />
      </mesh>

      <mesh position={[0.48, -0.42, 0.58]} rotation={[0.24, 0.12, 0]}>
        <boxGeometry args={[0.28, 0.14, 0.24]} />
        <meshStandardMaterial color="#218c7e" roughness={0.4} metalness={0.1} />
      </mesh>
      <mesh position={[0.72, -0.33, 0.82]} rotation={[0.6, 0.2, -0.1]}>
        <cylinderGeometry args={[0.028, 0.028, 1.54, 12]} />
        <meshStandardMaterial color="#f0c340" emissive="#ae8f2e" emissiveIntensity={0.14} />
      </mesh>

      <mesh position={[-1.7, -0.6, 0.6]} rotation={[0.92, -0.18, 0.8]}>
        <torusGeometry args={[0.42, 0.045, 12, 48, 3.8]} />
        <meshStandardMaterial color="#2c69d9" metalness={0.08} roughness={0.42} />
      </mesh>
    </group>
  );
}

function MiniPartCardPreview() {
  return (
    <div className="flex h-[168px] w-[168px] items-center justify-center rounded-[6px] border border-[#dde4ea] bg-[#eef3f6]">
      <svg viewBox="0 0 180 180" aria-hidden="true" className="h-[150px] w-[150px] text-[#8db7d8]">
        <path d="M38 26 131 51v92l-93-25Z" fill="none" stroke="currentColor" strokeWidth="1.4" />
        <path d="m131 51 15-18v92l-15 18m-93-117 15-18 93 25" fill="none" stroke="#f2a34a" strokeWidth="1.4" />
        <path d="M38 89 131 114m-78-92v92" fill="none" stroke="currentColor" strokeWidth="1.1" opacity="0.88" />
        <circle cx="92" cy="89" r="2.5" fill="#202020" />
      </svg>
    </div>
  );
}
