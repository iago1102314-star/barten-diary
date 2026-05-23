"use client";

import { MasterLine } from "@/components/entrance/master-line";
import { SceneFrame } from "@/components/entrance/scene-frame";
import { ENTRANCE_ASSETS } from "@/lib/entrance/asset-paths";
import Image from "next/image";
import { useEffect, useState } from "react";

const LEAVING_DURATION_MS = 3200;
const MASTER_DELAY_MS = 1000;

type LeavingScreenProps = {
  onComplete: () => void;
};

/** 店を出る → 路地へ戻る */
export function LeavingScreen({ onComplete }: LeavingScreenProps) {
  const [sceneVisible, setSceneVisible] = useState(false);
  const [masterVisible, setMasterVisible] = useState(false);

  useEffect(() => {
    const sceneTimer = setTimeout(() => setSceneVisible(true), 80);
    const masterTimer = setTimeout(() => setMasterVisible(true), MASTER_DELAY_MS);
    const completeTimer = setTimeout(onComplete, LEAVING_DURATION_MS);

    return () => {
      clearTimeout(sceneTimer);
      clearTimeout(masterTimer);
      clearTimeout(completeTimer);
    };
  }, [onComplete]);

  return (
    <SceneFrame className="rounded-xl bg-black">
      <Image
        src={ENTRANCE_ASSETS.leaving}
        alt=""
        fill
        priority
        sizes="420px"
        className={`object-cover transition-opacity duration-700 ${
          sceneVisible ? "opacity-100" : "opacity-0"
        }`}
        draggable={false}
        unoptimized
      />
      <div
        className={`absolute inset-0 bg-black/30 transition-opacity duration-700 ${
          sceneVisible ? "opacity-100" : "opacity-0"
        }`}
      />
      <div
        className={`absolute inset-x-0 bottom-[18%] px-6 transition-all duration-500 ${
          masterVisible
            ? "translate-y-0 opacity-100"
            : "translate-y-3 opacity-0"
        }`}
      >
        <MasterLine>……気をつけて帰れよ</MasterLine>
      </div>
    </SceneFrame>
  );
}
