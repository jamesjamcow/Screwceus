import { z } from "zod";

export const PART_TYPE_OPTIONS = [
  { value: "fastener", label: "Fastener" },
  { value: "spacer", label: "Spacer" },
  { value: "bearing", label: "Bearing" },
  { value: "connector", label: "Connector" },
  { value: "bracket", label: "Bracket" },
];

export const PART_FIELDS = [
  {
    name: "name",
    label: "Name",
    input: "text",
    placeholder: "Drive screw",
  },
  {
    name: "type",
    label: "Type",
    input: "text",
    placeholder: "fastener",
    options: PART_TYPE_OPTIONS,
  },
  {
    name: "dimensions",
    label: "Dimensions",
    input: "json",
    placeholder: '{\n  "thread": "M4",\n  "length": "40mm"\n}',
  },
  {
    name: "notes",
    label: "Notes",
    input: "textarea",
    placeholder: "Assembly notes or handling instructions.",
  },
];

export const PART_FORM_DEFAULT_VALUES = {
  name: "",
  type: "",
  dimensions: "",
  notes: "",
  quantityNeeded: 1,
};

export const partFormSchema = z.object({
  name: z.string().trim().min(1, "Enter a name."),
  type: z.string().trim().min(1, "Enter a type."),
  dimensions: z
    .string()
    .trim()
    .min(1, "Enter dimensions as JSON.")
    .refine(isJsonObjectString, "Enter a valid JSON object.")
    .transform((value) => JSON.parse(value)),
  notes: z.string().trim(),
  quantityNeeded: z.coerce.number().int("Enter a whole number.").min(1, "Enter at least 1."),
});

const PART_FIXTURES = [
  {
    name: "Drive Screw",
    type: "fastener",
    dimensions: { thread: "M4", length: "40mm", material: "Steel" },
    notes: "Primary chassis fastener.",
  },
  {
    name: "Rail Spacer",
    type: "spacer",
    dimensions: { outerDiameter: "8mm", innerDiameter: "4.3mm", length: "12mm" },
    notes: "Separates the side rails during final assembly.",
  },
  {
    name: "Guide Bearing",
    type: "bearing",
    dimensions: { innerDiameter: "5mm", outerDiameter: "16mm", width: "5mm" },
    notes: "Keep lightly lubricated before install.",
  },
  {
    name: "Signal Connector",
    type: "connector",
    dimensions: { pitch: "2.5mm", pins: 4, series: "JST-XH" },
    notes: "Route away from the motor leads.",
  },
  {
    name: "Mount Bracket",
    type: "bracket",
    dimensions: { width: "120mm", height: "35mm", thickness: "3mm" },
    notes: "Deburr edges before fit check.",
  },
];

export function createPartRecords() {
  return PART_FIXTURES.map((part, index) => ({
    id: index + 1,
    ...part,
  }));
}

export function formatPartValue(fieldName, value) {
  if (fieldName === "type") {
    return PART_TYPE_OPTIONS.find((option) => option.value === value)?.label ?? value ?? "—";
  }

  if (fieldName === "dimensions") {
    return formatDimensions(value);
  }

  if (fieldName === "notes") {
    return value || "No notes";
  }

  return value || "—";
}

function isJsonObjectString(value) {
  try {
    const parsed = JSON.parse(value);
    return Boolean(parsed) && typeof parsed === "object" && !Array.isArray(parsed);
  } catch {
    return false;
  }
}

function formatDimensions(value) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return "—";
  }

  const entries = Object.entries(value);
  if (entries.length === 0) {
    return "{}";
  }

  return entries
    .map(([key, itemValue]) => `${formatDimensionKey(key)}: ${formatDimensionValue(itemValue)}`)
    .join(" · ");
}

function formatDimensionKey(key) {
  return key
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/[_-]+/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function formatDimensionValue(value) {
  if (value === null) {
    return "null";
  }

  if (typeof value === "object") {
    return JSON.stringify(value);
  }

  return String(value);
}
