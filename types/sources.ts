/**
 * Read-only contracts describing the snapshot data we consume from
 * pudds-notes-platform (table: snapshots) and cpg-product-extractor
 * (table: extractor-snapshots). We do not import from those repos —
 * these types mirror their shapes independently. If those publish
 * formats drift, this file must be updated.
 */

export type SensoryMetricKey =
  | "tasteRating"
  | "sweetnessIntensity"
  | "sweetnessRating"
  | "flavorIntensity"
  | "aftertasteIntensity"
  | "thicknessIntensity"
  | "textureIntensity"
  | "textureRating"
  | "colorRating";

export type ProcessingType = "shelftop" | "industrial";
export type Flavor = "chocolate" | "vanilla";

export type PartialSensoryMetrics = Partial<Record<SensoryMetricKey, number>>;

export interface SensoryEvaluation {
  id: string;
  label: string;
  metrics: PartialSensoryMetrics;
  comments?: Partial<Record<SensoryMetricKey, string>>;
  createdAt: string;
}

/** Pudds enriches each log with these before publishing. */
export interface SensoryScores {
  taste: number | null;
  texture: number | null;
  color: number | null;
  overall: number | null;
}

export interface AnalysisLog {
  id: string;
  thermalProcessingType: string;
  storageTimeMinutes: number;
  evaluations: SensoryEvaluation[];
  computedScores?: SensoryScores;
  averagedMetrics?: PartialSensoryMetrics;
  createdAt: string;
}

/** Flattened ingredient on a trial — easier for the model than the nested form. */
export interface TrialIngredientFlat {
  ingredientId: string;
  name: string;
  percentage: number;
  cost?: number;
  type?: string;
}

export interface PuddsTrial {
  id: string;
  trialNumber: number;
  name?: string;
  setup?: {
    date: string;
    processingType: ProcessingType;
    flavor: Flavor;
  };
  ingredients: TrialIngredientFlat[];
  analysisLogs: AnalysisLog[];
  mostRecentScores?: SensoryScores | null;
  costPerServing?: number | null;
  createdAt: string;
  updatedAt: string;
}

export interface PuddsIngredient {
  id: string;
  name: string;
  abbreviation?: string;
  type?: string;
  cost?: number;
  solid?: boolean;
}

/** Flat projection of an ExtractedIngredientSpec (Reducto wrappers stripped). */
export interface IngredientSpecFlat {
  id: string;
  product_name?: string;
  supplier?: string;
  ingredient_function?: string;
  e_number?: string;
  cas_number?: string;
  country_of_origin?: string;
  spec_date?: string;
  typical_use_level?: string;
  typical_applications?: string;
  description?: string;
  features_benefits?: string;
  directions_for_use?: string;
  moisture_pct?: string;
  ph?: string;
  viscosity?: string;
  protein_pct?: string;
  particle_size?: string;
  appearance_color?: string;
  allergens?: string;
  kosher?: string;
  halal?: string;
  non_gmo?: string;
  regulatory_status?: string;
  shelf_life_months?: string;
  storage_conditions?: string;
  packaging_size?: string;
}

export type IngredientSpecField = Exclude<keyof IngredientSpecFlat, "id">;

export const DEFAULT_SPEC_FIELDS: IngredientSpecField[] = [
  "product_name",
  "supplier",
  "ingredient_function",
  "typical_use_level",
  "allergens",
  "ph",
  "shelf_life_months",
  "description",
];

export interface PreparedContext {
  trials: PuddsTrial[];
  masterIngredients: PuddsIngredient[];
  ingredientSpecs: IngredientSpecFlat[];
  meta: {
    trialCount: number;
    ingredientCount: number;
    specCount: number;
    puddsSyncedAt: string | null;
    extractorSyncedAt: string | null;
    appliedFilters?: Record<string, unknown>;
  };
}
