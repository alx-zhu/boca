import { fetchSnapshots } from "./fetchSnapshots";
import {
  filterTrials,
  filterIngredients,
  filterSpecs,
  projectMetrics,
  type TableFilter,
} from "./filters";
import type {
  PuddsTrial,
  PuddsIngredient,
  IngredientSpecFlat,
  IngredientSpecField,
  SensoryMetricKey,
  TrialIngredientFlat,
  AnalysisLog,
} from "@/types/sources";
import { DEFAULT_SPEC_FIELDS } from "@/types/sources";

// ─────────────────────────────────────────────────────────────────────────────
// Each query is one SQL-style read against one table. The agent makes
// separate calls when it needs data from multiple tables and joins by name
// in its head (e.g. spec.product_name ↔ trial.ingredient.name).
// ─────────────────────────────────────────────────────────────────────────────

export type FieldContains = TableFilter["fieldContains"];

export interface QueryTrialsInput {
  fieldContains?: FieldContains;
  metricKeys?: SensoryMetricKey[];
}

export interface QueryTrialsOutput {
  trials: PuddsTrial[];
  meta: { count: number; syncedAt: string | null };
}

export async function runQueryTrials(
  input: QueryTrialsInput,
): Promise<QueryTrialsOutput> {
  const raw = await fetchSnapshots(false);
  const rawTrials = safeJson<RawEnrichedTrial[]>(raw.pudds.trials, []);
  let trials = rawTrials.map(flattenTrial);
  trials = filterTrials(trials, { fieldContains: input.fieldContains });
  if (input.metricKeys?.length) {
    trials = projectMetrics(trials, input.metricKeys);
  }
  return {
    trials,
    meta: { count: trials.length, syncedAt: raw.pudds.createdAt },
  };
}

export interface QueryIngredientsInput {
  fieldContains?: FieldContains;
}

export interface QueryIngredientsOutput {
  ingredients: PuddsIngredient[];
  meta: { count: number; syncedAt: string | null };
}

export async function runQueryIngredients(
  input: QueryIngredientsInput,
): Promise<QueryIngredientsOutput> {
  const raw = await fetchSnapshots(false);
  const rawIngredients = safeJson<PuddsIngredient[]>(
    raw.pudds.ingredients,
    [],
  );
  const ingredients = filterIngredients(rawIngredients, {
    fieldContains: input.fieldContains,
  });
  return {
    ingredients,
    meta: { count: ingredients.length, syncedAt: raw.pudds.createdAt },
  };
}

export interface QuerySpecsInput {
  fieldContains?: FieldContains;
  /** Project each returned spec to only these fields. Defaults to a sensible subset. */
  fields?: IngredientSpecField[];
}

export interface QuerySpecsOutput {
  specs: IngredientSpecFlat[];
  meta: { count: number; syncedAt: string | null };
}

export async function runQuerySpecs(
  input: QuerySpecsInput,
): Promise<QuerySpecsOutput> {
  const raw = await fetchSnapshots(true);
  if (!raw.extractor) {
    return { specs: [], meta: { count: 0, syncedAt: null } };
  }
  const rawSpecs = safeJson<RawSpec[]>(raw.extractor.specs, []);
  // Flatten with all fields so filtering can hit any column, then project
  // the survivors down to user-requested output fields.
  const fullyFlat = rawSpecs.map((s) => flattenSpec(s, ALL_SPEC_FIELDS));
  const filtered = filterSpecs(fullyFlat, {
    fieldContains: input.fieldContains,
  });
  const outputFields = input.fields?.length ? input.fields : DEFAULT_SPEC_FIELDS;
  const specs = filtered.map((s) => projectSpec(s, outputFields));
  return {
    specs,
    meta: { count: specs.length, syncedAt: raw.extractor.createdAt },
  };
}

export type { TableFilter };

// ─────────────────────────────────────────────────────────────────────────────
// Snapshot parsing helpers
// ─────────────────────────────────────────────────────────────────────────────

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

function flattenTrial(t: RawEnrichedTrial): PuddsTrial {
  const ingredients: TrialIngredientFlat[] = (t.ingredients ?? []).map((ti) => ({
    ingredientId: ti.ingredient.id,
    name: ti.ingredient.name,
    percentage: ti.percentage,
    cost: ti.ingredient.cost,
    type: ti.ingredient.type,
  }));

  // Strip photos — base64 bloat the model can't see anyway.
  const analysisLogs: AnalysisLog[] = (t.analysisLogs ?? []).map((log) => ({
    id: log.id,
    thermalProcessingType: log.thermalProcessingType,
    storageTimeMinutes: log.storageTimeMinutes,
    evaluations: log.evaluations,
    computedScores: log.computedScores,
    averagedMetrics: log.averagedMetrics,
    createdAt: log.createdAt,
  }));

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

function projectSpec(
  s: IngredientSpecFlat,
  fields: IngredientSpecField[],
): IngredientSpecFlat {
  const out: IngredientSpecFlat = { id: s.id };
  for (const field of fields) {
    const v = s[field];
    if (typeof v === "string" && v.length > 0) out[field] = v;
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

const ALL_SPEC_FIELDS: IngredientSpecField[] = [
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
];
