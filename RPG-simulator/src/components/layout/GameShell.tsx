"use client";

import { GameSidebar } from "./GameSidebar";

export function GameShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-0 flex-1">
      <GameSidebar />
      <main className="min-h-0 flex-1 overflow-y-auto p-6 md:p-8">{children}</main>
    </div>
  );
}
