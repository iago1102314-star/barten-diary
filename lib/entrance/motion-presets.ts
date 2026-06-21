/**
 * 演出用の共通イージング・タイミング。
 * バー全体で「静かに立ち上がり、静かに引く」動きに統一する。
 */

/** ゆっくり減速する基本イージング */
export const EASE_SOFT = [0.22, 0.61, 0.36, 1] as const;

/** 到着直前で強く減速するイージング */
export const EASE_DECELERATE = [0.16, 1, 0.3, 1] as const;

/** 余韻を残してたゆたうイージング */
export const EASE_DRIFT = [0.4, 0.0, 0.2, 1] as const;

export const DURATION = {
  /** セリフ・小要素の立ち上がり */
  line: 0.9,
  /** パネル全体の出現 */
  panel: 1.1,
  /** シーン転換 */
  scene: 1.3,
} as const;

/** 下からそっと立ち上がるフェード */
export const fadeUpVariants = {
  hidden: { opacity: 0, y: 10 },
  visible: { opacity: 1, y: 0 },
} as const;

/** その場で滲み出るフェード */
export const fadeVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 },
} as const;

/** 子要素を順に立ち上げるコンテナ */
export const staggerContainer = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.12,
      delayChildren: 0.08,
    },
  },
} as const;
