import type Anthropic from "@anthropic-ai/sdk";
import {
  TRIAL_FIELDS,
  INGREDIENT_FIELDS,
  SPEC_FIELDS,
} from "./queries/filters";

const METRIC_KEY_ENUM = [
  "tasteRating",
  "sweetnessIntensity",
  "sweetnessRating",
  "flavorIntensity",
  "aftertasteIntensity",
  "thicknessIntensity",
  "textureIntensity",
  "textureRating",
  "colorRating",
];

/** Same shape on every query tool — the only difference is which fields are valid. */
function fieldContainsSchema(fieldEnum: readonly string[]) {
  return {
    type: "array" as const,
    description:
      "Each entry constrains one field. AND across entries, OR within values. All matches are case-insensitive substring.",
    items: {
      type: "object" as const,
      properties: {
        field: { type: "string" as const, enum: [...fieldEnum] },
        values: {
          type: "array" as const,
          items: { type: "string" as const },
        },
      },
      required: ["field", "values"],
    },
  };
}

export const TOOLS: Anthropic.Tool[] = [
  {
    name: "query_trials",
    description: `Reads from the trials table (formulation trials from pudds-notes-platform).

Each trial has setup (date, processingType, flavor), ingredients (flat list with name + %), and analysisLogs with sensory evaluations + computedScores.

Filter via fieldContains. Available fields: ${TRIAL_FIELDS.join(", ")}.
- ingredientName matches against the names of any ingredient on the trial
- ingredientType matches against the Pudds-classified type (protein | water-base | texture | sweetener | flavor | other)
- date is the ISO setup date; substring match works for partial dates ("2026-05" matches all of May 2026)`,
    input_schema: {
      type: "object" as const,
      properties: {
        fieldContains: fieldContainsSchema(TRIAL_FIELDS),
        metricKeys: {
          type: "array",
          items: { type: "string", enum: METRIC_KEY_ENUM },
          description:
            "Project each evaluation down to only these metric keys. Doesn't drop trials. Use to keep payloads lean when only specific metrics matter.",
        },
      },
    },
  },
  {
    name: "query_ingredients",
    description: `Reads from the ingredients table (Pudds master ingredient library).

Each ingredient: id, name, abbreviation, type, cost, solid. Filter via fieldContains. Available fields: ${INGREDIENT_FIELDS.join(", ")}.

NOTE: 'type' is the Pudds-classified category (protein | water-base | texture | sweetener | flavor | other). For finer-grained "function" classification (stabilizer, emulsifier, etc.), query the specs table — that lives there.`,
    input_schema: {
      type: "object" as const,
      properties: {
        fieldContains: fieldContainsSchema(INGREDIENT_FIELDS),
      },
    },
  },
  {
    name: "query_specs",
    description: `Reads from the ingredient specs table (supplier spec sheets from cpg-product-extractor).

Each spec describes one supplier product: product_name, supplier, ingredient_function, allergens, CAS number, regulatory status, technical properties (pH, viscosity, etc.), and more.

Filter via fieldContains. Available fields: ${SPEC_FIELDS.join(", ")}.

KEY USE CASES:
- "all PROTEIN ingredients" / "stabilizers" / "emulsifiers" → fieldContains: [{ field: "ingredient_function", values: ["protein"] }]
- "ingredients from supplier X" → fieldContains: [{ field: "supplier", values: ["X"] }]
- "anything with soy allergen" → fieldContains: [{ field: "allergens", values: ["soy"] }]

To find which trials use these ingredients, take product_name values from the result and follow up with query_trials filtering by ingredientName.`,
    input_schema: {
      type: "object" as const,
      properties: {
        fieldContains: fieldContainsSchema(SPEC_FIELDS),
        fields: {
          type: "array",
          items: { type: "string", enum: [...SPEC_FIELDS] },
          description:
            "Project each returned spec to only these fields. Defaults to product_name, supplier, ingredient_function, typical_use_level, allergens, ph, shelf_life_months, description.",
        },
      },
    },
  },
  {
    name: "render_chart",
    description: `Renders a chart inline in the conversation. Call this when a visualization meaningfully helps answer the question.

Chart type guidance:
- bar: comparing a metric across discrete categories (ingredients, flavors, processing types, trials)
- line: showing a metric over continuous time (storage days, dates) — supports multiple series via the 'series' array
- scatter: correlation between two numeric variables (one point per trial)

You may call render_chart multiple times in one turn to render multiple charts.

The 'data' array must come from the trial data you fetched — never fabricate values.`,
    input_schema: {
      type: "object" as const,
      properties: {
        type: {
          type: "string",
          enum: ["bar", "line", "scatter"],
        },
        title: {
          type: "string",
          description: "Concise chart title. E.g. 'Texture Score by Hydrocolloid'.",
        },
        subtitle: {
          type: "string",
          description:
            "Optional subtitle below the title. E.g. 'Mean across 24 chocolate trials'.",
        },
        data: {
          type: "array",
          description:
            "Each object is one bar, one point, or one time step. All objects must share the same keys.",
          items: { type: "object" },
        },
        xKey: { type: "string", description: "Key for x-axis values." },
        yKey: { type: "string", description: "Key for primary y-axis values." },
        series: {
          type: "array",
          description:
            "For multi-series line charts. Each item is one line. When provided, xKey is the time axis and each series.key is a separate line.",
          items: {
            type: "object",
            properties: {
              key: { type: "string" },
              label: { type: "string" },
              color: { type: "string" },
            },
            required: ["key", "label"],
          },
        },
        xLabel: { type: "string", description: "Human-readable x-axis label." },
        yLabel: { type: "string", description: "Human-readable y-axis label." },
        legend: {
          type: "boolean",
          description: "Show legend. Always true when 'series' is used.",
        },
        correlation: {
          type: "number",
          description:
            "For scatter charts: Pearson r coefficient. Displayed as 'r = 0.87'.",
        },
        yDomain: {
          type: "array",
          description:
            "Optional [min, max] for y axis. Use [0, 5] for any sensory score chart.",
          items: { type: "number" },
        },
        emphasizeMax: {
          type: "boolean",
          description:
            "For bar charts: highlight the bar with the highest yKey value in primary color and mute the rest. Good for ranking visuals.",
        },
      },
      required: ["type", "title", "data", "xKey", "yKey"],
    },
  },
];
