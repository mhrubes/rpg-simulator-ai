"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { GameShell } from "@/components/layout/GameShell";
import { useGameStore } from "@/stores/gameStore";

export default function GameLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const ready = useGameStore((s) => s.ready);
  const game = useGameStore((s) => s.game);

  useEffect(() => {
    if (!ready) return;
    if (!game) router.replace("/login");
  }, [ready, game, router]);

  if (!ready || !game) {
    return (
      <div className="flex min-h-screen items-center justify-center text-base text-vb-muted">…</div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col">
      <GameShell>{children}</GameShell>
    </div>
  );
}
