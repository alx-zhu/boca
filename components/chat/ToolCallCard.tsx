"use client";

import { useState } from "react";
import { ChevronRight, Wrench } from "lucide-react";
import type { ToolCall } from "@/types/messages";

interface Props {
  call: ToolCall;
}

export function ToolCallCard({ call }: Props) {
  const [expanded, setExpanded] = useState(false);
  const inputJson = JSON.stringify(call.input, null, 2);

  return (
    <div className="rounded-md border border-[#e8e8ea] bg-[#f7f7f8] text-[12.5px] overflow-hidden">
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        className="w-full flex items-center gap-2 px-3 py-2 text-left hover:bg-[#f0f0f3] transition-colors"
        aria-expanded={expanded}
      >
        <ChevronRight
          className={
            "h-3 w-3 text-[#9a9a9e] transition-transform shrink-0 " +
            (expanded ? "rotate-90" : "")
          }
        />
        <Wrench className="h-3 w-3 text-[#6b6b70] shrink-0" />
        <span className="font-mono text-[#1a1a1a] shrink-0">{call.name}</span>
        {call.summary && (
          <span className="text-[#6b6b70] truncate">· {call.summary}</span>
        )}
      </button>
      {expanded && (
        <div className="border-t border-[#e8e8ea] bg-white">
          <p className="px-3 pt-2 text-[10.5px] font-semibold text-[#9a9a9e] uppercase tracking-wider">
            Input
          </p>
          <pre className="px-3 pb-3 pt-1 text-[11.5px] font-mono leading-[1.5] text-[#1a1a1a] overflow-auto max-h-[280px]">
            {inputJson}
          </pre>
        </div>
      )}
    </div>
  );
}
