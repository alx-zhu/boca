import type { RawSnapshots } from "./fetchSnapshots";
import type {
  PreparedContext,
  PuddsTrial,
  PuddsIngredient,
  IngredientSpecFlat,
  IngredientSpecField,
  TrialIngredientFlat,
  AnalysisLog,
} from "@/types/sources";
import { DEFAULT_SPEC_FIELDS } from "@/types/sources";
import { filterTrials, projectMetrics, type DataFilters } from "./filters";

/** Pudds publishes EnrichedTrial — its ingredients are resolved (nested form). */
interface RawEnrichedTrial {
  id: string;
  trialNumber: number;
  name?: string;
  setup?: PuddsTrial["setup"];
  ingredients?: Array<{
    ingredient: { id: string; name: string; cost?: number; type?: string };
    percentage: number;
    pinned?: boolean;
  }>;
  analysisLogs?: Array<AnalysisLog & { photos?: string[] }>;
  mostRecentScores?: PuddsTrial["mostRecentScores"];
  costPerServing?: PuddsTrial["costPerServing"];
  createdAt: string;
  updatedAt: string;
}

/** Reducto wraps every spec field with citations + confidence — we want just the value. */
interface ReductoField {
  value?: unknown;
}

interface RawSpec {
  id: string;
  [key: string]: unknown;
}

export interface PrepareOptions {
  filters?: DataFilters;
  specFields?: IngredientSpecField[];
}

export function prepareContext(
  raw: RawSnapshots,
  options: PrepareOptions = {},
): PreparedContext {
  const rawTrials = safeJson<RawEnrichedTrial[]>(raw.pudds.trials, []);
  const masterIngredients = safeJson<PuddsIngredient[]>(
    raw.pudds.ingredients,
    [],
  );

  let trials: PuddsTrial[] = rawTrials.map(flattenTrial);

  const filters = options.filters ?? {};
  trials = filterTrials(trials, filters);
  if (filters.metricKeys?.length) {
    trials = projectMetrics(trials, filters.metricKeys);
  }

  const rawSpecs = raw.extractor
    ? safeJson<RawSpec[]>(raw.extractor.specs, [])
    : [];
  const fields = options.specFields?.length
    ? options.specFields
    : DEFAULT_SPEC_FIELDS;
  const ingredientSpecs: IngredientSpecFlat[] = rawSpecs.map((s) =>
    flattenSpec(s, fields),
  );

  return {
    trials,
    masterIngredients,
    ingredientSpecs,
    meta: {
      trialCount: trials.length,
      ingredientCount: masterIngredients.length,
      specCount: ingredientSpecs.length,
      puddsSyncedAt: raw.pudds.createdAt,
      extractorSyncedAt: raw.extractor?.createdAt ?? null,
      appliedFilters:
        Object.keys(filters).length > 0
          ? (filters as Record<string, unknown>)
          : undefined,
    },
  };
}

function flattenTrial(t: RawEnrichedTrial): PuddsTrial {
  const ingredients: TrialIngredientFlat[] = (t.ingredients ?? []).map((ti) => ({
    ingredientId: ti.ingredient.id,
    name: ti.ingredient.name,
    percentage: ti.percentage,
    cost: ti.ingredient.cost,
    type: ti.ingredient.type,
  }));

  // Strip photos — they bloat context massively (base64) and the model
  // can't see them anyway.
  const analysisLogs = (t.analysisLogs ?? []).map(
    ({ photos: _photos, ...rest }): AnalysisLog => rest,
  );

  return {
    id: t.id,
    trialNumber: t.trialNumber,
    name: t.name,
    setup: t.setup,
    ingredients,
    analysisLogs,
    mostRecentScores: t.mostRecentScores,
    costPerServing: t.costPerServing,
    createdAt: t.createdAt,
    updatedAt: t.updatedAt,
  };
}

function flattenSpec(
  s: RawSpec,
  fields: IngredientSpecField[],
): IngredientSpecFlat {
  const out: IngredientSpecFlat = { id: s.id };
  for (const field of fields) {
    const raw = s[field];
    const value = isReducto(raw) ? raw.value : raw;
    if (typeof value === "string" && value.length > 0) {
      out[field] = value;
    }
  }
  return out;
}

function isReducto(v: unknown): v is ReductoField {
  return typeof v === "object" && v !== null && "value" in v;
}

function safeJson<T>(raw: string, fallback: T): T {
  try {
    const parsed = JSON.parse(raw);
    return parsed ?? fallback;
  } catch {
    return fallback;
  }
}
