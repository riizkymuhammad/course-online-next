"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function TryoutGenerationRefresh({ enabled }: { enabled: boolean }) {
  const router = useRouter();

  useEffect(() => {
    if (!enabled) return;

    const intervalId = window.setInterval(() => {
      router.refresh();
    }, 5000);

    return () => window.clearInterval(intervalId);
  }, [enabled, router]);

  return null;
}
