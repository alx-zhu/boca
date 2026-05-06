import type { ChartSpec } from "@/types/charts";

export type ValidationResult =
  | { ok: true; spec: ChartSpec }
  | { ok: false; reason: string };

const VALID_TYPES = new Set(["bar", "line", "scatter"]);

export function validateSpec(input: unknown): ValidationResult {
  if (!input || typeof input !== "object") {
    return { ok: false, reason: "Input must be an object." };
  }
  const spec = input as Partial<ChartSpec>;

  if (!spec.type || !VALID_TYPES.has(spec.type)) {
    return {
      ok: false,
      reason: `Invalid type "${spec.type}". Must be one of: bar, line, scatter.`,
    };
  }
  if (!spec.title || typeof spec.title !== "string") {
    return { ok: false, reason: "Missing required field: title." };
  }
  if (!Array.isArray(spec.data) || spec.data.length === 0) {
    return { ok: false, reason: "Field 'data' must be a non-empty array." };
  }
  if (!spec.xKey || !spec.yKey) {
    return { ok: false, reason: "Both xKey and yKey are required." };
  }

  const sample = spec.data[0] as Record<string, unknown>;
  const available = Object.keys(sample);

  if (!(spec.xKey in sample)) {
    return {
      ok: false,
      reason: `xKey "${spec.xKey}" not found in data. Available keys: ${available.join(", ")}.`,
    };
  }

  if (spec.series && spec.series.length > 0) {
    for (const s of spec.series) {
      if (!(s.key in sample)) {
        return {
          ok: false,
          reason: `Series key "${s.key}" not found in data. Available keys: ${available.join(", ")}.`,
        };
      }
    }
  } else if (!(spec.yKey in sample)) {
    return {
      ok: false,
      reason: `yKey "${spec.yKey}" not found in data. Available keys: ${available.join(", ")}.`,
    };
  }

  return { ok: true, spec: spec as ChartSpec };
}
