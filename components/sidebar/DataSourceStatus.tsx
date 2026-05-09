"use client";

import { formatDistanceToNow } from "date-fns";
import type { SnapshotStatus } from "@/types/snapshots";

interface Props {
  status: SnapshotStatus;
  lastRefreshed: { pudds: string | null; extractor: string | null };
}

export function DataSourceStatus({ status, lastRefreshed }: Props) {
  return (
    <div className="px-4 py-3">
      <p className="text-[10.5px] font-semibold text-[#9a9a9e] uppercase tracking-wider mb-2">
        Data sources
      </p>
      <div className="flex flex-col gap-2">
        <SourceRow
          label="Pudds Notes"
          syncedAt={status.pudds.syncedAt}
          lastRefreshed={lastRefreshed.pudds}
          count={status.pudds.trialCount}
          unit="trials"
        />
        <SourceRow
          label="Ingredient DB"
          syncedAt={status.extractor.syncedAt}
          lastRefreshed={lastRefreshed.extractor}
          count={status.extractor.specCount}
          unit="ingredients"
        />
      </div>
    </div>
  );
}

interface RowProps {
  label: string;
  syncedAt: string | null;
  lastRefreshed: string | null;
  count: number;
  unit: string;
}

function SourceRow({ label, syncedAt, lastRefreshed, count, unit }: RowProps) {
  const isMissing = !syncedAt;
  const isStale =
    !isMissing &&
    (lastRefreshed === null ||
      new Date(syncedAt!) > new Date(lastRefreshed));

  const dotColor = isMissing
    ? "#dc2626"
    : isStale
      ? "#e09b3f"
      : "#3aa55c";

  const subtext = isMissing
    ? "Not synced"
    : isStale
      ? "New version available"
      : `Synced ${formatDistanceToNow(new Date(lastRefreshed!))} ago · ${count} ${unit}`;

  return (
    <div className="flex items-start gap-2">
      <span
        className="h-[7px] w-[7px] rounded-full shrink-0 mt-1"
        style={{ background: dotColor }}
      />
      <div className="min-w-0 flex-1">
        <p className="text-[12.5px] font-medium text-[#1a1a1a] leading-tight">
          {label}
        </p>
        <p
          className="text-[11px] mt-0.5 leading-tight"
          style={{ color: isStale || isMissing ? "#b8761c" : "#6b6b70" }}
        >
          {subtext}
        </p>
      </div>
    </div>
  );
}
