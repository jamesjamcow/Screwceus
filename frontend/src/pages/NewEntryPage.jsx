import { useEffect, useMemo, useRef, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Image as KonvaImage, Layer, Line, Stage } from "react-konva";
import { useLocation, useNavigate, useOutletContext, useParams } from "react-router-dom";

import PartCard from "../components/parts/PartCard";
import HomeTopNav from "../components/home/HomeTopNav";
import { useAuthedApi } from "../hooks/useAuthedApi";
import { PART_FIELDS, PART_FORM_DEFAULT_VALUES, partFormSchema } from "../lib/partSchema";
import { toPathSafeProjectId } from "../lib/projectRouting";
import { createProjectPartEntry } from "../services/driveService";

const FIELD_CLASS =
  "h-10 w-full rounded-[4px] border bg-[#efefef] px-3 text-[1.55rem] text-[#141414] focus:outline-none md:text-[1.12rem]";

const DRAW_STROKE = {
  color: "#1e75c9",
  width: 5,
};

const ERASER_STROKE = {
  width: 26,
};

export default function NewEntryPage() {
  const { project } = useOutletContext();
  const location = useLocation();
  const navigate = useNavigate();
  const { projectId } = useParams();
  const { authedFetch } = useAuthedApi();

  const projectName = project.name;
  const targetProjectId = useMemo(() => toPathSafeProjectId(projectId), [projectId]);
  const documentSource = useMemo(() => {
    const state = location.state ?? {};
    const name = state.documentName ?? state.uploadedFileName ?? "";
    const url = state.documentUrl ?? "";
    const mimeType = state.documentMimeType ?? "";

    return {
      sourceType: state.sourceType ?? "",
      name,
      url,
      mimeType,
      photoId: state.photoId ?? null,
      screenshotId: state.screenshotId ?? null,
    };
  }, [location.state]);
  const [submittedEntry, setSubmittedEntry] = useState(null);
  const [submitError, setSubmitError] = useState("");
  const [annotationState, setAnnotationState] = useState({ stageSize: { width: 0, height: 0 }, lines: [] });

  const {
    register,
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(partFormSchema),
    defaultValues: PART_FORM_DEFAULT_VALUES,
  });

  const handleValidSubmit = async (values) => {
    setSubmitError("");

    try {
      const projectPart = await authedFetch((token) =>
        createProjectPartEntry(token, {
          projectId: project.id,
          values: {
            name: values.name,
            type: values.type,
            dimensions: values.dimensions,
            notes: values.notes,
            quantity_needed: values.quantityNeeded,
            source_image_url: documentSource.url,
            annotation_json: buildAnnotationJson(documentSource, annotationState),
          },
        }),
      );
      setSubmittedEntry(projectPart);
    } catch (error) {
      setSubmitError(error?.response?.data?.detail ?? "Could not save this entry.");
    }
  };

  const handleOpenDesignPage = () => {
    navigate(`/project/${targetProjectId}`);
  };

  const handleSavedEntryKeyDown = (event) => {
    if (event.key !== "Enter" && event.key !== " ") {
      return;
    }

    event.preventDefault();
    handleOpenDesignPage();
  };

  return (
    <div className="min-h-screen bg-[#efefef] text-[#141414]">
      <HomeTopNav />

      <main className="mx-auto w-full max-w-[1260px] px-4 pb-10 pt-5 md:px-7 md:pt-7">
        <div className="mb-4 text-[1.35rem] md:text-[1.05rem]">
          <span className="font-semibold">{projectName}</span>
        </div>

        <section className="grid gap-6 lg:grid-cols-[1.35fr_0.88fr]">
          <article className="overflow-hidden border border-[#c6c1b8] bg-[#e6e6e6]">
            <CanvasToolbar />
            <SketchCanvas documentSource={documentSource} onAnnotationChange={setAnnotationState} />
          </article>

          <article className="bg-[#efefef]">
            <h1 className="text-[2.75rem] font-semibold leading-none md:text-[2.35rem]">New Entry</h1>
            <p className="mt-2 min-h-6 text-sm text-[#54504a]">
              {documentSource.name
                ? `${documentSource.sourceType === "clipboard" ? "Pasted" : "Uploaded"}: ${documentSource.name}`
                : "No document selected"}
            </p>

            <form className="mt-4 space-y-4 md:mt-6" onSubmit={handleSubmit(handleValidSubmit)} noValidate>
              {PART_FIELDS.map((field) => {
                const error = errors[field.name]?.message;

                if (field.input === "select") {
                  return (
                    <SelectField
                      key={field.name}
                      name={field.name}
                      label={field.label}
                      control={control}
                      error={error}
                      options={field.options}
                    />
                  );
                }

                if (field.input === "json" || field.input === "textarea") {
                  return (
                    <Field key={field.name} label={field.label} error={error}>
                      <textarea
                        {...register(field.name)}
                        rows={field.input === "json" ? 6 : 4}
                        placeholder={field.placeholder}
                        spellCheck={field.input !== "json"}
                        aria-invalid={Boolean(error)}
                        className={textAreaClassName(Boolean(error), field.input === "json")}
                      />
                    </Field>
                  );
                }

                return (
                  <Field key={field.name} label={field.label} error={error}>
                    <input
                      type="text"
                      {...register(field.name)}
                      placeholder={field.placeholder}
                      aria-invalid={Boolean(error)}
                      className={fieldClassName(Boolean(error))}
                      list={field.options ? `${field.name}-options` : undefined}
                    />
                    {field.options ? (
                      <datalist id={`${field.name}-options`}>
                        {field.options.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </datalist>
                    ) : null}
                  </Field>
                );
              })}

              <Field label="How Many" error={errors.quantityNeeded?.message}>
                <input
                  type="number"
                  min="1"
                  step="1"
                  {...register("quantityNeeded")}
                  aria-invalid={Boolean(errors.quantityNeeded)}
                  className={fieldClassName(Boolean(errors.quantityNeeded))}
                />
              </Field>

              <div className="flex items-center justify-between gap-4 pt-2">
                <p className="text-sm text-[#54504a]">
                  {submitError || "Validated against the shared part schema."}
                </p>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="rounded border border-[#6f6d6a] bg-[#141414] px-4 py-2 text-sm text-[#efefef] transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isSubmitting ? "Saving..." : "Save Entry"}
                </button>
              </div>
            </form>

            {submittedEntry ? (
              <section className="mt-5">
                <h2 className="font-semibold">Latest Saved Entry</h2>
                <p className="mt-1 text-sm text-[#54504a]">Quantity: {submittedEntry.quantity_needed}</p>
                <PartCard
                  part={submittedEntry.part}
                  imageUrl={submittedEntry.source_image_url}
                  annotationJson={submittedEntry.annotation_json}
                  className="mt-2 border-[#c6c1b8] bg-[#e6e6e6]"
                  onClick={handleOpenDesignPage}
                  onKeyDown={handleSavedEntryKeyDown}
                  aria-label="Open design page"
                />
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

function SketchCanvas({ documentSource, onAnnotationChange }) {
  const containerRef = useRef(null);
  const isDrawingRef = useRef(false);
  const [activeTool, setActiveTool] = useState("draw");
  const [lines, setLines] = useState([]);
  const [stageSize, setStageSize] = useState({ width: 0, height: 0 });
  const backgroundSrc =
    documentSource.url && documentSource.mimeType.startsWith("image/")
      ? documentSource.url
      : "/placeholder-document.svg";
  const backgroundImage = useKonvaImage(backgroundSrc);

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

  useEffect(() => {
    onAnnotationChange({
      stageSize,
      lines,
    });
  }, [lines, onAnnotationChange, stageSize]);

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

function buildAnnotationJson(documentSource, annotationState) {
  if (!documentSource.url || !documentSource.mimeType.startsWith("image/")) {
    return null;
  }

  const width = annotationState?.stageSize?.width ?? 0;
  const height = annotationState?.stageSize?.height ?? 0;
  const lines = Array.isArray(annotationState?.lines) ? annotationState.lines : [];

  if (width <= 0 || height <= 0 || lines.length === 0) {
    return null;
  }

  return {
    version: 1,
    lines: lines
      .filter((line) => Array.isArray(line.points) && line.points.length >= 2)
      .map((line) => ({
        tool: line.tool,
        color: line.tool === "erase" ? undefined : DRAW_STROKE.color,
        strokeWidth:
          line.tool === "erase"
            ? ERASER_STROKE.width / Math.max(width, height)
            : DRAW_STROKE.width / Math.max(width, height),
        points: line.points.map((point, index) => {
          const size = index % 2 === 0 ? width : height;
          return Number((point / size).toFixed(4));
        }),
      })),
  };
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

function textAreaClassName(hasError, useMonoFont = false) {
  return `w-full rounded-[4px] border bg-[#efefef] px-3 py-2 text-[1.2rem] text-[#141414] focus:outline-none md:text-[1rem] ${
    useMonoFont ? "font-mono" : ""
  } ${hasError ? "border-[#9d3434]" : "border-[#6f6d6a]"}`;
}

function useKonvaImage(src) {
  const [loadedImage, setLoadedImage] = useState({ src: "", image: null });

  useEffect(() => {
    let isCurrent = true;
    const nextImage = new window.Image();
    nextImage.crossOrigin = "anonymous";
    nextImage.src = src;
    nextImage.onload = () => {
      if (isCurrent) {
        setLoadedImage({ src, image: nextImage });
      }
    };

    return () => {
      isCurrent = false;
      nextImage.onload = null;
    };
  }, [src]);

  return loadedImage.src === src ? loadedImage.image : null;
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
