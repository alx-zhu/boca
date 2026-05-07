"use client";

import { useRef, useState } from "react";
import { Download, Braces, Copy, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ChartRenderer } from "./ChartRenderer";
import type { ChartSpec } from "@/types/charts";

interface Props {
  spec: ChartSpec;
}

export function ChartCard({ spec }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const [showJson, setShowJson] = useState(false);
  const [copied, setCopied] = useState(false);

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

  const json = JSON.stringify(spec, null, 2);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(json);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // Clipboard API unavailable — silent failure for prototype.
    }
  };

  return (
    <div
      ref={ref}
      className="rounded-[10px] border border-[#e8e8ea] bg-white p-4 my-2 shadow-[0_1px_2px_rgba(20,20,30,0.04)]"
    >
      <div className="flex items-start justify-between mb-2 gap-3">
        <div className="min-w-0">
          <p className="text-[13px] font-semibold text-[#1a1a1a]">
            {spec.title}
          </p>
          {spec.subtitle && (
            <p className="text-[11px] text-[#9a9a9e] mt-0.5">{spec.subtitle}</p>
          )}
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowJson((v) => !v)}
            aria-pressed={showJson}
            className={
              "h-7 px-2 text-[11px] gap-1.5 border " +
              (showJson
                ? "bg-[#ebebf5] text-[#3f3d8a] border-[#dcdce8]"
                : "text-[#6b6b70] hover:text-[#1a1a1a] border-[#e8e8ea]")
            }
          >
            <Braces className="h-3 w-3" />
            Data
          </Button>
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
      </div>

      <ChartRenderer spec={spec} />

      {showJson && (
        <div className="mt-3 border-t border-[#e8e8ea] pt-3">
          <div className="flex items-center justify-between mb-2">
            <p className="text-[11px] font-semibold text-[#9a9a9e] uppercase tracking-wider">
              Chart spec
            </p>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleCopy}
              className="h-6 px-2 text-[11px] text-[#6b6b70] hover:text-[#1a1a1a] gap-1.5"
            >
              {copied ? (
                <Check className="h-3 w-3 text-[#3aa55c]" />
              ) : (
                <Copy className="h-3 w-3" />
              )}
              {copied ? "Copied" : "Copy"}
            </Button>
          </div>
          <pre className="text-[11.5px] font-mono leading-[1.5] text-[#1a1a1a] bg-[#f7f7f8] border border-[#e8e8ea] rounded-md p-3 overflow-auto max-h-[320px]">
            {json}
          </pre>
        </div>
      )}
    </div>
  );
}
