"use client";

import { BarButton } from "@/components/ui/bar-button";
import { MasterLine } from "@/components/entrance/master-line";
import { Reveal } from "@/components/motion/reveal";
import { useEffect, useState } from "react";

type DrinkServedPanelProps = {
  pastMasterLine?: string | null;
  onSip: () => void;
};

/** pour → ready — 注ぎ終わってから口をつける */
export function DrinkServedPanel({
  pastMasterLine,
  onSip,
}: DrinkServedPanelProps) {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setReady(true), 1200);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="space-y-5">
      {pastMasterLine && <MasterLine>{pastMasterLine}</MasterLine>}
      {!pastMasterLine && !ready && (
        <p className="text-center text-[11px] tracking-[0.25em] text-stone-500/70">
          ……
        </p>
      )}
      {ready && (
        <Reveal delay={0.2} className="mx-auto w-full max-w-[220px] pt-2">
          <BarButton variant="primary" onClick={onSip}>
            口をつける
          </BarButton>
        </Reveal>
      )}
    </div>
  );
}
