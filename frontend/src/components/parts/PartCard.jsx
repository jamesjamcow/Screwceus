import { useId } from "react";

import { PART_FIELDS, formatPartValue } from "../../lib/partSchema";

export default function PartCard({
  part,
  badge = part?.id ? `#${part.id}` : "",
  preview,
  imageUrl = "",
  annotationJson = null,
  footer,
  selected = false,
  className = "",
  onClick,
  onKeyDown,
  ...props
}) {
  const interactive = Boolean(onClick || onKeyDown);
  const displayPart = part ?? {};
  const hasCustomPreview = preview !== undefined;
  const cardPreview = hasCustomPreview
    ? preview
    : imageUrl
      ? <AnnotatedPartPreview imageUrl={imageUrl} annotationJson={annotationJson} />
      : <DefaultPartPreview />;

  return (
    <article
      role={interactive ? "button" : undefined}
      tabIndex={interactive ? 0 : undefined}
      onClick={onClick}
      onKeyDown={onKeyDown}
      {...props}
      className={`relative rounded-lg border px-4 py-4 shadow-[0_1px_0_rgba(0,0,0,0.04)] transition-colors ${
        selected
          ? "border-[#c84545] bg-[#f7e3e3] ring-1 ring-[#c84545]"
          : interactive
            ? "border-[#b8b0a5] bg-[#efefef] hover:bg-[#e8e5df]"
            : "border-[#b8b0a5] bg-[#efefef]"
      } ${className}`}
    >
      {badge ? <div className="absolute right-4 top-3 text-[0.95rem] text-[#4b463e]">{badge}</div> : null}

      <div className={cardPreview ? "grid gap-4 md:grid-cols-[108px_1fr] md:items-start" : ""}>
        {cardPreview ? (
          <div className="flex h-[88px] w-[88px] items-center justify-center overflow-hidden rounded bg-[#e7e6e2] md:h-[96px] md:w-[108px]">
            {cardPreview}
          </div>
        ) : null}

        <div className="grid gap-x-4 gap-y-3 md:grid-cols-2">
          {PART_FIELDS.map((field) => (
            <div key={field.name}>
              <p className="text-[0.72rem] uppercase tracking-[0.14em] text-[#6f6a60]">{field.label}</p>
              <p className={`mt-1 text-[0.98rem] text-[#141414] ${field.name === "notes" ? "whitespace-pre-line" : ""}`}>
                {formatPartValue(field.name, displayPart[field.name])}
              </p>
            </div>
          ))}
        </div>
      </div>

      {footer ? <div className="mt-3 border-t border-[#ddd5c7] pt-3 text-[0.82rem] text-[#5d5d5d]">{footer}</div> : null}
    </article>
  );
}

function DefaultPartPreview() {
  return (
    <img
      src="/placeholder-document.svg"
      alt=""
      className="h-14 w-14 object-contain opacity-80"
      aria-hidden="true"
    />
  );
}

function AnnotatedPartPreview({ imageUrl, annotationJson }) {
  const reactId = useId();
  const maskId = `part-annotation-mask-${reactId.replace(/[^a-zA-Z0-9_-]/g, "")}`;
  const lines = Array.isArray(annotationJson?.lines) ? annotationJson.lines : [];
  const drawLines = lines.filter((line) => line.tool !== "erase");
  const eraseLines = lines.filter((line) => line.tool === "erase");

  return (
    <div className="relative h-full w-full">
      <img src={imageUrl} alt="" className="absolute inset-0 h-full w-full object-fill" aria-hidden="true" />
      {drawLines.length > 0 ? (
        <svg
          viewBox="0 0 1 1"
          preserveAspectRatio="none"
          className="pointer-events-none absolute inset-0 h-full w-full"
          aria-hidden="true"
        >
          {eraseLines.length > 0 ? (
            <mask id={maskId}>
              <rect x="0" y="0" width="1" height="1" fill="white" />
              {eraseLines.map((line, index) => (
                <polyline
                  key={`erase-${index}`}
                  points={formatAnnotationPoints(line.points)}
                  fill="none"
                  stroke="black"
                  strokeWidth={line.strokeWidth ?? 0.035}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              ))}
            </mask>
          ) : null}
          <g mask={eraseLines.length > 0 ? `url(#${maskId})` : undefined}>
            {drawLines.map((line, index) => (
              <polyline
                key={`draw-${index}`}
                points={formatAnnotationPoints(line.points)}
                fill="none"
                stroke={line.color ?? "#1e75c9"}
                strokeWidth={line.strokeWidth ?? 0.008}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            ))}
          </g>
        </svg>
      ) : null}
    </div>
  );
}

function formatAnnotationPoints(points) {
  if (!Array.isArray(points)) {
    return "";
  }

  const pairs = [];
  for (let index = 0; index < points.length - 1; index += 2) {
    pairs.push(`${points[index]},${points[index + 1]}`);
  }

  return pairs.join(" ");
}
