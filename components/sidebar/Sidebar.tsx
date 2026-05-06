"use client";

import { Plus, MessageSquare, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { DataSourceStatus } from "./DataSourceStatus";
import { Logo } from "@/components/Logo";
import { startOfDay, differenceInDays } from "date-fns";
import type { Conversation } from "@/types/messages";
import type { SnapshotStatus } from "@/types/snapshots";

interface Props {
  conversations: Conversation[];
  activeId: string | null;
  onSelect: (id: string) => void;
  onNew: () => void;
  onDelete: (id: string) => void;
  onSignOut: () => void;
  snapshotStatus: SnapshotStatus | null;
  userName: string | null;
  userEmail: string | null;
}

export function Sidebar({
  conversations,
  activeId,
  onSelect,
  onNew,
  onSignOut,
  snapshotStatus,
  userName,
  userEmail,
}: Props) {
  const groups = groupByDate(conversations);

  return (
    <aside className="w-[260px] shrink-0 h-full flex flex-col bg-[#f7f7f8] border-r border-[#e8e8ea]">
      <div className="px-4 py-3.5 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Logo size={26} />
          <span className="text-[15px] font-semibold text-[#1a1a1a]">
            Boca AI
          </span>
        </div>
      </div>

      <div className="px-3 pb-2">
        <Button
          variant="outline"
          size="sm"
          onClick={onNew}
          className="w-full justify-start gap-2 text-[13px] border-[#e8e8ea] bg-white text-[#1a1a1a] hover:bg-[#fafafb]"
        >
          <Plus className="h-3.5 w-3.5" />
          New chat
        </Button>
      </div>

      <ScrollArea className="flex-1 px-2">
        {renderGroup("Today", groups.today, activeId, onSelect)}
        {renderGroup("Yesterday", groups.yesterday, activeId, onSelect)}
        {renderGroup("Earlier", groups.older, activeId, onSelect)}
        {conversations.length === 0 && (
          <p className="px-3 py-2 text-[12px] text-[#9a9a9e] italic">
            No conversations yet.
          </p>
        )}
      </ScrollArea>

      <Separator className="bg-[#e8e8ea]" />

      {snapshotStatus && <DataSourceStatus status={snapshotStatus} />}

      <Separator className="bg-[#e8e8ea]" />

      <div className="px-3 py-3 flex items-center gap-2.5">
        <div className="h-7 w-7 rounded-full bg-[#d8d8e6] flex items-center justify-center shrink-0">
          <span className="text-[10px] font-semibold text-[#3f3d8a]">
            {initials(userName, userEmail)}
          </span>
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-[12.5px] font-medium text-[#1a1a1a] truncate">
            {userName ?? "Signed in"}
          </p>
          <p className="text-[10.5px] text-[#9a9a9e] truncate">
            {userEmail ?? ""}
          </p>
        </div>
        <button
          onClick={onSignOut}
          className="text-[#6b6b70] hover:text-[#1a1a1a] p-1.5 rounded-md hover:bg-[#ebebf5]"
          aria-label="Sign out"
        >
          <LogOut className="h-3.5 w-3.5" />
        </button>
      </div>
    </aside>
  );
}

function renderGroup(
  label: string,
  items: Conversation[],
  activeId: string | null,
  onSelect: (id: string) => void,
) {
  if (items.length === 0) return null;
  return (
    <div className="mb-2">
      <p className="px-3 py-1 text-[10.5px] font-semibold text-[#9a9a9e] uppercase tracking-wider">
        {label}
      </p>
      {items.map((c) => (
        <button
          key={c.id}
          onClick={() => onSelect(c.id)}
          className={
            "w-full text-left px-3 py-1.5 rounded-lg text-[13px] flex items-center gap-2 transition-colors " +
            (activeId === c.id
              ? "bg-[#ebebf5] text-[#1a1a1a] border border-[#dcdce8]"
              : "text-[#1a1a1a] hover:bg-white border border-transparent")
          }
        >
          <MessageSquare className="h-3.5 w-3.5 shrink-0 text-[#9a9a9e]" />
          <span className="truncate">{c.title}</span>
        </button>
      ))}
    </div>
  );
}

function groupByDate(convs: Conversation[]): {
  today: Conversation[];
  yesterday: Conversation[];
  older: Conversation[];
} {
  const today: Conversation[] = [];
  const yesterday: Conversation[] = [];
  const older: Conversation[] = [];
  const todayStart = startOfDay(new Date());
  for (const c of convs) {
    const diff = differenceInDays(todayStart, startOfDay(new Date(c.updatedAt)));
    if (diff <= 0) today.push(c);
    else if (diff === 1) yesterday.push(c);
    else older.push(c);
  }
  return { today, yesterday, older };
}

function initials(name: string | null, email: string | null): string {
  if (name) {
    return name
      .split(/\s+/)
      .map((p) => p[0]?.toUpperCase() ?? "")
      .join("")
      .slice(0, 2);
  }
  if (email) return email.slice(0, 2).toUpperCase();
  return "··";
}
