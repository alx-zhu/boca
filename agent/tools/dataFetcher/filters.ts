import type {
  PuddsTrial,
  SensoryEvaluation,
  AnalysisLog,
  SensoryMetricKey,
} from "@/types/sources";

export interface DataFilters {
  flavor?: string;
  processingType?: string;
  trialNumbers?: number[];
  ingredientNames?: string[];
  metricKeys?: SensoryMetricKey[];
  dateFrom?: string;
  dateTo?: string;
}

export function filterTrials(
  trials: PuddsTrial[],
  filters: DataFilters,
): PuddsTrial[] {
  const ingredientNeedles = filters.ingredientNames?.map((n) =>
    n.toLowerCase(),
  );
  const dateFrom = filters.dateFrom ? new Date(filters.dateFrom).getTime() : null;
  const dateTo = filters.dateTo ? new Date(filters.dateTo).getTime() : null;

  return trials.filter((t) => {
    if (filters.flavor && t.setup?.flavor !== filters.flavor) return false;
    if (
      filters.processingType &&
      t.setup?.processingType !== filters.processingType
    )
      return false;
    if (filters.trialNumbers?.length && !filters.trialNumbers.includes(t.trialNumber))
      return false;

    if (ingredientNeedles?.length) {
      const names = t.ingredients.map((i) => i.name.toLowerCase());
      const hit = ingredientNeedles.some((needle) =>
        names.some((n) => n.includes(needle)),
      );
      if (!hit) return false;
    }

    if (dateFrom !== null || dateTo !== null) {
      const trialDate = t.setup?.date
        ? new Date(t.setup.date).getTime()
        : new Date(t.createdAt).getTime();
      if (dateFrom !== null && trialDate < dateFrom) return false;
      if (dateTo !== null && trialDate > dateTo) return false;
    }

    return true;
  });
}

/** Trim each evaluation's metrics down to just the requested keys. */
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
