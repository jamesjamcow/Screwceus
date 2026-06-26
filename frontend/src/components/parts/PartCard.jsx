import { PART_FIELDS, formatPartValue } from "../../lib/partSchema";

export default function PartCard({
  part,
  badge,
  preview,
  footer,
  selected = false,
  className = "",
  onClick,
  onKeyDown,
  ...props
}) {
  const interactive = Boolean(onClick || onKeyDown);

  return (
    <article
      role={interactive ? "button" : undefined}
      tabIndex={interactive ? 0 : undefined}
      onClick={onClick}
      onKeyDown={onKeyDown}
      {...props}
      className={`part-card relative rounded-lg border px-4 py-4 shadow-[0_1px_0_rgba(0,0,0,0.04)] transition-colors ${
        selected
          ? "border-[#c84545] bg-[#f7e3e3] ring-1 ring-[#c84545]"
          : interactive
            ? "border-[#b8b0a5] bg-[#efefef] hover:bg-[#e8e5df]"
            : "border-[#b8b0a5] bg-[#efefef]"
      } ${className}`}
    >
      {badge ? <div className="absolute right-4 top-3 text-[0.95rem] text-[#4b463e]">{badge}</div> : null}

      <div className={preview ? "grid gap-4 md:grid-cols-[108px_1fr] md:items-start" : ""}>
        {preview ? (
          <div className="flex h-[88px] w-[88px] items-center justify-center rounded bg-[#e7e6e2] md:h-[96px] md:w-[108px]">
            {preview}
          </div>
        ) : null}

        <div className="grid gap-x-4 gap-y-3 md:grid-cols-2">
          {PART_FIELDS.map((field) => (
            <div key={field.name} className={field.name === "notes" ? "md:col-span-2" : ""}>
              <p className="text-[0.72rem] uppercase tracking-[0.14em] text-[#6f6a60]">{field.label}</p>
              <p className={`mt-1 text-[0.98rem] text-[#141414] ${field.name === "notes" ? "whitespace-pre-line" : ""}`}>
                {formatPartValue(field.name, part[field.name])}
              </p>
            </div>
          ))}
        </div>
      </div>

      {footer ? <div className="mt-3 border-t border-[#ddd5c7] pt-3 text-[0.82rem] text-[#5d5d5d]">{footer}</div> : null}
    </article>
  );
}
