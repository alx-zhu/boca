import { fetchSnapshots } from "./fetchSnapshots";
import { prepareContext } from "./prepareContext";
import type { DataFilters } from "./filters";
import type {
  PreparedContext,
  IngredientSpecField,
} from "@/types/sources";

export interface DataFetcherInput {
  include_ingredient_specs?: boolean;
  filters?: DataFilters;
  spec_fields?: IngredientSpecField[];
}

export async function runDataFetcher(
  input: DataFetcherInput,
): Promise<PreparedContext> {
  const raw = await fetchSnapshots(input.include_ingredient_specs ?? false);
  return prepareContext(raw, {
    filters: input.filters,
    specFields: input.spec_fields,
  });
}

export type { DataFilters };
