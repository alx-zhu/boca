import type {
  PuddsTrial,
  PuddsIngredient,
  IngredientSpecFlat,
  SensoryMetricKey,
  AnalysisLog,
  SensoryEvaluation,
} from "@/types/sources";

// ─────────────────────────────────────────────────────────────────────────────
// One uniform filter shape for every table.
//
//   fieldContains: [
//     { field: "flavor",         values: ["chocolate"] },
//     { field: "ingredientName", values: ["xanthan", "guar"] },
//   ]
//
// Within an entry, values are OR-combined. Across entries, AND-combined.
// All matches are case-insensitive substring.
// ─────────────────────────────────────────────────────────────────────────────

export interface TableFilter {
  fieldContains?: Array<{ field: string; values: string[] }>;
}

// Field enums per table — these are the only `field` values the LLM should pass.

export const TRIAL_FIELDS = [
  "trialNumber",
  "name",
  "flavor",
  "processingType",
  "date",
  "ingredientName",
  "ingredientType",
] as const;

export const INGREDIENT_FIELDS = [
  "id",
  "name",
  "abbreviation",
  "type",
  "cost",
  "solid",
] as const;

export const SPEC_FIELDS = [
  "id",
  "product_name",
  "supplier",
  "ingredient_function",
  "e_number",
  "cas_number",
  "country_of_origin",
  "spec_date",
  "typical_use_level",
  "typical_applications",
  "description",
  "features_benefits",
  "directions_for_use",
  "moisture_pct",
  "ph",
  "viscosity",
  "protein_pct",
  "particle_size",
  "appearance_color",
  "allergens",
  "kosher",
  "halal",
  "non_gmo",
  "regulatory_status",
  "shelf_life_months",
  "storage_conditions",
  "packaging_size",
] as const;

type TrialField = (typeof TRIAL_FIELDS)[number];
type IngredientField = (typeof INGREDIENT_FIELDS)[number];

// ─────────────────────────────────────────────────────────────────────────────
// Per-table field → string[] accessors. Returning a list lets nested arrays
// (e.g. trial.ingredients.name) participate in matching with no special case.
// ─────────────────────────────────────────────────────────────────────────────

const trialAccessor: Record<TrialField, (t: PuddsTrial) => string[]> = {
  trialNumber: (t) => [String(t.trialNumber)],
  name: (t) => (t.name ? [t.name] : []),
  flavor: (t) => (t.setup?.flavor ? [t.setup.flavor] : []),
  processingType: (t) =>
    t.setup?.processingType ? [t.setup.processingType] : [],
  date: (t) => [t.setup?.date ?? t.createdAt],
  ingredientName: (t) => t.ingredients.map((i) => i.name),
  ingredientType: (t) =>
    t.ingredients.map((i) => i.type ?? "").filter((s) => s.length > 0),
};

const ingredientAccessor: Record<
  IngredientField,
  (i: PuddsIngredient) => string[]
> = {
  id: (i) => [i.id],
  name: (i) => [i.name],
  abbreviation: (i) => (i.abbreviation ? [i.abbreviation] : []),
  type: (i) => (i.type ? [i.type] : []),
  cost: (i) => (i.cost !== undefined ? [String(i.cost)] : []),
  solid: (i) => (i.solid !== undefined ? [String(i.solid)] : []),
};

function specHaystacks(s: IngredientSpecFlat, field: string): string[] {
  if (field === "id") return [s.id];
  const v = (s as unknown as Record<string, unknown>)[field];
  return typeof v === "string" && v.length > 0 ? [v] : [];
}

// ─────────────────────────────────────────────────────────────────────────────
// Generic engine
// ─────────────────────────────────────────────────────────────────────────────

function applyFilter<T>(
  rows: T[],
  filter: TableFilter | undefined,
  getHaystacks: (row: T, field: string) => string[],
): T[] {
  const entries = filter?.fieldContains;
  if (!entries?.length) return rows;
  return rows.filter((row) => {
    for (const { field, values } of entries) {
      if (!values?.length) continue;
      const haystacks = getHaystacks(row, field);
      if (!haystacks.length) return false;
      const lowerHaystacks = haystacks.map((h) => h.toLowerCase());
      const lowerNeedles = values.map((v) => v.toLowerCase());
      const ok = lowerHaystacks.some((h) =>
        lowerNeedles.some((n) => h.includes(n)),
      );
      if (!ok) return false;
    }
    return true;
  });
}

export function filterTrials(
  rows: PuddsTrial[],
  filter?: TableFilter,
): PuddsTrial[] {
  return applyFilter(rows, filter, (row, field) => {
    const fn = trialAccessor[field as TrialField];
    return fn ? fn(row) : [];
  });
}

export function filterIngredients(
  rows: PuddsIngredient[],
  filter?: TableFilter,
): PuddsIngredient[] {
  return applyFilter(rows, filter, (row, field) => {
    const fn = ingredientAccessor[field as IngredientField];
    return fn ? fn(row) : [];
  });
}

export function filterSpecs(
  rows: IngredientSpecFlat[],
  filter?: TableFilter,
): IngredientSpecFlat[] {
  return applyFilter(rows, filter, specHaystacks);
}

// ─────────────────────────────────────────────────────────────────────────────
// Metric projection (column-select on trial evaluations). Not a row filter,
// but lives here because it's the only response-shaping op for trials.
// ─────────────────────────────────────────────────────────────────────────────

export function projectMetrics(
  trials: PuddsTrial[],
  metricKeys: SensoryMetricKey[],
): PuddsTrial[] {
  if (!metricKeys.length) return trials;
  const keep = new Set(metricKeys);
  return trials.map((t) => ({
    ...t,
    analysisLogs: t.analysisLogs.map((log): AnalysisLog => {
      const evaluations = log.evaluations.map(
        (ev): SensoryEvaluation => ({
          ...ev,
          metrics: pickKeys(ev.metrics, keep),
          comments: ev.comments ? pickKeys(ev.comments, keep) : undefined,
        }),
      );
      return {
        ...log,
        evaluations,
        averagedMetrics: log.averagedMetrics
          ? pickKeys(log.averagedMetrics, keep)
          : undefined,
      };
    }),
  }));
}

function pickKeys<T>(
  obj: Partial<Record<SensoryMetricKey, T>>,
  keep: Set<SensoryMetricKey>,
): Partial<Record<SensoryMetricKey, T>> {
  const out: Partial<Record<SensoryMetricKey, T>> = {};
  for (const [k, v] of Object.entries(obj)) {
    if (keep.has(k as SensoryMetricKey)) {
      out[k as SensoryMetricKey] = v as T;
    }
  }
  return out;
}
