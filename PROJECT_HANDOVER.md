# バーテン日記 — 開発引き継ぎ資料

最終更新: 2026-07-06  
対象ブランチ: `dev` / `main`（現状ほぼ同期。未コミット作業あり — 末尾参照）

---

## 1. プロジェクト概要

### コンセプト

**バーテン日記（back bar）** は、深夜のバーに入店し、マスターに話しかけるように **音声で一日を振り返り**、AI が **「夜の記録」** に整えてくれる PWA 体験アプリ。

- 世界観: 静かな路地 → 扉 → カウンター → 録音 → 酒の演出 → 日記紙 → 記録棚
- ユーザーは「書く」のではなく **話す**。AI は創作せず **忠実な編集者**（フィラー除去・整形のみ）
- β 公開中: ゲスト利用可、Google ログインでクラウド保存、1 日 3 件まで生成制限

### 技術構成

| 層 | 技術 |
|---|---|
| フレームワーク | Next.js 16（App Router）+ React 19 |
| スタイル | Tailwind CSS 4 + CSS Modules（演出シーン） |
| アニメーション | GSAP / Motion / CSS keyframes |
| 認証・DB | Supabase Auth（Google OAuth）+ Postgres |
| AI | OpenAI Whisper（文字起こし）+ GPT（日記整形） |
| ホスティング | Vercel（local / dev / production の 3 環境） |
| PWA | Service Worker、manifest、オフライン fallback |
| 分析 | Vercel Analytics、Supabase behavior_logs |

**環境変数**: `.env.example` を参照。`NEXT_PUBLIC_APP_ENV` = `local` | `dev` | `production`。

**重要**: このリポジトリの Next.js は通常版と API が異なる場合がある。変更前に `node_modules/next/dist/docs/` を確認すること（`AGENTS.md` 参照）。

### ディレクトリ構成

```
app/                          # Next.js App Router
  page.tsx                    # ホーム（入店フロー入口）
  (app)/                      # 認証後ルート群
    diaries/                  # 日記一覧・詳細
    memories/                 # 記録棚（メモ棚）
    lab/                      # プロンプト・ランプグロー等の開発ラボ
  api/
    transcribe/               # Whisper
    generate-diary/           # GPT 日記生成
    generation/readiness/     # 到達性チェック（本文生成なし）
    memories/                 # 棚 API
  auth/callback/              # OAuth コールバック
  login/                      # ログイン画面

components/
  entrance/                   # 入店〜録音〜退店のメイン UI（最大ブロック）
  diary-paper/                # 日記紙 UI・エクスポート
  memories/                   # 記録棚
  recorder/                   # 録音ワークスペース（lab 用）
  settings/                   # 設定メニュー
  dev/                        # 音量チューニングパネル等
  lab/                        # ラボ UI
  app/                        # シェル・Bisect パネル・SW 登録

hooks/
  use-night-session.ts        # ★ 夜の一連フローの中枢
  use-recorder.ts             # MediaRecorder
  use-bar-audio.ts            # BGM/SE フック
  use-generate-diary.ts       # 日記生成
  use-compact-height-viewport.ts

lib/
  entrance/                   # 演出チューニング・bar-audio-engine・シーン定数
  night/                      # パイプライン・保存・制限
  recorder/                   # プラットフォーム別録音
  transcribe/                 # クライアント transcribe
  ai/                         # プロンプト・生成・品質・セキュリティ
  drinks/                     # 酒カタログ・アセット
  memories/                   # 棚ロジック
  layout/                     # PC シェル・iOS 高さ・perf/layout フラグ
  dev/                        # 開発ショートカット（現在無効）
  analytics/                  # 行動ログ

public/
  assets/                     # 背景・酒画像・フォント
  sounds/                     # BGM(mp3)・SE(mp4)
  sounds/ios/                 # iOS 用 attenuated SE

scripts/                      # アセット manifest 生成・iOS SE 生成
supabase/                     # SQL・分析クエリ
```

---

## 2. 実装済み機能

### 認証

- Google OAuth（Supabase）
- ゲスト: 日記は `localStorage` にドラフト保存、ログイン後 flush
- ログイン画面: `app/login/` — local のみ `LoginAuthDiagnostics`
- 保存時ログイン要求: `runNightSave` → `saveAiDiary` → `needsLogin`
- 管理者: Google アカウント判定 + `behavior_logs` / diaries の `is_admin`

### 録音

- `hooks/use-recorder.ts` + `lib/recorder/recorder-platform.ts`
- 最大 **3 分**（`MAX_DURATION_MS`）
- プラットフォーム分岐:
  - Chrome: WebM/Opus、timeslice 250ms、finalize 0ms
  - Safari（iOS + PC）: timeslice 1000ms、finalize 300ms、`requestData()` before stop
  - iOS のみ: mic release retry、MIME 候補 `audio/mp4` 優先
- 録音中: BGM/SE **完全停止**（duck ではない）
- 終了後ローカルチェック: `validate-recording-for-transcribe.ts`（最小 2s / 2048 bytes / too quiet）

### Whisper

- クライアント: `lib/transcribe/transcribe-audio.ts` → `POST /api/transcribe`
- サーバー: mime 解決（form `mimeType` → file.type → 拡張子 → fallback）
- 整形: `refine-transcript.ts`（temperature 0.15）
- ハルシネーション検出: `whisper-context.ts` / `validate-input.ts`

### AI 日記生成

- 思想: **忠実編集**（`lib/ai/prompts/` — fidelity / ng-patterns / security）
- フロー: transcribe → transcript 境界チェック → readiness API → generate API
- temperature **0.64**、夜の記録上限 **420 字**
- 酒: `drink-catalog.ts` の 4 銘柄 + カテゴリ（感情）から `pick-drink`
- bottleTag: `lib/bottle-tag/` で組み立て

### 保存

- `lib/night/run-night-save.ts` → `app/(app)/diaries/actions.ts`（`saveAiDiary`）
- ゲストドラフト: `lib/night/guest-diary-drafts.ts`
- 日記詳細・棚: Supabase + `/api/memories`

### BGM

- 中枢: `lib/entrance/bar-audio-engine.ts`（シングルトン `barAudioEngine`）
- トラック: `outsideAlley` / `outsideLeaving` / `jazzCounter`
- iOS: `MOBILE_IOS_AUDIO_MIX`（PC mix とは独立）、ジャズは Web Audio Gain 経路あり
- ユーザー設定: 設定メニューの BGM スライダー

### SE

- click / door / glassSlide / send / menuOpen / menuClick / page / think
- iOS: `public/sounds/ios/` の attenuated 版をルーティング（`ios-sfx-assets.ts`）
- peakDbfs 補正 + sceneScale（`audio-volume-tuning.ts`）

### 感情選択

- 3 カテゴリ: 少し濃いめで / 整理したくて / 余韻が残ってて
- `MoodSelectScene` + 入退場 tuning（`mood-select-*-tuning.ts`）
- compact height（≤699px）: `compact-height-viewport.ts` + `use-compact-height-viewport.ts`

### 酒演出

- 録音シーン: `record-counter-scene.tsx` + `record-counter-scene-tuning.ts`
- 酒名リビール: `drink-name-reveal.tsx` + tuning
- 日記用画像: `public/assets/drinks/{id}/diary/`

### 記録一覧

- `/memories` — メモ棚（ページめくり、ゲスト CTA）
- `/diaries` — 日記一覧（管理用寄り）
- 日記紙: `components/diary-paper/`

### その他（β）

- 1 日 3 件生成制限（`daily-generation-limit.ts`）
- フィードバック送信
- Loading Gate（点灯演出）
- 過去のボトルから続ける
- 録音チュートリアル・制限通知

---

## 3. 重要な設計思想

### なぜその実装なのか

| 領域 | 方針 |
|---|---|
| 日記 AI | ライターではなく編集者。創作・要約・締め追加禁止。プロンプトと `transcript-generation-boundary` で二重ガード |
| 録音後フロー | Whisper 後すぐ **readiness**（軽量）→ 店内エンディング演出と **並行**で本文生成。体感待ちを短く |
| 音声 | HTMLAudio 主体。iOS は Web Audio / 専用 SE ファイルでラウドネス問題を回避。PC mix と iOS mix を分離 |
| チューニング | 数値は `*-tuning.ts` に集約。コンポーネントにマジックナンバーを散らさない |
| ゲスト | ログイン強制しない。保存タイミングで自然に誘導 |
| PWA | iPhone 実機は HTTPS 必須（LAN http では getUserMedia 不可） |

### やってはいけない変更

1. **録音時間の延長** — ユーザー合意なしに `MAX_DURATION_MS` / `MIN_RECORDING_MS` をいじらない
2. **PC Safari 向け ffmpeg 変換** — 未検討・禁止扱い（クライアント負荷・複雑化）
3. **iOS 成功経路の破壊** — `isAppleMediaRecorder()` の mic retry / MIME 順を PC 向けに統合しない
4. **AI プロンプトの「創作許可」** — 品質より忠実度がプロダクトの核
5. **bar-audio-engine の無秩序リファクタ** — 3000 行超。挙動変更は必ず SE3 + PC で聴感確認
6. **本番で診断 UI を常時 ON** — env フラグで制御されている
7. **Next.js 一般知識だけで API を書く** — この repo の Next 16 は非互換あり

### iPhone 対応方針

- **実機テスト**: `npm run dev:lan` + `npm run dev:tunnel`（cloudflared）推奨
- **PWA**: Vercel dev の **固定 URL** でホーム画面追加（Preview URL は使わない）
- **Safari 録音**: timeslice ≥1s、finalize 300ms、`requestData()` — iOS で検証済み
- **高さ**: iOS Safari ブラウザのみ `--app-visual-height`（PWA standalone では無効）
- **compact height**: visualViewport ≤699px で mood select レイアウト上書き
- **音量**: `MOBILE_IOS_AUDIO_MIX` + iOS 専用 SE ファイル

### レスポンシブ方針

- **モバイルファースト**（iPhone SE3 を基準実機）
- **PC**: `layout-shell.tsx` — 768px 以上で最大幅 430px のスマホ枠（レターボックス）
- **高さ軸**: `compact-height-viewport.ts`（699px 以下）
- **横レターボックス**: counter 系は `object-cover` + tuning で対応（`ed411c0` 参照）
- 演出の「秒数」は `MOOD_SELECT_ENTRANCE_DURATION_SCALE = 4` 等で一括スケール

---

## 4. チューニング値（主要一覧）

### 録音

| 定数 | 値 | ファイル |
|---|---|---|
| MAX_DURATION_MS | 180_000 (3分) | hooks/use-recorder.ts |
| MIN_RECORDING_MS | 2_000 | validate-recording-for-transcribe.ts |
| MIN_RECORDING_BYTES | 2_048 | recorder-platform.ts |
| MIN_RECORDING_BYTES_PER_SEC | 2_000 | recorder-platform.ts（Safari mp4 はスキップ） |
| APPLE_RECORDER_TIMESLICE_MS | 1_000 | recorder-platform.ts |
| DEFAULT_RECORDER_TIMESLICE_MS | 250 | recorder-platform.ts |
| APPLE_RECORDER_FINALIZE_DELAY_MS | 300 | recorder-platform.ts |
| MIC_RELEASE_DELAY_MS | 300 | recorder-platform.ts（iOS のみ） |

### AI / 制限

| 定数 | 値 | ファイル |
|---|---|---|
| GENERATION_TEMPERATURE | 0.64 | lib/ai/prompts/constants.ts |
| DIARY_MAX_CHARS | 420 | 同上 |
| DIARY_WARN_CHARS | 360 | 同上 |
| DAILY_GENERATION_LIMIT_MAX | 3 | daily-generation-limit.ts |
| TRANSCRIBE_TIMEOUT_MS | 90_000 | transcribe-audio.ts |
| GENERATE_TIMEOUT_MS | 90_000 | generate-diary-client.ts |

### レイアウト

| 定数 | 値 | ファイル |
|---|---|---|
| DESKTOP_APP_SHELL_MIN_WIDTH_PX | 768 | app-portal.ts |
| DESKTOP_APP_SHELL_MAX_WIDTH_PX | 430 | app-portal.ts |
| COMPACT_HEIGHT_VIEWPORT_MAX_PX | 699 | compact-height-viewport.ts |
| MOOD_SELECT optionBlockBottomPx | 122（compact: 100） | mood-select-layout-tuning.ts |
| MOOD_SELECT footerBottomPx | 40（compact: 32） | 同上 |

### BGM mix（PC — `AUDIO_VOLUME_TUNING`）

| キー | mix |
|---|---|
| outsideAlley | 0.27 |
| outsideLeaving | 0.15 |
| jazzCounter | 0.042 |

### BGM mix（iOS — `MOBILE_IOS_AUDIO_MIX` revision 5）

| キー | mix |
|---|---|
| outsideAlley | 0.06 |
| outsideLeaving | 0.06 |
| jazzCounter | 0.017 |

### SE mix（PC 抜粋）

| キー | mix | peakDbfs |
|---|---|---|
| door | 0.14 | 0 |
| glassSlide | 0.53 | -0.2 |
| click | 0.18 | -5.9 |
| think | 0.6 | -15.5 |

### 演出タイミング（抜粋）

| 定数 | 値 | 用途 |
|---|---|---|
| MOOD_SELECT_ENTRANCE_DURATION_SCALE | 4 | 気分選択入場 |
| MOOD_SELECT_CAMERA_VIGNETTE_BASE_SEC | 0.25 | カメラ/ビネット |
| LOADING_GATE_LIGHT_SEQUENCE_MS | ~3000 | 点灯演出 |
| START_ENTRY_REVEAL_MS | 1300 | ホーム入場 |
| DRINK_NAME_REVEAL_LEAD_MS | 1200 | 酒名表示 |
| MEMO_SHELF_PAGE_DURATION_SEC | 0.3 | 棚ページめくり |

### マスター吹き出し

`lib/entrance/master-dialogue-typography.ts` — `dialoguePanelBottomPaddingRem: 10`、typewriter 速度等。帯は **上端固定・2 行目は下にのみ伸びる**。

---

## 5. 未解決問題（優先順位）

### P0 — ブロッカー

| 問題 | 状態 | メモ |
|---|---|---|
| **PC Safari 録音 → Whisper 空** | 未解決 | Blob は生成・API 到達。Chrome / SE3 Safari は成功。案1+2（mime）、案3（finalize）も失敗。`debug-recording-blob.ts` でファイル DL して ffprobe 切り分け中 |
| PC Safari 録音時の「プツッ」音 | 調査中 | 無音/破損/contain 問題の手がかり |

### P1 — β 品質

| 問題 | メモ |
|---|---|
| SE3 熱・メモリ | preload 直列化済み。Bisect フラグで継続監視 |
| compact height Phase 2 未着手 | 録音シーン（酒タイトル/ノート vs グラス）の短 viewport 対応 |
| README が Create Next App のまま | 開発者向けドキュメント不足（本資料で補完） |

### P2 — 改善

| 問題 | メモ |
|---|---|
| `bar-audio-engine.ts` 巨大化 | 変更リスク高 |
| 大量の `@deprecated` re-export | 段階的削除 |
| 未コミットの Safari 修正 | 手元に recorder-platform / debug-recording-blob 等 |

---

## 6. 次にやるべきこと

### 今日から再開する手順

```bash
cp .env.example .env.local   # 未作成なら
# OPENAI_API_KEY, Supabase, NEXT_PUBLIC_APP_ENV=local を設定
npm run dev
```

PC Safari 調査時:

```bash
# .env.local
NEXT_PUBLIC_RECORDING_DIAGNOSTIC=true
```

1. PC Safari で 2〜5 秒録音
2. 診断ログ → **録音DL (safari-recording.m4a)**
3. `ffprobe` / `ffmpeg volumedetect` / QuickTime 再生
4. 結果に応じて切り分け:
   - **声あり** → Whisper / mime / サーバー側
   - **無音・プツッのみ** → MediaRecorder / BGM 停止タイミング / getUserMedia
   - **破損** → chunk 組み立て / timeslice

### 推奨タスク順

1. PC Safari 録音ファイルの物理検証（上記）
2. 検証結果に基づく最小修正（ffmpeg なし）
3. 未コミット分の整理・コミット
4. SE3 で regress（録音・Whisper・BGM・mood select）
5. 診断コードの本番前整理（Appendix A 参照）

### 実機確認チェックリスト

- [ ] PC Chrome: 録音 → 文字起こし → 日記
- [ ] PC Safari: 同上（現状失敗）
- [ ] SE3 Safari（PWA）: 同上
- [ ] ゲスト → ログイン → ドラフト保存
- [ ] 4 酒 × 感情選択 → 酒演出
- [ ] 1 日 3 件制限

---

## 付録 A: 診断・実験・一時実装の分類

### 削除してよいもの（本番前）

| 項目 | 場所 | 理由 |
|---|---|---|
| `LoginAuthDiagnostics` | local のみ表示だが本番ビルドに含まれる | 本番不要 |
| `lib/dev/fake-nights.ts` 等 | dev ショートカット無効化済み | 使われていない |
| `DevPostRecordSkipButton` | entrance-flow | `isDevShortcutEnabled() === false` |
| Lamp glow **Editor** コンポーネント群 | entrance-flow に import | 本番 UI に出ないよう要確認 |
| `components/lab/*` | `/lab` ルート | β 公開時はルートガード or 削除検討 |
| `debug-recording-blob.ts` | 調査完了後 | 一時デバッグ |
| `?audioTune=1` パネル | dev 用 | production では無効化確認済みか要チェック |

### 本番前まで残すもの

| 項目 | 有効化 | 用途 |
|---|---|---|
| `NEXT_PUBLIC_RECORDING_DIAGNOSTIC` | env | PC Safari 切り分け |
| `RecordingPipelineDiagnosticPanel` | 上記 | 録音 DL・ログ |
| `BisectFeatureFlagPanel` | `NEXT_PUBLIC_ENABLE_BISECT_PANEL=true` | SE3 perf 切り分け |
| `AudioVolumeTunePanel` | `?audioTune=1` | 音量調整 |
| `perf-debug.ts` | `NEXT_PUBLIC_PERF_DEBUG` | 遷移計測 |
| `[audio-vol]` ログ | APP_ENV=dev で自動 | iOS 音量確認 |
| `ios-sfx-network-proof.ts` | iOS SFX debug | 音源ルーティング確認 |

### 残すべきもの（インフラ）

| 項目 | 理由 |
|---|---|
| `recording-pipeline-log.ts` | 失敗時 console.error は常時有用 |
| `layout-feature-flags.ts` / `perf-feature-flags.ts` | 実機 bisect の資産 |
| `audio-volume-tuning.ts` + `audio-volume-platform.ts` | 本番の音量ソース |
| `behavior-log.ts` | 分析基盤 |
| `scripts/generate-*-manifest.mjs` | ビルド前アセット整合 |

### 不要ログ（整理候補）

- `[RecordingPipeline]` — 診断 OFF でも **console.info は常に出る**（`recording-pipeline-log.ts` L26-29）。本番でうるさい可能性
- `[audio-vol]` — dev のみ想定だが量が多い
- `[perf]` / `[perf:render]` — フラグ ON 時のみ

### TODO / @deprecated

- 明示的 `TODO` コメントは少ない
- `@deprecated` re-export が `lib/entrance/` に多数 — 互換用。新規コードは非 deprecated を使用

---

## 付録 B: 技術的負債

### ★★★★★（β 公開前必須）

| 負債 | 影響 | 期限 |
|---|---|---|
| PC Safari Whisper 空 | デスクトップ Safari ユーザーが使えない | β 前 |
| 未コミット Safari 作業の散在 | 引き継ぎ不能 | 即 |
| 本番での録音パイプラインログ漏れ | UX/情報漏えい懸念 | β 前 |

### ★★★★☆（App Store 前必須）

| 負債 | 影響 | 期限 |
|---|---|---|
| `bar-audio-engine.ts` モノリス (~2000行) | 変更が怖い・バグ温床 | App Store 前 |
| PWA + iOS 録音の複雑な分岐 | 回帰リスク | App Store 前 |
| `/lab` ルートの公開状態 | プロンプト漏えい | App Store 前 |
| README / 運用ドキュメント不足 | オンボーディング | App Store 前 |

### ★★★☆☆（放置可能だが要注意）

| 負債 | 影響 |
|---|---|
| 大量の tuning ファイル | 変更箇所の発見コスト |
| deprecated re-export 層 | import 混乱 |
| Create Next App 由来の未使用資産 | ビルドサイズ微増 |
| ゲスト localStorage ドラフト | データ喪失は仕様だが説明必要 |

**放置可能**: lamp glow editor 群（本番非表示）、perf bisect フラグ、admin 分析 SQL

**β 公開前必須**: PC Safari 録音、診断コード整理、1 日制限の本番検証

**App Store 前必須**: 音声エンジン分割、lab 閉鎖、プライバシー/マイク説明、オフライン挙動

---

## 付録 C: dev ブランチ Git Bisect 用コミット分類

使い方例:

```bash
git bisect start
git bisect bad 9f5361f      # 問題あり側
git bisect good 876dce6     # 正常側（要カテゴリに合わせて変更）
# カテゴリ絞り込み後、その範囲の good/bad を指定
```

凡例: `9f5361f` = 短 hash（新しい順）

### 音量調整（audio-vol / BGM / SE / mix）

```
9f5361f  Improve SE layout, master dialogue, and iOS bar audio.
84cfcfc  Add iOS attenuated SE files for all bar sounds and remove audio test UI.
12eed7d  Add iOS SE file routing, audio diagnostics, and layout fixes.
dedf479  Keep iOS jazz entry on Web Audio gain after fade completes.
a942003  Try Web Audio Gain for iOS jazz counter entry fade only.
09ab20a  Fix iOS jazz entry sounding silent then bursting at fade end.
9cf9355  Fix iOS jazz entry fade using sync play and interval volume steps.
4728fd1  Fix jazz BGM fade-in on iOS counter entry.
3493908  Fix bar audio engine dying after interrupt or dispose.
54065e1  Fix iOS SE volume not applying and switch to absolute mobile mix.
3577852  Silence perf logs on dev so only audio-vol diagnostics show.
eb84609  Fix iOS platform audio mix detection and add dev diagnostics.
55d2aee  Tune iOS mobile audio scales from SE3 listening pass.
fc2b3b0  Add iOS mobile audio volume scale layer without changing PC mix.
e0a3281  Apply tuned BGM/SE mix levels from device audio panel.
9540b66  Add runtime BGM/SE volume tuning tools for dev verification.
77b4b31  Lighten iOS audio unlock and route BGM without Web Audio on iOS.
ca0fb85  Fix iOS Safari audio and centralize volume tuning params.
8f1fa55  Stop BGM and SFX completely during recording instead of ducking.
e9f2761  Fix iOS recording retry and keep BGM playing during capture.
590c027  Fix iOS PWA generation hang and recording BGM spike.
8cb0416  Fix iOS PWA recording so Whisper receives real audio.
961b160  Fix production mood-select crash and polish PWA/audio for release testing.
1edb54e  add immersive entrance flow with mood selection, bar audio, and memories API.
```

### レスポンシブ / レイアウト / compact height

```
9f5361f  Improve SE layout, master dialogue, and iOS bar audio.  # master dialogue 帯
ed411c0  Fix mobile Safari horizontal letterboxing on counter scenes.
9a0569a  Add PC app shell, shelf loading copy, and iOS Safari height fix.
1b93307  Add layout feature flags for SE3 Safari bisection.
85843f2  Fix build by reading layout shell flag on the server only.
9fe7ba0  Add perf bisect flags and unified dev Bisect panel.
d2af990  Add PWA recording diagnostics and fix entrance layout on scroll lock.
c71cacd  Raise Loading Gate message contrast for mobile readability.
12eed7d  Add iOS SE file routing, audio diagnostics, and layout fixes.
f9c2d9f  Fix long mood-exit pause on iOS before drink reveal.
6eb6ad3  Polish entrance and mood-select UI with lamp glow tooling.
```

※ compact height（699px）は **9f5361f 付近の未コミット/直近作業** — bisect 時は working tree も確認。

### Safari / 録音 / MediaRecorder / Whisper

```
b2b3c58  Fix recording pipeline reliability and audio timing for iOS PWA.
0371958  Fix empty MediaRecorder blobs on iOS PWA after stop.
8cb0416  Fix iOS PWA recording so Whisper receives real audio.
e9f2761  Fix iOS recording retry and keep BGM playing during capture.
590c027  Fix iOS PWA generation hang and recording BGM spike.
81cf145  Add record-counter scene and harden iPhone recording on dev HTTPS.
8f1fa55  Stop BGM and SFX completely during recording instead of ducking.
ca0fb85  Fix iOS Safari audio and centralize volume tuning params.
77b4b31  Lighten iOS audio unlock and route BGM without Web Audio on iOS.
ed411c0  Fix mobile Safari horizontal letterboxing on counter scenes.
9a0569a  Add PC app shell, shelf loading copy, and iOS Safari height fix.
a456b1e  Enable recording diagnostic panel by default on local and dev.
f127d84  Show pipeline phase timings in the recording diagnostic panel.
e14f378  Always show recording diagnostic pill on non-production builds.
f493bd8  Fix recording diagnostic panel visibility on iOS PWA.
d2af990  Add PWA recording diagnostics and fix entrance layout on scroll lock.
aba485a  Add PWA support and three-tier environment configuration.
```

※ **PC Safari Whisper 空** — 上記 iOS 修正では解決せず。手元未コミット（`recorder-platform.ts` 案3 等）を bisect 対象外として別途検証。

### UI / UX / 演出フロー

```
9f5361f  Improve SE layout, master dialogue, and iOS bar audio.
6867864  Polish night flow UX: guest diary preview, recording tutorial, and alley complete.
f062dc2  Migrate to β drink catalog with fixed master comments and diary detail fixes.
f88c840  Add β recording limit flow, past-bottle toast, and copy punctuation.
0023d42  Add feedback, daily diary limits, and legal info panel for β.
538edfc  Polish home entry screen typography, UI, and alley atmosphere.
0aa94f9  Expand guest diary flow, settings menu UX, and shelf polish.
03e9c5e  Add diary shelf UX, settings menu, and disable diagnostic overlay.
2a42e55  Refactor post-recording flow and polish entrance/diary UX.
fc0bd0c  Add diary paper shelf UI, loading gate lights, and faster home entry.
9ef701d  Replace post-recording exit with soft blackout and master farewell.
cf58d2f  Defer diary writing until after reveal and open saved entries in-app.
6eb6ad3  Polish entrance and mood-select UI with lamp glow tooling.
26bcc64  Revert mood option button hover visuals to previous behavior.
6593e53  Replace PWA and favicon assets with new app icons.
b0e7b75  Polish Loading Gate copy and block audio before user gesture.
0b8cd68  Add phased Loading Gate before EntranceFlow mounts.
```

### パフォーマンス（bisect 時は volume/UI と混同注意）

```
9b2bac8  Add URL perf flags for SE3 heat bisect (lamp, motion, audio).
d4a2063  Skip minMs wait when counter entry preload finishes early.
61704a9  Add perf instrumentation for counter reveal transition timing.
ebe6c37  Serialize counter entry preload to ease SE3 memory pressure.
f1dfd92  Add perf debug instrumentation and fix dashboard view SQL
7cfe4c3  Reduce GPU load during recording and post-record blackout.
d130fd1  Preload counter scene images before reveal with bounded wait.
```

---

## 未コミット作業（2026-07-06 時点）

```
 M app/api/transcribe/route.ts          # mime ログ強化
 M hooks/use-recorder.ts               # debug blob capture
 M lib/recorder/recorder-platform.ts   # isSafariMediaRecorder / 案3
 M lib/night/validate-recording-for-transcribe.ts
 M lib/transcribe/transcribe-audio.ts
 M components/entrance/recording-pipeline-diagnostic-panel.tsx
 M app/globals.css
?? lib/recorder/debug-recording-blob.ts
```

次の担当者は **まずこの差分を確認・コミットするか破棄するか決定** すること。
