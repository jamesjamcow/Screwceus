import { Layer, Rect, Stage } from "react-konva";

import { useAppStore } from "../store/useAppStore";

export default function AnnotationCanvas() {
  const annotations = useAppStore((state) => state.annotations);

  return (
    <div className="panel">
      <h2>Annotation Layer</h2>
      <div className="canvas-wrap konva-wrap">
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
