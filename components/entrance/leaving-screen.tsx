"use client";

import { MasterLine } from "@/components/entrance/master-line";
import { SceneFrame } from "@/components/entrance/scene-frame";
import { ENTRANCE_ASSETS } from "@/lib/entrance/asset-paths";
import Image from "next/image";
import { useEffect } from "react";

type LeavingScreenProps = {
  onComplete: () => void;
};

/** 店を出る → 路地へ戻る */
export function LeavingScreen({ onComplete }: LeavingScreenProps) {
  useEffect(() => {
    const timer = setTimeout(onComplete, 2400);
    return () => clearTimeout(timer);
  }, [onComplete]);

  return (
    <SceneFrame className="rounded-xl">
      <Image
        src={ENTRANCE_ASSETS.leaving}
        alt=""
        fill
        priority
        sizes="420px"
        className="object-cover"
        draggable={false}
        unoptimized
      />
      <div className="absolute inset-0 bg-black/30" />
      <div className="absolute inset-x-0 bottom-[18%] px-6">
        <MasterLine>……気をつけて帰れよ</MasterLine>
      </div>
    </SceneFrame>
  );
}
