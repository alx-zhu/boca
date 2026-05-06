import type Anthropic from "@anthropic-ai/sdk";

export const TOOLS: Anthropic.Tool[] = [
  {
    name: "fetch_data",
    description: `Fetches trial and ingredient data from the user's most recent snapshots.

Always call this tool before answering any analytical question. Do not answer from memory — all answers must come from this tool's output.

Use \`filters\` to narrow the dataset before it reaches you. Filtering server-side keeps token usage low and keeps you focused.

The returned context contains:
- trials: formulation trials with setup, ingredients (flat list with name + %), and analysisLogs (each with computedScores already calculated)
- masterIngredients: full ingredient library
- ingredientSpecs: supplier spec sheet data (only when include_ingredient_specs is true)
- meta: counts, sync timestamps, and which filters were applied`,
    input_schema: {
      type: "object" as const,
      properties: {
        include_ingredient_specs: {
          type: "boolean",
          description:
            "Set true ONLY when the question involves supplier spec sheet data (CAS numbers, allergens, technical properties, supplier names). Otherwise leave false.",
        },
        filters: {
          type: "object",
          description: "Server-side filters applied to trials before they reach you.",
          properties: {
            flavor: {
              type: "string",
              enum: ["chocolate", "vanilla"],
              description: "Only include trials with this flavor.",
            },
            processingType: {
              type: "string",
              enum: ["shelftop", "industrial"],
              description:
                "Only include trials with this processing type. Note: 'shelftop' is the internal name for benchtop trials.",
            },
            trialNumbers: {
              type: "array",
              items: { type: "number" },
              description: "Only include trials with these specific trial numbers.",
            },
            ingredientNames: {
              type: "array",
              items: { type: "string" },
              description:
                "Only include trials that contain at least one ingredient whose name matches (case-insensitive substring) one of these strings. E.g. ['xanthan'] matches 'Xanthan Gum'.",
            },
            metricKeys: {
              type: "array",
              items: {
                type: "string",
                enum: [
                  "tasteRating",
                  "sweetnessIntensity",
                  "sweetnessRating",
                  "flavorIntensity",
                  "aftertasteIntensity",
                  "thicknessIntensity",
                  "textureIntensity",
                  "textureRating",
                  "colorRating",
                ],
              },
              description:
                "Project evaluations down to only these metric keys. Use this to reduce payload size when the question only needs specific metrics.",
            },
            dateFrom: {
              type: "string",
              description: "ISO date. Only include trials on or after this date.",
            },
            dateTo: {
              type: "string",
              description: "ISO date. Only include trials on or before this date.",
            },
          },
        },
        spec_fields: {
          type: "array",
          items: { type: "string" },
          description:
            "When include_ingredient_specs is true, only return these spec fields. Defaults to a sensible subset (product_name, supplier, ingredient_function, typical_use_level, allergens, ph, shelf_life_months, description). Use this if you need fields outside the default subset.",
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
