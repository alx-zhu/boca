"use client";

import { ChartCard } from "@/components/charts/ChartCard";
import { Logo } from "@/components/Logo";
import type { Message } from "@/types/messages";

interface Props {
  message: Message;
}

export function MessageBubble({ message }: Props) {
  if (message.role === "user") {
    return (
      <div className="flex justify-end mb-7">
        <div className="max-w-[78%] rounded-[14px] bg-[#f0f0f3] px-3.5 py-2.5 text-[14px] text-[#1a1a1a] leading-[1.5]">
          {message.content}
        </div>
      </div>
    );
  }

  return (
    <div className="mb-7">
      <div className="flex items-center gap-2 mb-1.5">
        <Logo size={22} />
        <span className="text-[12.5px] font-semibold text-[#1a1a1a]">
          Boca
        </span>
      </div>

      <div className="pl-[30px] flex flex-col gap-2">
        {message.status && (
          <div className="flex items-center gap-2 text-[13px] text-[#6b6b70]">
            <Spinner />
            <span>{message.status}</span>
          </div>
        )}

        {message.content && (
          <div className="text-[14px] text-[#1a1a1a] leading-[1.6] whitespace-pre-wrap">
            {message.content}
          </div>
        )}

        {message.charts && message.charts.length > 0 && (
          <div className="flex flex-col gap-1">
            {message.charts.map((chart, i) => (
              <ChartCard key={i} spec={chart} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function Spinner() {
  return (
    <span
      aria-hidden
      className="inline-block animate-spin"
      style={{
        width: 12,
        height: 12,
        borderRadius: "50%",
        border: "1.5px solid #e8e8ea",
        borderTopColor: "#3f3d8a",
      }}
    />
  );
}
