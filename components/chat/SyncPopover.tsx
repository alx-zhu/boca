"use client";

import { RefreshCw } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { formatDistanceToNow } from "date-fns";
import type { SnapshotStatus } from "@/types/snapshots";

interface Props {
  status: SnapshotStatus | null;
  onSync: () => void;
  syncing: boolean;
}

export function SyncPopover({ status, onSync, syncing }: Props) {
  const trialCount = status?.pudds.trialCount ?? 0;
  const specCount = status?.extractor.specCount ?? 0;

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button className="text-[11.5px] text-[#6b6b70] hover:text-[#1a1a1a] transition-colors">
          Using <span className="border-b border-dashed border-[#d8d8db]">{trialCount} trials · {specCount} ingredients</span>
        </button>
      </PopoverTrigger>
      <PopoverContent
        className="w-80 p-4 border-[#e8e8ea]"
        align="start"
        side="top"
      >
        <p className="text-[12.5px] font-semibold text-[#1a1a1a] mb-3">
          Data in context
        </p>

        <div className="flex flex-col gap-3">
          <Row
            label="Pudds snapshot"
            syncedAt={status?.pudds.syncedAt ?? null}
            count={trialCount}
            unit="trials"
          />
          <div className="border-t border-[#e8e8ea]" />
          <Row
            label="Ingredients snapshot"
            syncedAt={status?.extractor.syncedAt ?? null}
            count={specCount}
            unit="ingredient specs"
            sublabel="Scraped from supplier sheets"
          />
        </div>

        <div className="mt-4 flex justify-end">
          <Button
            variant="outline"
            size="sm"
            onClick={onSync}
            disabled={syncing}
            className="text-[11.5px] gap-1.5 border-[#e8e8ea] text-[#1a1a1a]"
          >
            <RefreshCw
              className={`h-3 w-3 ${syncing ? "animate-spin" : ""}`}
            />
            {syncing ? "Refreshing…" : "Refresh"}
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}

interface RowProps {
  label: string;
  sublabel?: string;
  syncedAt: string | null;
  count: number;
  unit: string;
}

function Row({ label, sublabel, syncedAt, count, unit }: RowProps) {
  const formatted = syncedAt
    ? formatDistanceToNow(new Date(syncedAt), { addSuffix: true })
    : "Never synced";
  return (
    <div>
      <p className="text-[13px] font-medium text-[#1a1a1a]">{label}</p>
      <p className="text-[11.5px] text-[#9a9a9e] mt-0.5">{formatted}</p>
      <p className="text-[11.5px] text-[#9a9a9e]">
        {count} {unit}
        {sublabel ? ` · ${sublabel.toLowerCase()}` : ""}
      </p>
    </div>
  );
}
