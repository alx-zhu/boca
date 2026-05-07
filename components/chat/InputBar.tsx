"use client";

import { useRef, useState } from "react";
import { ArrowUp, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SyncPopover } from "./SyncPopover";
import type { SnapshotStatus } from "@/types/snapshots";

interface Props {
  onSend: (message: string) => void;
  isLoading: boolean;
  snapshotStatus: SnapshotStatus | null;
  onSync: () => void;
  syncing: boolean;
  isStale: boolean;
}

export function InputBar({
  onSend,
  isLoading,
  snapshotStatus,
  onSync,
  syncing,
  isStale,
}: Props) {
  const [value, setValue] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleSend = () => {
    const trimmed = value.trim();
    if (!trimmed || isLoading) return;
    onSend(trimmed);
    setValue("");
    if (textareaRef.current) textareaRef.current.style.height = "auto";
  };

  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleInput = () => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 200)}px`;
  };

  const canSend = value.trim().length > 0 && !isLoading;

  return (
    <div className="px-6 pb-5 pt-2 print:hidden">
      <div className="max-w-[760px] mx-auto">
        <div className="rounded-[14px] border border-[#d8d8db] bg-white shadow-[0_1px_2px_rgba(20,20,30,0.04)] focus-within:border-[#1a1a1a] transition-colors">
          <textarea
            ref={textareaRef}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={handleKey}
            onInput={handleInput}
            placeholder="Ask about your trials, ingredients, or formulations..."
            rows={1}
            disabled={isLoading}
            className="w-full resize-none rounded-[14px] px-4 pt-3 pb-1 text-[14px] text-[#1a1a1a] placeholder:text-[#9a9a9e] focus:outline-none bg-transparent"
          />
          <div className="flex items-center justify-between px-3 pb-2">
            <SyncPopover
              status={snapshotStatus}
              onSync={onSync}
              syncing={syncing}
            />
            <Button
              size="icon"
              onClick={handleSend}
              disabled={!canSend}
              className="h-8 w-8 rounded-lg disabled:opacity-100 disabled:bg-[#e8e8ea]"
              style={
                canSend ? { background: "#3f3d8a" } : undefined
              }
            >
              <ArrowUp className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {isStale && (
          <div className="mt-2 flex items-center justify-center gap-1.5 text-[11.5px] text-[#b8761c]">
            <AlertCircle className="h-3 w-3" />
            <span>Data may be outdated · Last synced 2+ days ago</span>
          </div>
        )}
      </div>
    </div>
  );
}
