import { OrbitControls, Box, ContactShadows, Environment } from "@react-three/drei";
import { Canvas } from "@react-three/fiber";

export default function ModelCanvas() {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-3">
      <h2 className="text-lg font-semibold text-slate-900">3D Preview</h2>
      <div className="mt-2 h-[300px] w-full overflow-hidden rounded-lg border border-slate-300">
        <Canvas camera={{ position: [2, 2, 2], fov: 50 }}>
          <ambientLight intensity={0.8} />
          <directionalLight position={[2, 2, 2]} intensity={1.2} />
          <Box args={[1, 1, 1]}>
            <meshStandardMaterial color="#3a86ff" />
          </Box>
          <Environment preset="city" />
          <ContactShadows position={[0, -0.8, 0]} opacity={0.35} scale={5} blur={1.6} />
          <OrbitControls enablePan={false} />
        </Canvas>
      </div>
    </div>
  );
}
