"use client";

import { useRef } from "react";
import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ChartRenderer } from "./ChartRenderer";
import type { ChartSpec } from "@/types/charts";

interface Props {
  spec: ChartSpec;
}

export function ChartCard({ spec }: Props) {
  const ref = useRef<HTMLDivElement>(null);

  const handleExport = () => {
    const svg = ref.current?.querySelector(".recharts-wrapper svg");
    if (!svg) return;
    const clone = svg.cloneNode(true) as SVGElement;
    clone.setAttribute("xmlns", "http://www.w3.org/2000/svg");
    const blob = new Blob([clone.outerHTML], { type: "image/svg+xml" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${spec.title.toLowerCase().replace(/\s+/g, "-")}.svg`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div
      ref={ref}
      className="rounded-[10px] border border-[#e8e8ea] bg-white p-4 my-2 shadow-[0_1px_2px_rgba(20,20,30,0.04)]"
    >
      <div className="flex items-start justify-between mb-2">
        <div>
          <p className="text-[13px] font-semibold text-[#1a1a1a]">
            {spec.title}
          </p>
          {spec.subtitle && (
            <p className="text-[11px] text-[#9a9a9e] mt-0.5">{spec.subtitle}</p>
          )}
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleExport}
          className="h-7 px-2 text-[11px] text-[#6b6b70] hover:text-[#1a1a1a] gap-1.5 border border-[#e8e8ea]"
        >
          <Download className="h-3 w-3" />
          Export
        </Button>
      </div>
      <ChartRenderer spec={spec} />
    </div>
  );
}
