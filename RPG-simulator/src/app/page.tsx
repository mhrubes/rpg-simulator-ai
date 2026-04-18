"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useGameStore } from "@/stores/gameStore";

export default function Home() {
  const router = useRouter();
  const ready = useGameStore((s) => s.ready);
  const game = useGameStore((s) => s.game);

  useEffect(() => {
    if (!ready) return;
    if (game) router.replace("/tavern");
    else router.replace("/login");
  }, [ready, game, router]);

  return (
    <div className="flex min-h-screen items-center justify-center text-base text-vb-muted">Vaultborne…</div>
  );
}
