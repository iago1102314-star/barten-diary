# PROJECT_CONTEXT — AI / 新規開発者向けコンテキスト

バーテン日記を初めて開く AI・開発者向けの短い設計書。詳細は `PROJECT_HANDOVER.md`。

---

## 一言で

深夜のバーで **話すだけ** で夜の記録が残る PWA。AI は作文しない。**整えるだけ**。

---

## 設計思想

### 体験

1. **没入優先** — Loading Gate → 路地 → 扉 → カウンター。UI は最小、演出は `*-tuning.ts` で調整
2. **話すことの軽さ** — 録音ボタン一つ。書く画面は後から（日記紙）
3. **静けさ** — 派手なフィードバック・ポップアップを避ける。エラーも世界観を壊さない文言
4. **忠実度 > 文学性** — AI 出力はユーザー発話の整形のみ。締め・教訓・創作は NG

### 技術

1. **チューニング値の集中** — 数値は `lib/entrance/*-tuning.ts`、`lib/recorder/`、`lib/ai/prompts/constants.ts`
2. **プラットフォーム分岐は明示** — `recorder-platform.ts`、`audio-volume-platform.ts`。暗黙の UA 分岐をコンポーネントに書かない
3. **フロー中枢は hook** — 夜の一連は `use-night-session.ts`。個別コンポーネントに状態を散らさない
4. **音声はシングルトン** — `barAudioEngine`。録音中は完全 mute（duck しない）
5. **最小 diff** — 関係ないリファクタ禁止。特に `bar-audio-engine.ts`

### 環境

| env | 用途 |
|---|---|
| local | `npm run dev`、LAN + cloudflared で iPhone 録音 |
| dev | Vercel dev プロジェクト、PWA 固定 URL |
| production | 本番 |

`NEXT_PUBLIC_APP_ENV` で識別。診断系は **明示 env のみ** ON。

---

## 命名規則

### ファイル

| パターン | 例 | 意味 |
|---|---|---|
| `*-tuning.ts` | `mood-select-layout-tuning.ts` | 調整用定数のみ |
| `*-scene.tsx` | `record-counter-scene.tsx` | フル画面演出 |
| `use-*.ts` | `use-night-session.ts` | クライアント hook |
| `run-*-pipeline.ts` | `run-night-generation-pipeline.ts` | 手続きオーケストレーション |

### コンポーネント

- `Master*` — マスター吹き出し・セリフ
- `*Panel` — オーバーレイ UI（録音、チュートリアル）
- `*Screen` — 画面単位（memories, alley）
- `Diary*` — 日記紙関連

### 定数

- `SCREAMING_SNAKE` — エクスポート定数
- 秒: `*Sec`、ミリ秒: `*Ms`、px: `*Px`、%: `*Percent`

### 酒

- `DrinkId` — kebab-case: `old-fashioned`, `koshu`, `bellini`, `hot-cocoa`
- カテゴリ ID: `heavy`, `clear`, `glow`（感情ラベルと対応）

---

## 世界観

### 用語（コード・UI で統一）

| ユーザー向け | コード内の概念 |
|---|---|
| 夜の記録 | `diary`（本文） |
| 記録棚 / メモ棚 | `memories` / shelf |
| マスター | `master`（固定コメントは `masterComments`） |
| 感情選択 | mood / `DrinkCategory` |
| 本日の1杯 | `pick-drink` で決まる酒 |

### トーン

- 敬体・静か・短い文。感嘆符や絵文字は使わない
- マスターは **観察者**。ユーザーの気持ちを決めつけない
- エラー: 「できませんでした」「もう一度」— 技術用語を表に出さない

### 視覚

- ダーク基調、琥珀・クリームのアクセント（`master-dialogue-typography.ts`）
- フォント: タイトル `font-app-title`、本文 `font-serif-jp`
- カウンターは **スマホ縦画面** を正とする。PC は 430px 枠

---

## レスポンシブ方針

### ブレークポイント

```
≤699px   compact height プロファイル（SE3 等）
≥768px   PC app shell（中央 430px、左右レターボックス）
```

### 高さの取り方

- `visualViewport.height` 優先（`readViewportHeightPx()`）
- iOS Safari **ブラウザ**のみ: `--app-visual-height`（`ios-safari-visual-height.ts`）
- PWA standalone では 100dvh 系をそのまま使用

### compact height で変わるもの（現状）

- 感情選択: `optionBlockBottomPx`, `footerBottomPx`, ボタン gap
- 過去のボトルから: `headerTopPercent`, icon scale

**まだ未対応**: 録音シーンの酒タイトル/ノート（Phase 2）

### 画像

- 背景は `object-cover` + `panX/YPercent` + `zoom`（`record-counter-scene-tuning.ts`）
- 横長 viewport では letterbox ではなく **トリミングで埋める**

---

## アニメーション方針

### ライブラリ使い分け

| 用途 | 手段 |
|---|---|
| 入退店・カメラ | GSAP / CSS transition |
| UI フェード | Motion（framer-motion 系） |
| ランプ呼吸 | CSS `@keyframes` + `lamp-glow-breathe.ts` |
| タイプライター | JS interval（`master-dialogue`） |

### タイミング

- 気分選択は `MOOD_SELECT_ENTRANCE_DURATION_SCALE = 4` で全体スケール
- **音と演出の同期** — SE `onended` + `grassFallbackDurationSec`（iOS 向け fallback）
- rapid tap skip: `ENTRANCE_RAPID_TAP_SKIP_MAX_GAP_MS = 420`

### パフォーマンス（SE3）

- counter entry preload は **直列**（メモリ圧）
- `?perfLamp=off` 等の bisect フラグあり（`perf-feature-flags.ts`）
- 録音中・post-record blackout は GPU 負荷削減済み

---

## 主要フロー（コード上の地図）

```
app/page.tsx
  → Loading Gate
  → EntranceFlow (components/entrance/entrance-flow.tsx)
       → useNightSession()
            → useRecorder()        録音
            → runNightGenerationPipeline()  Whisper + 生成
            → runNightSave()       Supabase
       → barAudioEngine            BGM/SE
```

フェーズ（`NightPhase`）: `idle` → `recording` → `checking` → `ending` → `revealed`

---

## 禁止事項

### 絶対 NG

1. AI プロンプトで「創作・要約・締めの追加」を許可する
2. 録音時間上限（3 分）や最小 2 秒を **同意なく** 変更
3. PC Safari 向けに **ffmpeg 変換** をクライアント/サーバーに入れる（未承認）
4. iOS 録音成功経路（`isAppleMediaRecorder` の MIME / mic retry）を壊す
5. 本番で診断パネル・lab ルートを無防備に公開
6. `git push --force` to main

### 要相談

- `bar-audio-engine.ts` の構造変更
- 酒カタログの追加（アセット manifest 再生成が必要）
- 日記文字数上限の変更（プロンプト・UI・品質チェック全体に影響）

### やらない方がよい

- README だけを更新して手順を書く（実装と乖離する）— 本ファイル群を更新
- Chrome 向け最適化を Safari にそのまま適用（MediaRecorder 挙動が違う）
- マスター吹き出しの帯を「2 行分の高さを先に確保」— **上端固定・下に伸びる** 方式を維持

---

## プラットフォーム早見表

| | Chrome PC | Safari PC | SE3 Safari |
|---|---|---|---|
| 録音形式 | WebM | mp4 | mp4 |
| timeslice | 250ms | 1000ms | 1000ms |
| Whisper | OK | **NG（調査中）** | OK |
| BGM mix | PC テーブル | PC テーブル | iOS テーブル |
| SE | 通常 mp4 | 通常 mp4 | ios/ attenuated |

---

## よく触る env

```bash
NEXT_PUBLIC_APP_ENV=local
NEXT_PUBLIC_RECORDING_DIAGNOSTIC=true   # 録音調査
NEXT_PUBLIC_ENABLE_BISECT_PANEL=true    # 左下 bisect
# ?audioTune=1                          # 音量パネル
# NEXT_PUBLIC_PERF_DEBUG=true           # 遷移計測
```

---

## コマンド

```bash
npm run dev              # localhost
npm run dev:lan          # 0.0.0.0
npm run dev:tunnel       # cloudflared（iPhone 録音用）
npm run check:generation # readiness API 確認
```

---

## 関連ドキュメント

- `PROJECT_HANDOVER.md` — 機能一覧・チューニング値・負債・bisect
- `.env.example` — 環境変数・PWA URL 手順
- `AGENTS.md` — Next.js 16 注意

---

*行数目安: ~250。変更時は実装と一緒に更新すること。*
