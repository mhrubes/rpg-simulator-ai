"use client";

import { Toaster } from "sonner";

export function VaultborneToaster() {
  return (
    <Toaster
      theme="dark"
      position="top-center"
      closeButton
      duration={4200}
      toastOptions={{
        classNames: {
          toast:
            "border border-amber-500/25! bg-[linear-gradient(180deg,var(--vb-panel2),var(--vb-panel))]! text-[var(--vb-text)]! shadow-[0_12px_40px_rgba(0,0,0,0.45)]!",
          title: "text-amber-100!",
          description: "text-[var(--vb-muted)]!",
          closeButton:
            "border border-vb-border! bg-black/40! text-amber-200/90! hover:bg-white/10!",
          error: "border-red-500/35!",
          success: "border-emerald-500/35!",
        },
      }}
    />
  );
}
