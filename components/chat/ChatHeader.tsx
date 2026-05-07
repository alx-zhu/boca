"use client";

import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Props {
  title: string;
  onExport: () => void;
  canExport: boolean;
}

export function ChatHeader({ title, onExport, canExport }: Props) {
  return (
    <header className="h-[52px] shrink-0 px-6 border-b border-[#e8e8ea] flex items-center justify-between">
      <h2 className="text-[14px] font-semibold text-[#1a1a1a] truncate">
        {title}
      </h2>
      <Button
        variant="outline"
        size="sm"
        onClick={onExport}
        disabled={!canExport}
        className="h-8 gap-1.5 text-[12px] border-[#e8e8ea] text-[#1a1a1a] print:hidden"
      >
        <Download className="h-3.5 w-3.5" />
        Export PDF
      </Button>
    </header>
  );
}
