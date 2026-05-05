import { useEffect, useMemo, useRef, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Image as KonvaImage, Layer, Line, Stage } from "react-konva";
import { useLocation, useParams } from "react-router-dom";
import { z } from "zod";

import HomeTopNav from "../components/home/HomeTopNav";
import { formatProjectName } from "../lib/projectRouting";

const FIELD_CLASS =
  "h-10 w-full rounded-[4px] border bg-[#efefef] px-3 text-[1.55rem] text-[#141414] focus:outline-none md:text-[1.12rem]";

const entrySchema = z.object({
  name: z.string().trim().min(2, "Enter at least 2 characters."),
  type: z.enum(["M4", "M5", "M6"], {
    error: "Choose a thread type.",
  }),
  sizing: z.enum(["Length 20mm", "Length 40mm", "Length 60mm"], {
    error: "Choose a size.",
  }),
  quantity: z.enum(["10", "25", "50", "100"], {
    error: "Choose a quantity.",
  }),
  part: z.enum(["threaded-rod", "washer", "locking-nut"], {
    error: "Choose a part category.",
  }),
  label: z.enum(["inspected", "priority", "replace"], {
    error: "Choose a label.",
  }),
});

const FORM_DEFAULT_VALUES = {
  name: "",
  type: "",
  sizing: "",
  quantity: "",
  part: "",
  label: "",
};

const DRAW_STROKE = {
  color: "#1e75c9",
  width: 5,
};

const ERASER_STROKE = {
  width: 26,
};

export default function NewEntryPage() {
  const { projectId } = useParams();
  const location = useLocation();

  const projectName = useMemo(() => formatProjectName(projectId), [projectId]);
  const uploadedFileName = location.state?.uploadedFileName;
  const [submittedEntry, setSubmittedEntry] = useState(null);

  const {
    register,
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(entrySchema),
    defaultValues: FORM_DEFAULT_VALUES,
  });

  const handleValidSubmit = (values) => {
    setSubmittedEntry(values);
  };

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

            <form className="mt-4 space-y-4 md:mt-6" onSubmit={handleSubmit(handleValidSubmit)} noValidate>
              <Field label="Name" error={errors.name?.message}>
                <input
                  type="text"
                  {...register("name")}
                  aria-invalid={Boolean(errors.name)}
                  className={fieldClassName(Boolean(errors.name))}
                />
              </Field>

              <SelectField
                name="type"
                label="Type"
                control={control}
                error={errors.type?.message}
                options={[
                  { value: "M4", label: "M4" },
                  { value: "M5", label: "M5" },
                  { value: "M6", label: "M6" },
                ]}
              />

              <SelectField
                name="sizing"
                label="Sizing"
                control={control}
                error={errors.sizing?.message}
                options={[
                  { value: "Length 20mm", label: "Length 20mm" },
                  { value: "Length 40mm", label: "Length 40mm" },
                  { value: "Length 60mm", label: "Length 60mm" },
                ]}
              />

              <SelectField
                name="quantity"
                label="Quantity"
                control={control}
                error={errors.quantity?.message}
                options={[
                  { value: "10", label: "10" },
                  { value: "25", label: "25" },
                  { value: "50", label: "50" },
                  { value: "100", label: "100" },
                ]}
              />

              <SelectField
                name="part"
                label="Part"
                control={control}
                error={errors.part?.message}
                options={[
                  { value: "threaded-rod", label: "Threaded Rod" },
                  { value: "washer", label: "Washer" },
                  { value: "locking-nut", label: "Locking Nut" },
                ]}
              />

              <SelectField
                name="label"
                label="Label"
                control={control}
                error={errors.label?.message}
                options={[
                  { value: "inspected", label: "Inspected" },
                  { value: "priority", label: "Priority" },
                  { value: "replace", label: "Replace" },
                ]}
              />

              <div className="flex items-center justify-between gap-4 pt-2">
                <p className="text-sm text-[#54504a]">Validated with React Hook Form and zod.</p>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="rounded border border-[#6f6d6a] bg-[#141414] px-4 py-2 text-sm text-[#efefef] transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  Save Entry
                </button>
              </div>
            </form>

            {submittedEntry ? (
              <section className="mt-5 rounded border border-[#c6c1b8] bg-[#e6e6e6] p-4 text-sm text-[#141414]">
                <h2 className="font-semibold">Latest Saved Draft</h2>
                <dl className="mt-2 grid grid-cols-2 gap-x-3 gap-y-1">
                  <dt>Name</dt>
                  <dd>{submittedEntry.name}</dd>
                  <dt>Type</dt>
                  <dd>{submittedEntry.type}</dd>
                  <dt>Sizing</dt>
                  <dd>{submittedEntry.sizing}</dd>
                  <dt>Quantity</dt>
                  <dd>{submittedEntry.quantity}</dd>
                  <dt>Part</dt>
                  <dd>{submittedEntry.part}</dd>
                  <dt>Label</dt>
                  <dd>{submittedEntry.label}</dd>
                </dl>
              </section>
            ) : null}
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
  const containerRef = useRef(null);
  const isDrawingRef = useRef(false);
  const [activeTool, setActiveTool] = useState("draw");
  const [lines, setLines] = useState([]);
  const [stageSize, setStageSize] = useState({ width: 0, height: 0 });
  const backgroundImage = useKonvaImage("/placeholder-document.svg");

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return undefined;

    const resizeObserver = new ResizeObserver(([entry]) => {
      const nextWidth = Math.round(entry.contentRect.width);
      const nextHeight = Math.round(entry.contentRect.height);

      setStageSize((currentSize) => {
        if (currentSize.width === nextWidth && currentSize.height === nextHeight) {
          return currentSize;
        }

        return { width: nextWidth, height: nextHeight };
      });
    });

    resizeObserver.observe(container);
    return () => resizeObserver.disconnect();
  }, []);

  const handlePointerDown = (event) => {
    const stage = event.target.getStage();
    const point = stage?.getPointerPosition();
    if (!point) return;

    isDrawingRef.current = true;
    setLines((currentLines) => [
      ...currentLines,
      {
        tool: activeTool,
        points: [point.x, point.y],
      },
    ]);
  };

  const handlePointerMove = (event) => {
    if (!isDrawingRef.current) return;

    const stage = event.target.getStage();
    const point = stage?.getPointerPosition();
    if (!point) return;

    setLines((currentLines) => {
      if (currentLines.length === 0) return currentLines;

      const nextLines = currentLines.slice();
      const lastLine = nextLines.at(-1);
      nextLines[nextLines.length - 1] = {
        ...lastLine,
        points: [...lastLine.points, point.x, point.y],
      };
      return nextLines;
    });
  };

  const handlePointerUp = () => {
    isDrawingRef.current = false;
  };

  const clearSketch = () => {
    setLines([]);
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
        <span className="ml-auto text-sm text-[#54504a]">{lines.length} annotation{lines.length === 1 ? "" : "s"}</span>
      </div>

      <div
        ref={containerRef}
        className={`relative h-[360px] w-full overflow-hidden border border-[#948c7f] bg-[#b2bcc1] md:h-[520px] ${
          activeTool === "erase" ? "cursor-cell" : "cursor-crosshair"
        }`}
      >
        {stageSize.width > 0 && stageSize.height > 0 ? (
          <Stage
            width={stageSize.width}
            height={stageSize.height}
            className="touch-none"
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerLeave={handlePointerUp}
          >
            <Layer listening={false}>
              {backgroundImage ? (
                <KonvaImage
                  image={backgroundImage}
                  x={0}
                  y={0}
                  width={stageSize.width}
                  height={stageSize.height}
                />
              ) : null}
            </Layer>
            <Layer>
              {lines.map((line, index) => (
                <Line
                  key={`${line.tool}-${index}`}
                  points={line.points}
                  stroke={line.tool === "erase" ? "#000" : DRAW_STROKE.color}
                  strokeWidth={line.tool === "erase" ? ERASER_STROKE.width : DRAW_STROKE.width}
                  lineCap="round"
                  lineJoin="round"
                  globalCompositeOperation={line.tool === "erase" ? "destination-out" : "source-over"}
                  tension={0.15}
                />
              ))}
            </Layer>
          </Stage>
        ) : null}
      </div>
    </div>
  );
}

function SelectField({ name, label, control, error, options }) {
  return (
    <Field label={label} error={error}>
      <Controller
        name={name}
        control={control}
        render={({ field }) => (
          <select
            {...field}
            aria-invalid={Boolean(error)}
            className={fieldClassName(Boolean(error))}
          >
            <option value="" disabled>
              Select
            </option>
            {options.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        )}
      />
    </Field>
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

function Field({ label, error, children }) {
  return (
    <label className="block">
      <span className="mb-1 block text-[2rem] leading-none md:text-[1.35rem]">{label}</span>
      {children}
      <span className="mt-1 block min-h-5 text-sm text-[#9d3434]">{error ?? ""}</span>
    </label>
  );
}

function fieldClassName(hasError) {
  return `${FIELD_CLASS} ${hasError ? "border-[#9d3434]" : "border-[#6f6d6a]"}`;
}

function useKonvaImage(src) {
  const [image, setImage] = useState(null);

  useEffect(() => {
    const nextImage = new window.Image();
    nextImage.src = src;
    nextImage.onload = () => setImage(nextImage);
  }, [src]);

  return image;
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
