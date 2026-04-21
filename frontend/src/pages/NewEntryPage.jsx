import { useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useParams } from "react-router-dom";

import HomeTopNav from "../components/home/HomeTopNav";

const FIELD_CLASS =
  "h-10 w-full rounded-[4px] border border-[#6f6d6a] bg-[#efefef] px-3 text-[1.55rem] text-[#141414] focus:outline-none md:text-[1.12rem]";

export default function NewEntryPage() {
  const { projectId } = useParams();
  const location = useLocation();

  const projectName = useMemo(() => formatProjectName(projectId), [projectId]);
  const uploadedFileName = location.state?.uploadedFileName;

  return (
    <div className="min-h-screen bg-[#efefef] text-[#141414]">
      <HomeTopNav />

      <main className="mx-auto w-full max-w-[1260px] px-4 pb-10 pt-5 md:px-7 md:pt-7">
        <div className="mb-4 text-[1.35rem] md:text-[1.05rem]">
          <span className="font-normal">SpaceX/</span>
          <span className="font-semibold">{projectName}</span>
        </div>

        <section className="grid gap-6 lg:grid-cols-[1.35fr_0.88fr]">
          <article className="overflow-hidden border border-[#c6c1b8] bg-[#e6e6e6]">
            <CanvasToolbar />
            <SketchCanvas />
          </article>

          <article className="bg-[#efefef]">
            <h1 className="text-[2.75rem] font-semibold leading-none md:text-[2.35rem]">New Entry</h1>
            <p className="mt-2 min-h-6 text-sm text-[#54504a]">
              {uploadedFileName ? `Uploaded: ${uploadedFileName}` : "No document selected"}
            </p>

            <form className="mt-4 space-y-4 md:mt-6">
              <Field label="Name">
                <input type="text" name="name" className={FIELD_CLASS} />
              </Field>

              <Field label="Type">
                <select name="type" defaultValue="" className={FIELD_CLASS}>
                  <option value="" disabled>
                    Select
                  </option>
                  <option value="M4">M4</option>
                  <option value="M5">M5</option>
                  <option value="M6">M6</option>
                </select>
              </Field>

              <Field label="Sizing">
                <select name="sizing" defaultValue="" className={FIELD_CLASS}>
                  <option value="" disabled>
                    Select
                  </option>
                  <option value="Length 20mm">Length 20mm</option>
                  <option value="Length 40mm">Length 40mm</option>
                  <option value="Length 60mm">Length 60mm</option>
                </select>
              </Field>

              <Field label="Quantity">
                <select name="quantity" defaultValue="" className={FIELD_CLASS}>
                  <option value="" disabled>
                    Select
                  </option>
                  <option value="10">10</option>
                  <option value="25">25</option>
                  <option value="50">50</option>
                  <option value="100">100</option>
                </select>
              </Field>

              <Field label="Part">
                <select name="part" defaultValue="" className={FIELD_CLASS}>
                  <option value="" disabled>
                    Select
                  </option>
                  <option value="threaded-rod">Threaded Rod</option>
                  <option value="washer">Washer</option>
                  <option value="locking-nut">Locking Nut</option>
                </select>
              </Field>

              <Field label="Label">
                <select name="label" defaultValue="" className={FIELD_CLASS}>
                  <option value="" disabled>
                    Select
                  </option>
                  <option value="inspected">Inspected</option>
                  <option value="priority">Priority</option>
                  <option value="replace">Replace</option>
                </select>
              </Field>
            </form>
          </article>
        </section>
      </main>
    </div>
  );
}

function CanvasToolbar() {
  return (
    <div className="flex items-center justify-between border-b border-[#bcb5aa] bg-[#d9d9d9] px-4 py-2">
      <div className="inline-flex items-center gap-5 text-[1.15rem] text-[#101010] md:text-[0.98rem]">
        <span className="inline-flex items-center gap-1">
          <PenIcon className="h-[18px] w-[18px]" />
          Sketch
        </span>
        <span className="inline-flex items-center gap-1">
          <PulseIcon className="h-[18px] w-[18px]" />
          Label
        </span>
      </div>

      <ArrowIcon className="h-5 w-5" />
    </div>
  );
}

function SketchCanvas() {
  const canvasRef = useRef(null);
  const containerRef = useRef(null);
  const [activeTool, setActiveTool] = useState("draw");
  const [isDrawing, setIsDrawing] = useState(false);
  const activeToolRef = useRef("draw");

  useEffect(() => {
    activeToolRef.current = activeTool;
  }, [activeTool]);

  useEffect(() => {
    const updateCanvasSize = () => {
      const canvas = canvasRef.current;
      const container = containerRef.current;
      if (!canvas || !container) return;

      const { width, height } = container.getBoundingClientRect();
      if (!width || !height) return;

      const snapshot = document.createElement("canvas");
      snapshot.width = canvas.width;
      snapshot.height = canvas.height;
      snapshot.getContext("2d")?.drawImage(canvas, 0, 0);

      canvas.width = width;
      canvas.height = height;

      const context = canvas.getContext("2d");
      if (!context) return;

      context.lineCap = "round";
      context.lineJoin = "round";
      context.drawImage(snapshot, 0, 0, width, height);
    };

    updateCanvasSize();
    window.addEventListener("resize", updateCanvasSize);
    return () => window.removeEventListener("resize", updateCanvasSize);
  }, []);

  const resolvePoint = (event) => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    const bounds = canvas.getBoundingClientRect();
    return { x: event.clientX - bounds.left, y: event.clientY - bounds.top };
  };

  const handlePointerDown = (event) => {
    const canvas = canvasRef.current;
    const context = canvas?.getContext("2d");
    const point = resolvePoint(event);
    if (!canvas || !context || !point) return;

    setIsDrawing(true);
    canvas.setPointerCapture(event.pointerId);
    context.beginPath();
    context.moveTo(point.x, point.y);
  };

  const handlePointerMove = (event) => {
    if (!isDrawing) return;

    const context = canvasRef.current?.getContext("2d");
    const point = resolvePoint(event);
    if (!context || !point) return;

    if (activeToolRef.current === "erase") {
      context.globalCompositeOperation = "destination-out";
      context.lineWidth = 28;
    } else {
      context.globalCompositeOperation = "source-over";
      context.strokeStyle = "#1e75c9";
      context.lineWidth = 5;
    }

    context.lineTo(point.x, point.y);
    context.stroke();
  };

  const endStroke = () => {
    if (!isDrawing) return;
    const context = canvasRef.current?.getContext("2d");
    context?.closePath();
    setIsDrawing(false);
  };

  const clearSketch = () => {
    const canvas = canvasRef.current;
    const context = canvas?.getContext("2d");
    if (!canvas || !context) return;
    context.clearRect(0, 0, canvas.width, canvas.height);
  };

  return (
    <div className="px-2 pb-2 md:px-3 md:pb-3">
      <div className="mb-2 flex items-center gap-2 border-b border-[#cbc4b8] py-2">
        <ToolButton active={activeTool === "draw"} onClick={() => setActiveTool("draw")}>
          Draw
        </ToolButton>
        <ToolButton active={activeTool === "erase"} onClick={() => setActiveTool("erase")}>
          Erase
        </ToolButton>
        <button
          type="button"
          onClick={clearSketch}
          className="rounded border border-[#9f988b] px-2 py-1 text-sm text-[#151515] transition-colors hover:bg-[#d8d3cb]"
        >
          Clear
        </button>
      </div>

      <div ref={containerRef} className="relative h-[360px] w-full overflow-hidden border border-[#948c7f] bg-[#b2bcc1] md:h-[520px]">
        <img
          src="/placeholder-document.svg"
          alt="Placeholder document preview"
          className="absolute inset-0 h-full w-full object-cover"
        />
        <canvas
          ref={canvasRef}
          className={`absolute inset-0 h-full w-full touch-none ${
            activeTool === "erase" ? "cursor-cell" : "cursor-crosshair"
          }`}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={endStroke}
          onPointerLeave={endStroke}
        />
      </div>
    </div>
  );
}

function ToolButton({ active, onClick, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded border px-2 py-1 text-sm transition-colors ${
        active
          ? "border-[#7f786b] bg-[#c8c1b4] text-[#121212]"
          : "border-[#9f988b] text-[#151515] hover:bg-[#d8d3cb]"
      }`}
    >
      {children}
    </button>
  );
}

function Field({ label, children }) {
  return (
    <label className="block">
      <span className="mb-1 block text-[2rem] leading-none md:text-[1.35rem]">{label}</span>
      {children}
    </label>
  );
}

function formatProjectName(projectId) {
  if (!projectId) return "Untitled";

  return decodeURIComponent(projectId)
    .trim()
    .replace(/[-_]+/g, " ")
    .replace(/\s+/g, " ")
    .replace(/\b\w/g, (character) => character.toUpperCase());
}

function PenIcon({ className = "" }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className={className}>
      <path
        d="m5 19 2.5-.5L18 8a1.7 1.7 0 0 0 0-2.4l-.6-.6a1.7 1.7 0 0 0-2.4 0L4.5 15.5 4 18Zm7-11 3 3"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function PulseIcon({ className = "" }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className={className}>
      <path
        d="M3 12h4l2-4 3 8 2-4h7"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function ArrowIcon({ className = "" }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className={className}>
      <path
        d="M6 12h12m0 0-4-4m4 4-4 4"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
