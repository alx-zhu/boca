"use client";

import { Sparkles, AlertCircle } from "lucide-react";
import { Logo } from "@/components/Logo";

const SUGGESTED_PROMPTS = [
  "Which ingredient correlates with the highest texture scores?",
  "Show me taste and texture trends across storage time",
  "Compare cost per gram vs sensory performance",
  "What does my best performing trial have in common with my worst?",
];

interface Props {
  onSelectPrompt: (prompt: string) => void;
  isStale: boolean;
  onSync: () => void;
  syncing: boolean;
}

export function WelcomeScreen({
  onSelectPrompt,
  isStale,
  onSync,
  syncing,
}: Props) {
  return (
    <div className="flex-1 flex flex-col items-center justify-center px-6 py-12">
      <div className="max-w-[600px] w-full">
        {isStale && (
          <div className="mb-8 flex items-center justify-between gap-3 text-[13px] text-[#b8761c] bg-[#fdf3e0] rounded-xl px-4 py-3">
            <div className="flex items-center gap-2">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>
                New snapshot available. Results may not reflect recent changes.
              </span>
            </div>
            <button
              onClick={onSync}
              disabled={syncing}
              className="font-medium underline underline-offset-2 hover:text-[#9c6418] shrink-0"
            >
              {syncing ? "Refreshing…" : "Sync now"}
            </button>
          </div>
        )}

        <div className="text-center mb-8">
          <div className="flex justify-center mb-5">
            <Logo size={36} />
          </div>
          <h1 className="text-[26px] font-semibold tracking-[-0.4px] text-[#1a1a1a] mb-2">
            What can I help you analyze?
          </h1>
          <p className="text-[14px] text-[#6b6b70]">
            Ask about your trials, ingredients, or formulations. I&apos;ll fetch
            data and build charts.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          {SUGGESTED_PROMPTS.map((prompt) => (
            <button
              key={prompt}
              onClick={() => onSelectPrompt(prompt)}
              className="text-left text-[13px] text-[#1a1a1a] bg-white border border-[#e8e8ea] rounded-[10px] px-4 py-3 hover:border-[#d8d8db] hover:bg-[#fafafb] transition-colors flex items-start gap-2.5"
            >
              <Sparkles className="h-3.5 w-3.5 mt-0.5 text-[#3f3d8a] shrink-0" />
              <span className="leading-[1.4]">{prompt}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
