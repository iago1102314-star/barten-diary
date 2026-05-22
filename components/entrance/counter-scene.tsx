import Image from "next/image";
import { ENTRANCE_ASSETS } from "@/lib/entrance/asset-paths";

type CounterSceneProps = {
  drinkImageSrc?: string | null;
  priority?: boolean;
};

function SceneLayer({
  src,
  alt,
  priority = false,
}: {
  src: string;
  alt: string;
  priority?: boolean;
}) {
  return (
    <Image
      src={src}
      alt={alt}
      fill
      priority={priority}
      sizes="420px"
      className="object-cover"
      draggable={false}
      unoptimized
    />
  );
}

/**
 * カウンター画面 — back → master → front → drink の順で重ねる
 */
export function CounterScene({ drinkImageSrc, priority = false }: CounterSceneProps) {
  return (
    <>
      <div className="absolute inset-0">
        <SceneLayer
          src={ENTRANCE_ASSETS.counterBack}
          alt=""
          priority={priority}
        />
      </div>
      <div className="absolute inset-0">
        <SceneLayer src={ENTRANCE_ASSETS.masterIdle} alt="" priority={priority} />
      </div>
      <div className="absolute inset-0">
        <SceneLayer
          src={ENTRANCE_ASSETS.counterFront}
          alt=""
          priority={priority}
        />
      </div>
      {drinkImageSrc && (
        <div className="absolute inset-0">
          <SceneLayer src={drinkImageSrc} alt="" />
        </div>
      )}
    </>
  );
}
