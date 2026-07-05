/**
 * iOS 向け SE — 元音源から dB 減衰した mp4 を public/sounds/ios/ に生成する。
 *
 * 前提: ffmpeg が PATH にあること
 *   brew install ffmpeg
 *
 * 使い方:
 *   node scripts/generate-ios-sfx.mjs
 *   node scripts/generate-ios-sfx.mjs --only click,door
 *
 * 生成後:
 *   npm run prepare:ios-sfx
 */

import { spawn } from "node:child_process";
import { mkdir } from "node:fs/promises";
import path from "node:path";

const repoRoot = process.cwd();
const soundsDir = path.join(repoRoot, "public", "sounds");
const iosDir = path.join(soundsDir, "ios");

/** SE3 聴感ベース — 実機で微調整してから再生成 */
const IOS_SFX_ATTENUATION_DB = {
  click: -12,
  door: -16,
  glassSlide: -10,
};

const IOS_SFX_SOURCES = {
  click: { input: "click.mp4", output: "click.mp4" },
  door: { input: "door.mp4", output: "door.mp4" },
  glassSlide: { input: "grass.mp4", output: "grass.mp4" },
};

function parseOnlyArg(argv) {
  const onlyFlag = argv.find((arg) => arg.startsWith("--only="));
  if (onlyFlag) {
    return onlyFlag.slice("--only=".length).split(",").map((s) => s.trim());
  }

  const onlyIndex = argv.indexOf("--only");
  if (onlyIndex >= 0 && argv[onlyIndex + 1]) {
    return argv[onlyIndex + 1].split(",").map((s) => s.trim());
  }

  return null;
}

function runFfmpeg(inputPath, outputPath, attenuationDb) {
  const filter = `volume=${attenuationDb}dB`;

  return new Promise((resolve, reject) => {
    const args = [
      "-y",
      "-i",
      inputPath,
      "-af",
      filter,
      "-c:a",
      "aac",
      "-b:a",
      "128k",
      "-movflags",
      "+faststart",
      outputPath,
    ];

    const child = spawn("ffmpeg", args, { stdio: "inherit" });
    child.on("error", reject);
    child.on("close", (code) => {
      if (code === 0) resolve();
      else reject(new Error(`ffmpeg exited with code ${code}`));
    });
  });
}

async function main() {
  const only = parseOnlyArg(process.argv.slice(2));
  const targets = only?.length
    ? only.filter((kind) => kind in IOS_SFX_SOURCES)
    : Object.keys(IOS_SFX_SOURCES);

  if (targets.length === 0) {
    console.error("No valid targets. Use click | door | glassSlide");
    process.exit(1);
  }

  await mkdir(iosDir, { recursive: true });

  for (const kind of targets) {
    const { input, output } = IOS_SFX_SOURCES[kind];
    const attenuationDb = IOS_SFX_ATTENUATION_DB[kind];
    const inputPath = path.join(soundsDir, input);
    const outputPath = path.join(iosDir, output);

    console.info(
      `[ios-sfx] ${kind}: ${input} → ios/${output} (${attenuationDb} dB)`,
    );
    await runFfmpeg(inputPath, outputPath, attenuationDb);
  }

  console.info("[ios-sfx] done — run: npm run prepare:ios-sfx");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
