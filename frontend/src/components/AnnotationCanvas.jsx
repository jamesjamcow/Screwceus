import { Layer, Rect, Stage } from "react-konva";

import { useAppStore } from "../store/useAppStore";

export default function AnnotationCanvas() {
  const annotations = useAppStore((state) => state.annotations);

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-3">
      <h2 className="text-lg font-semibold text-slate-900">Annotation Layer</h2>
      <div className="mt-2 flex h-[300px] w-full items-center justify-center overflow-hidden rounded-lg border border-slate-300">
        <Stage width={520} height={300}>
          <Layer>
            {annotations.map((item) => (
              <Rect
                key={item.id}
                x={item.x}
                y={item.y}
                width={item.width}
                height={item.height}
                stroke={item.stroke}
                strokeWidth={3}
                cornerRadius={6}
              />
            ))}
          </Layer>
        </Stage>
      </div>
    </div>
  );
}
