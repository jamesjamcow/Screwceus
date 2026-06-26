import { useEffect, useMemo, useRef, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Arrow as KonvaArrow, Image as KonvaImage, Layer, Line, Stage } from "react-konva";
import { useLocation, useParams } from "react-router-dom";

import PartCard from "../components/parts/PartCard";
import {
  getCreatePartErrorMessage,
  getProjectPartErrorMessage,
  useAddProjectPart,
  useCreatePart,
} from "../hooks/useDrive";
import { PART_FIELDS, PART_FORM_DEFAULT_VALUES, partFormSchema } from "../lib/partSchema";

const FIELD_CLASS =
  "h-10 w-full rounded-[4px] border bg-[#efefef] px-3 text-[1.55rem] text-[#141414] focus:outline-none md:text-[1.12rem]";

const DRAW_STROKE = {
  color: "#1e75c9",
  width: 5,
};

const ERASER_STROKE = {
  width: 26,
};

const ARROW_STROKE = {
  color: DRAW_STROKE.color,
  width: 5,
  pointerLength: 18,
  pointerWidth: 16,
};

export default function NewEntryPage() {
  const location = useLocation();
  const { projectId } = useParams();
  const createPartMutation = useCreatePart();
  const addProjectPartMutation = useAddProjectPart(projectId);

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

  const {
    register,
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(partFormSchema),
    defaultValues: PART_FORM_DEFAULT_VALUES,
  });
  const isSaving = isSubmitting || createPartMutation.isPending || addProjectPartMutation.isPending;
  const apiError = createPartMutation.error
    ? getCreatePartErrorMessage(createPartMutation.error)
    : addProjectPartMutation.error
      ? getProjectPartErrorMessage(addProjectPartMutation.error)
      : "";

  const handleValidSubmit = async (values) => {
    setSubmittedEntry(null);
    try {
      const createdPart = await createPartMutation.mutateAsync(values);
      await addProjectPartMutation.mutateAsync({ partId: createdPart.id });
      setSubmittedEntry(createdPart);
    } catch {
      // Mutation errors are rendered below the form.
    }
  };

  return (
    <div className="project-page min-h-full text-[#dddde0] project-entry-page">
      <main className="project-page__inner my-0 mx-auto pt-[36px] pr-0 pb-[64px] pl-0 [@media_(max-width:720px)]:pt-[26px] [@media_(max-width:720px)]:pr-0 [@media_(max-width:720px)]:pb-[44px] [@media_(max-width:720px)]:pl-0 project-entry-page__inner [@media_(max-width:720px)]:pt-[26px] [@media_(max-width:720px)]:pr-0 [@media_(max-width:720px)]:pb-[44px] [@media_(max-width:720px)]:pl-0">
        <div className="project-page__section-heading flex items-end justify-between gap-[40px] mb-[24px] [&>div>span]:block [&>div>span]:mb-[7px] [&>div>span]:text-[#64666c] [&>div>span]:text-[10px] [&>div>span]:font-[680] [&>div>span]:tracking-[.1em] [&>div>span]:uppercase [&_h1]:m-0 [&_h1]:text-[#eeeeef] [&_h1]:text-[22px] [&_h1]:font-[560] [&_h1]:tracking-[-.035em] [&_h1]:leading-[1.05] [&_h2]:m-0 [&_h2]:text-[#eeeeef] [&_h2]:text-[22px] [&_h2]:font-[560] [&_h2]:tracking-[-.035em] [&_h2]:leading-[1.05] [&_h2]:text-[17px] [&>p]:max-w-[430px] [&>p]:m-0 [&>p]:text-[#77797e] [&>p]:text-[12px] [&>p]:leading-[1.55] [&>p]:text-right [@media_(max-width:720px)]:items-start [@media_(max-width:720px)]:flex-col [@media_(max-width:720px)]:gap-[10px] [@media_(max-width:720px)]:[&>p]:text-left">
          <div><span>Design intake</span><h1>New part entry</h1></div>
          <p>Mark up the source document and capture the matching inventory details.</p>
        </div>

        <section className="project-entry-grid grid gap-[22px] [@media_(max-width:980px)]:grid-cols-1">
          <article className="project-entry-canvas min-w-0 border-0 rounded-none bg-transparent overflow-visible">
            <SketchCanvas documentSource={documentSource} />
          </article>

          <article className="project-entry-form-panel min-w-0 border-0 rounded-none bg-transparent p-0 [&_select_option]:text-[#d7d7da] [&_select_option]:bg-[#17181a]">
            <h2 className="project-entry-form-panel__title m-0 text-[#eeeeef] text-[17px] font-[560]">Part details</h2>
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
                    />
                  </Field>
                );
              })}

              <div className="flex items-center justify-between gap-4 pt-2">
                <p className="text-sm text-[#54504a]">Validated against the shared part schema.</p>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="project-page__button min-h-[32px] py-0 px-[13px] border border-[#35363b] rounded-[6px] text-[#c7c7ca] bg-[#1a1b1e] text-[12px] cursor-pointer [&:hover]:border-[#47494f] [&:hover]:text-[#fff] [&:hover]:bg-[#222327] [&:disabled]:opacity-[.5] [&:disabled]:cursor-not-allowed project-page__button--primary border-[#6c72cf] text-[#fff] bg-[#5964c7] [&:hover]:border-[#7e84dc] [&:hover]:bg-[#6570d2]"
                >
                  {isSaving ? "Saving..." : "Save Entry"}
                </button>
              </div>
            </form>

            {apiError ? <p role="alert" className="project-page__error mt-[12px] mr-0 mb-0 ml-0 text-[#df8f96] text-[12px] text-center mt-4">{apiError}</p> : null}

            {submittedEntry ? (
              <section className="mt-5">
                <h2 className="font-semibold">Saved part</h2>
                <PartCard part={submittedEntry} className="mt-2 border-[#c6c1b8] bg-[#e6e6e6]" />
              </section>
            ) : null}
          </article>
        </section>
      </main>
    </div>
  );
}

function SketchCanvas({ documentSource }) {
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
        points: activeTool === "arrow" ? [point.x, point.y, point.x, point.y] : [point.x, point.y],
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
        points:
          lastLine.tool === "arrow"
            ? [lastLine.points[0], lastLine.points[1], point.x, point.y]
            : [...lastLine.points, point.x, point.y],
      };
      return nextLines;
    });
  };

  const handlePointerUp = () => {
    if (!isDrawingRef.current) return;

    isDrawingRef.current = false;
    setLines((currentLines) => {
      const lastLine = currentLines.at(-1);
      if (!lastLine || lastLine.tool !== "arrow") return currentLines;

      const [startX, startY, endX, endY] = lastLine.points;
      const distance = Math.hypot(endX - startX, endY - startY);
      return distance < 6 ? currentLines.slice(0, -1) : currentLines;
    });
  };

  const clearSketch = () => {
    setLines([]);
  };

  return (
    <div className="project-entry-sketch min-w-0">
      <div className="project-entry-sketch-tools min-h-[32px] flex items-center gap-[6px] mb-[10px]" aria-label="Sketch tools">
        <ToolButton active={activeTool === "draw"} icon={<PenIcon />} onClick={() => setActiveTool("draw")}>
          Draw
        </ToolButton>
        <ToolButton active={activeTool === "erase"} icon={<EraserIcon />} onClick={() => setActiveTool("erase")}>
          Erase
        </ToolButton>
        <ToolButton active={activeTool === "arrow"} icon={<ArrowIcon />} onClick={() => setActiveTool("arrow")}>
          Arrow
        </ToolButton>
        <button
          type="button"
          onClick={clearSketch}
          className="project-entry-tool-button min-h-[30px] inline-flex items-center gap-[6px] py-0 px-[9px] border-0 rounded-[5px] text-[#a3a5ab] bg-transparent text-[12px] cursor-pointer [&:hover]:text-[#f3f3f5] [&:hover]:bg-[#202126] [&.is-active]:text-[#f3f3f5] [&.is-active]:bg-[#202126] [&.is-active]:bg-[#262936] [&_svg]:w-[16px] [&_svg]:h-[16px] [&_svg]:flex-none project-entry-tool-button--clear text-[#85878d]"
        >
          <TrashIcon />
          Clear
        </button>
        <span className="project-entry-annotation-count ml-auto text-[#77797e] text-[12px] whitespace-nowrap">
          {lines.length} annotation{lines.length === 1 ? "" : "s"}
        </span>
      </div>

      <div
        ref={containerRef}
        className={`project-entry-canvas-frame relative w-full h-[360px] overflow-hidden border border-[#303136] bg-[#101113] [@media_(min-width:768px)]:h-[520px] ${
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
              {lines.map((line, index) =>
                line.tool === "arrow" ? (
                  <KonvaArrow
                    key={`${line.tool}-${index}`}
                    points={line.points}
                    stroke={ARROW_STROKE.color}
                    strokeWidth={ARROW_STROKE.width}
                    fill={ARROW_STROKE.color}
                    lineCap="round"
                    lineJoin="round"
                    pointerLength={ARROW_STROKE.pointerLength}
                    pointerWidth={ARROW_STROKE.pointerWidth}
                    globalCompositeOperation="source-over"
                  />
                ) : (
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
                )
              )}
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

function ToolButton({ active, icon, onClick, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`project-entry-tool-button min-h-[30px] inline-flex items-center gap-[6px] py-0 px-[9px] border-0 rounded-[5px] text-[#a3a5ab] bg-transparent text-[12px] cursor-pointer [&:hover]:text-[#f3f3f5] [&:hover]:bg-[#202126] [&.is-active]:text-[#f3f3f5] [&.is-active]:bg-[#202126] [&.is-active]:bg-[#262936] [&_svg]:w-[16px] [&_svg]:h-[16px] [&_svg]:flex-none ${active ? "is-active" : ""}`}
    >
      {icon}
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

function EraserIcon({ className = "" }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className={className}>
      <path
        d="m4 15 8.8-8.8a2 2 0 0 1 2.8 0l2.2 2.2a2 2 0 0 1 0 2.8L11 19H6.8L4 16.2Zm6.6 4H20M8.8 10.2l5 5"
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

function TrashIcon({ className = "" }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className={className}>
      <path
        d="M5 7h14m-9 4v6m4-6v6M9 7l.5-2h5l.5 2m2 0-.6 12H7.6L7 7"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
