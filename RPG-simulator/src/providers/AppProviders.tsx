"use client";

import { useEffect } from "react";
import { I18nProvider } from "./I18nProvider";
import { useGameStore } from "@/stores/gameStore";
import { VaultborneToaster } from "@/components/ui/VaultborneToaster";

function GameBootstrap() {
  const boot = useGameStore((s) => s.boot);
  const syncClock = useGameStore((s) => s.syncClock);

  useEffect(() => {
    boot();
  }, [boot]);

  useEffect(() => {
    const id = window.setInterval(() => syncClock(), 2000);
    return () => window.clearInterval(id);
  }, [syncClock]);

  return null;
}

export function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <I18nProvider>
      <GameBootstrap />
      <VaultborneToaster />
      {children}
    </I18nProvider>
  );
}
