"use client";

import { LampGlow } from "@/components/entrance/atmosphere";
import { MasterLine } from "@/components/entrance/master-line";
import { SceneFrame } from "@/components/entrance/scene-frame";
import { ENTRANCE_ASSETS } from "@/lib/entrance/asset-paths";
import { EASE_DRIFT } from "@/lib/entrance/motion-presets";
import { motion } from "motion/react";
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
    <SceneFrame className="bg-black">
      <motion.div
        className="absolute inset-0"
        initial={{ scale: 1.12, x: -6 }}
        animate={{ scale: 1, x: 0 }}
        transition={{
          scale: { duration: 16, ease: "easeOut" },
          x: { duration: 16, ease: "easeOut" },
        }}
      >
        <Image
          src={ENTRANCE_ASSETS.leaving}
          alt=""
          fill
          priority
          sizes="420px"
          className={`object-cover transition-opacity duration-[1100ms] ${
            sceneVisible ? "opacity-100" : "opacity-0"
          }`}
          draggable={false}
          unoptimized
        />
      </motion.div>

      {/* 店内の暖色灯 — ペンダント2基・卓上ランタン */}
      <div
        className={`transition-opacity duration-[1300ms] ${
          sceneVisible ? "opacity-100" : "opacity-0"
        }`}
      >
        <LampGlow x={70} y={27} tone="warm" size={14} intensity={0.5} speed="5s" />
        <LampGlow x={88} y={23} tone="warm" size={15} intensity={0.55} speed="6.5s" />
        <LampGlow x={80} y={52} tone="warm" size={9} intensity={0.45} speed="4.2s" />
        <LampGlow x={14} y={32} tone="warm" size={8} intensity={0.35} speed="7.5s" />
        <LampGlow x={33} y={15} tone="warm" size={8} intensity={0.3} speed="9s" />
      </div>

      <div
        className={`absolute inset-0 bg-black/30 transition-opacity duration-[1100ms] ${
          sceneVisible ? "opacity-100" : "opacity-0"
        }`}
      />
      <div
        className={`absolute inset-x-0 bottom-[18%] z-30 px-6 transition-all duration-[900ms] ${
          masterVisible ? "translate-y-0 opacity-100" : "translate-y-3 opacity-0"
        }`}
      >
      <MasterLine delay={0.7}>……気をつけて帰れよ</MasterLine>
      </div>
    </SceneFrame>
  );
}
