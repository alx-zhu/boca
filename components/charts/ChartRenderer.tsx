"use client";

import {
  BarChart,
  Bar,
  Cell,
  LineChart,
  Line,
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import type { ChartSpec } from "@/types/charts";
import { COLORS, SERIES_COLORS } from "@/lib/colors";

const AXIS_STYLE = { fontSize: 11, fill: COLORS.muted };

interface Props {
  spec: ChartSpec;
}

export function ChartRenderer({ spec }: Props) {
  const {
    type,
    data,
    xKey,
    yKey,
    series,
    xLabel,
    yLabel,
    legend,
    yDomain,
    correlation,
    emphasizeMax,
  } = spec;

  const margin = { top: 8, right: 16, left: 8, bottom: xLabel ? 24 : 8 };

  const xAxis = (
    <XAxis
      dataKey={xKey}
      tick={AXIS_STYLE}
      axisLine={false}
      tickLine={false}
      label={
        xLabel
          ? {
              value: xLabel,
              position: "insideBottom",
              offset: -12,
              style: { fontSize: 11, fill: COLORS.dim },
            }
          : undefined
      }
    />
  );

  const yAxis = (
    <YAxis
      tick={AXIS_STYLE}
      axisLine={false}
      tickLine={false}
      domain={yDomain ?? ["auto", "auto"]}
      label={
        yLabel
          ? {
              value: yLabel,
              angle: -90,
              position: "insideLeft",
              style: { fontSize: 11, fill: COLORS.dim },
            }
          : undefined
      }
    />
  );

  const tooltip = (
    <Tooltip
      contentStyle={{
        fontSize: 12,
        borderRadius: 8,
        border: `1px solid ${COLORS.border}`,
      }}
      cursor={{ fill: "#F9FAFB" }}
    />
  );

  if (type === "bar") {
    const max = Math.max(...data.map((d) => Number(d[yKey])));
    return (
      <ResponsiveContainer width="100%" height={240}>
        <BarChart data={data} margin={margin}>
          <CartesianGrid
            strokeDasharray="3 3"
            stroke={COLORS.grid}
            vertical={false}
          />
          {xAxis}
          {yAxis}
          {tooltip}
          {legend && <Legend wrapperStyle={{ fontSize: 12 }} />}
          <Bar dataKey={yKey} radius={[4, 4, 0, 0]} maxBarSize={48}>
            {data.map((d, i) => (
              <Cell
                key={i}
                fill={
                  emphasizeMax && Number(d[yKey]) !== max
                    ? COLORS.primaryMuted
                    : COLORS.primary
                }
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    );
  }

  if (type === "line") {
    const seriesList =
      series && series.length > 0
        ? series
        : [{ key: yKey, label: yKey, color: COLORS.primary }];
    return (
      <ResponsiveContainer width="100%" height={240}>
        <LineChart data={data} margin={margin}>
          <CartesianGrid
            strokeDasharray="3 3"
            stroke={COLORS.grid}
            vertical={false}
          />
          {xAxis}
          {yAxis}
          {tooltip}
          {legend && <Legend wrapperStyle={{ fontSize: 12 }} />}
          {seriesList.map((s, i) => (
            <Line
              key={s.key}
              type="monotone"
              dataKey={s.key}
              name={s.label}
              stroke={s.color ?? SERIES_COLORS[i % SERIES_COLORS.length]}
              strokeWidth={2}
              dot={{ r: 3 }}
              activeDot={{ r: 5 }}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    );
  }

  if (type === "scatter") {
    // Scatter axes must be numeric and bind to the data keys directly —
    // unlike bar/line where the axis just labels each row, scatter plots
    // x and y as continuous coordinates. Without type="number" + dataKey,
    // Recharts treats x as categorical and renders no points.
    return (
      <ResponsiveContainer width="100%" height={240}>
        <ScatterChart margin={margin}>
          <CartesianGrid strokeDasharray="3 3" stroke={COLORS.grid} />
          <XAxis
            dataKey={xKey}
            type="number"
            domain={["auto", "auto"]}
            tick={AXIS_STYLE}
            axisLine={false}
            tickLine={false}
            label={
              xLabel
                ? {
                    value: xLabel,
                    position: "insideBottom",
                    offset: -12,
                    style: { fontSize: 11, fill: COLORS.dim },
                  }
                : undefined
            }
          />
          <YAxis
            dataKey={yKey}
            type="number"
            domain={yDomain ?? ["auto", "auto"]}
            tick={AXIS_STYLE}
            axisLine={false}
            tickLine={false}
            label={
              yLabel
                ? {
                    value: yLabel,
                    angle: -90,
                    position: "insideLeft",
                    style: { fontSize: 11, fill: COLORS.dim },
                  }
                : undefined
            }
          />
          {tooltip}
          {legend && <Legend wrapperStyle={{ fontSize: 12 }} />}
          <Scatter data={data} fill={COLORS.primary} opacity={0.75} />
          {correlation !== undefined && (
            <text
              x="95%"
              y="10%"
              textAnchor="end"
              fill={COLORS.muted}
              fontSize={11}
            >
              r = {correlation.toFixed(2)}
            </text>
          )}
        </ScatterChart>
      </ResponsiveContainer>
    );
  }

  return null;
}
