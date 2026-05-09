import { createClient } from "@/lib/supabase/server";

export interface RawSnapshots {
  pudds: {
    trials: string;
    ingredients: string;
    trialIngredients: string;
    createdAt: string | null;
  };
  extractor: {
    documents: string;
    specs: string;
    createdAt: string | null;
  } | null;
}

/**
 * Reads the latest snapshot row from each source table.
 * - `snapshots` is published by pudds-notes-platform.
 * - `extractor-snapshots` is published by cpg-product-extractor.
 * Both are read-only from boca's perspective.
 */
export async function fetchSnapshots(
  includeIngredientSpecs: boolean,
): Promise<RawSnapshots> {
  const supabase = await createClient();

  const [puddsRes, extractorRes] = await Promise.all([
    supabase
      .from("snapshots")
      .select("data, created_at")
      .order("created_at", { ascending: false })
      .limit(1)
      .single(),
    includeIngredientSpecs
      ? supabase
          .from("extractor-snapshots")
          .select("data, created_at")
          .order("created_at", { ascending: false })
          .limit(1)
          .single()
      : Promise.resolve({ data: null, error: null } as const),
  ]);

  if (puddsRes.error || !puddsRes.data) {
    throw new Error(
      "No pudds snapshot found. Publish a snapshot from Pudds Notes first.",
    );
  }

  const puddsData = puddsRes.data.data as {
    trials?: string;
    ingredients?: string;
    trialIngredients?: string;
  };

  const extractorData = extractorRes.data?.data as
    | { documents?: string; specs?: string }
    | undefined;

  return {
    pudds: {
      trials: puddsData.trials ?? "[]",
      ingredients: puddsData.ingredients ?? "[]",
      trialIngredients: puddsData.trialIngredients ?? "[]",
      createdAt: puddsRes.data.created_at,
    },
    extractor: extractorData
      ? {
          documents: extractorData.documents ?? "[]",
          specs: extractorData.specs ?? "[]",
          createdAt: extractorRes.data?.created_at ?? null,
        }
      : null,
  };
}
