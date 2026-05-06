export type ChartType = "bar" | "line" | "scatter";

export interface ChartSeries {
  key: string;
  label: string;
  color?: string;
}

export interface ChartSpec {
  type: ChartType;
  title: string;
  subtitle?: string;
  data: Record<string, unknown>[];
  xKey: string;
  yKey: string;
  /** For multi-series line charts. When set, each series.key is a separate line. */
  series?: ChartSeries[];
  xLabel?: string;
  yLabel?: string;
  legend?: boolean;
  /** Pearson r — shown as "r = 0.87" on scatter plots. */
  correlation?: number;
  /** [min, max] — use [0, 5] for sensory score charts. */
  yDomain?: [number, number];
  /** For bar charts: highlight the max bar in primary color, others muted. */
  emphasizeMax?: boolean;
}
