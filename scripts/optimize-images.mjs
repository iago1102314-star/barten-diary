#!/usr/bin/env node
/**
 * public/ 配下ラスタ画像の最適化。
 *
 * - 写真・背景・AI生成 → 真の WebP (quality 85, アルファ保持, 解像度維持)
 * - UI マスク素材 → WebP lossless（アルファ境界を維持）
 * - PWA アイコン (public/icons/*.png) → 変換しない
 *
 * Usage:
 *   node scripts/optimize-images.mjs          # 変換実行
 *   node scripts/optimize-images.mjs --dry-run # 調査のみ
 *   node scripts/optimize-images.mjs --force   # 既に WebP でも再エンコード
 */

import { createHash } from "node:crypto";
import { promises as fs } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, "..");
const PUBLIC_DIR = path.join(ROOT, "public");

const RASTER_EXT = new Set([".webp", ".png", ".jpg", ".jpeg", ".gif"]);
const DEFAULT_QUALITY = 85;
const DEFAULT_ALPHA_QUALITY = 90;

/** @type {ReadonlyArray<{ id: string; match: (rel: string) => boolean; mode: "lossy" | "lossless" | "skip"; purpose: string; keepPngReason?: string }>} */
const RULES = [
  {
    id: "pwa-icons",
    match: (rel) => rel.startsWith("icons/") && rel.endsWith(".png"),
    mode: "skip",
    purpose: "PWA / manifest アイコン",
    keepPngReason:
      "マニフェスト標準・小サイズ pixel-perfect。拡張子 .png のまま維持。",
  },
  {
    id: "diary-tape",
    match: (rel) => rel.startsWith("assets/diary/tape/"),
    mode: "lossless",
    purpose: "日記 UI — マスキングテープ（アルファマスク）",
  },
  {
    id: "bar-scenes",
    match: (rel) => rel.startsWith("assets/bar/"),
    mode: "lossy",
    purpose: "バー店内・録音背景",
  },
  {
    id: "drink-assets",
    match: (rel) => rel.startsWith("assets/drinks/"),
    mode: "lossy",
    purpose: "ドリンク record / diary 画像",
  },
  {
    id: "alley-start-master",
    match: (rel) =>
      rel.startsWith("assets/alley/") ||
      rel.startsWith("assets/start/") ||
      rel.startsWith("assets/master/"),
    mode: "lossy",
    purpose: "路地・入店・マスター立ち絵",
  },
  {
    id: "diary-paper",
    match: (rel) => rel === "assets/diary/paper.webp",
    mode: "lossy",
    purpose: "日記紙テクスチャ",
  },
  {
    id: "guest",
    match: (rel) => rel === "guest.webp",
    mode: "lossy",
    purpose: "ゲスト用イラスト",
  },
];

const args = new Set(process.argv.slice(2));
const DRY_RUN = args.has("--dry-run");
const FORCE = args.has("--force");

function detectFormat(buffer) {
  if (buffer.length >= 4 && buffer[0] === 0x89 && buffer[1] === 0x50) {
    return "PNG";
  }
  if (buffer.length >= 2 && buffer[0] === 0xff && buffer[1] === 0xd8) {
    return "JPEG";
  }
  if (
    buffer.length >= 12 &&
    buffer.toString("ascii", 0, 4) === "RIFF" &&
    buffer.toString("ascii", 8, 12) === "WEBP"
  ) {
    return "WEBP";
  }
  if (buffer.length >= 3 && buffer.toString("ascii", 0, 3) === "GIF") {
    return "GIF";
  }
  return "UNKNOWN";
}

function resolveRule(relPosix) {
  for (const rule of RULES) {
    if (rule.match(relPosix)) return rule;
  }
  return {
    id: "default-lossy",
    match: () => true,
    mode: "lossy",
    purpose: "その他ラスタ画像",
  };
}

async function walkRasterFiles(dir, base = dir) {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  /** @type {string[]} */
  const files = [];

  for (const entry of entries) {
    const abs = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...(await walkRasterFiles(abs, base)));
      continue;
    }
    const ext = path.extname(entry.name).toLowerCase();
    if (RASTER_EXT.has(ext)) {
      files.push(abs);
    }
  }

  return files.sort();
}

function sha256(buffer) {
  return createHash("sha256").update(buffer).digest("hex");
}

async function encodeWebp(inputBuffer, mode, hasAlpha) {
  const pipeline = sharp(inputBuffer, { animated: false }).rotate();

  if (mode === "lossless") {
    return pipeline
      .webp({
        lossless: true,
        effort: 6,
      })
      .toBuffer();
  }

  return pipeline
    .webp({
      quality: DEFAULT_QUALITY,
      alphaQuality: hasAlpha ? DEFAULT_ALPHA_QUALITY : undefined,
      effort: 6,
      smartSubsample: true,
    })
    .toBuffer();
}

async function inspectFile(absPath) {
  const buffer = await fs.readFile(absPath);
  const meta = await sharp(buffer, { animated: false }).metadata();
  const format = detectFormat(buffer);
  const rel = path.relative(PUBLIC_DIR, absPath).split(path.sep).join("/");
  const rule = resolveRule(rel);

  return {
    absPath,
    rel,
    format,
    width: meta.width ?? null,
    height: meta.height ?? null,
    sizeBefore: buffer.length,
    hasAlpha: meta.hasAlpha === true,
    rule,
    buffer,
  };
}

async function main() {
  const files = await walkRasterFiles(PUBLIC_DIR);
  /** @type {Array<Record<string, unknown>>} */
  const report = [];
  /** @type {Array<{ rel: string; reason: string }>} */
  const keptPng = [];

  let converted = 0;
  let skipped = 0;

  for (const absPath of files) {
    const info = await inspectFile(absPath);
    const { rel, format, rule } = info;

    if (rule.mode === "skip") {
      skipped += 1;
      if (rule.keepPngReason) {
        keptPng.push({ rel, reason: rule.keepPngReason });
      }
      report.push({
        path: rel,
        purpose: rule.purpose,
        action: "skip",
        formatBefore: format,
        formatAfter: format,
        width: info.width,
        height: info.height,
        bytesBefore: info.sizeBefore,
        bytesAfter: info.sizeBefore,
        reductionPercent: 0,
        note: rule.keepPngReason ?? "skip rule",
      });
      continue;
    }

    const needsConvert = format !== "WEBP" || FORCE;

    if (!needsConvert) {
      skipped += 1;
      report.push({
        path: rel,
        purpose: rule.purpose,
        action: "already-webp",
        formatBefore: format,
        formatAfter: format,
        width: info.width,
        height: info.height,
        bytesBefore: info.sizeBefore,
        bytesAfter: info.sizeBefore,
        reductionPercent: 0,
      });
      continue;
    }

    if (DRY_RUN) {
      report.push({
        path: rel,
        purpose: rule.purpose,
        action: `would-convert-${rule.mode}`,
        formatBefore: format,
        formatAfter: "WEBP",
        width: info.width,
        height: info.height,
        bytesBefore: info.sizeBefore,
        bytesAfter: null,
        reductionPercent: null,
      });
      continue;
    }

    const encoded = await encodeWebp(info.buffer, rule.mode, info.hasAlpha);
    const outFormat = detectFormat(encoded);

    if (outFormat !== "WEBP") {
      throw new Error(`${rel}: encoded output is not WebP (${outFormat})`);
    }

    const outMeta = await sharp(encoded).metadata();
    if (outMeta.width !== info.width || outMeta.height !== info.height) {
      throw new Error(
        `${rel}: dimension mismatch ${info.width}x${info.height} → ${outMeta.width}x${outMeta.height}`,
      );
    }

    const hashBefore = sha256(info.buffer);
    await fs.writeFile(absPath, encoded);
    const written = await fs.readFile(absPath);
    const hashAfter = sha256(written);

    if (detectFormat(written) !== "WEBP") {
      throw new Error(`${rel}: written file is not WebP`);
    }

    converted += 1;
    const reduction =
      info.sizeBefore > 0
        ? ((1 - written.length / info.sizeBefore) * 100)
        : 0;

    report.push({
      path: rel,
      purpose: rule.purpose,
      action: rule.mode === "lossless" ? "convert-lossless-webp" : "convert-lossy-webp",
      formatBefore: format,
      formatAfter: "WEBP",
      width: info.width,
      height: info.height,
      bytesBefore: info.sizeBefore,
      bytesAfter: written.length,
      reductionPercent: Number(reduction.toFixed(1)),
      unchanged: hashBefore === hashAfter,
    });
  }

  const reportPath = path.join(ROOT, "scripts", "optimize-images-report.json");
  if (!DRY_RUN) {
    await fs.writeFile(reportPath, JSON.stringify({ generatedAt: new Date().toISOString(), report, keptPng }, null, 2));
  }

  printSummary(report, keptPng, { converted, skipped, dryRun: DRY_RUN });

  if (!DRY_RUN) {
    console.log(`\nReport written: ${path.relative(ROOT, reportPath)}`);
  }
}

function formatKb(bytes) {
  return `${(bytes / 1024).toFixed(1)} KB`;
}

function printSummary(report, keptPng, stats) {
  console.log(
    stats.dryRun
      ? "\n=== optimize-images (dry-run) ===\n"
      : "\n=== optimize-images complete ===\n",
  );

  const convertedRows = report.filter((r) =>
    String(r.action).startsWith("convert"),
  );

  if (convertedRows.length > 0) {
    console.log("path | before | after | reduction | format");
    console.log("-".repeat(90));
    for (const row of convertedRows) {
      console.log(
        `${row.path} | ${formatKb(row.bytesBefore)} | ${formatKb(row.bytesAfter)} | ${row.reductionPercent}% | ${row.formatBefore}→WEBP`,
      );
    }

    const totalBefore = convertedRows.reduce((s, r) => s + r.bytesBefore, 0);
    const totalAfter = convertedRows.reduce((s, r) => s + r.bytesAfter, 0);
    const totalReduction = ((1 - totalAfter / totalBefore) * 100).toFixed(1);
    console.log("-".repeat(90));
    console.log(
      `TOTAL (${convertedRows.length} files): ${formatKb(totalBefore)} → ${formatKb(totalAfter)} (${totalReduction}% reduction)`,
    );
  }

  if (keptPng.length > 0) {
    console.log("\n=== PNG maintained ===");
    for (const item of keptPng) {
      console.log(`- ${item.rel}: ${item.reason}`);
    }
  }

  console.log(
    `\nConverted: ${stats.converted}, Skipped: ${stats.skipped}${stats.dryRun ? " (dry-run)" : ""}`,
  );
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
