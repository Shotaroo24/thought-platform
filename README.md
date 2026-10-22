# the long thought

Shotaro のバイリンガル（アラビア語 / 英語）長文記事サイト。
本番: https://thelongthought.com （`/` はアラブ圏からのアクセスなら `/ar`。それ以外はブラウザの言語設定で振り分け、アラビア語・英語のどちらでもなければ `/en`、言語設定がなければ `/ar`）

Next.js 16（App Router）＋ TypeScript ＋ Tailwind CSS v4。DB・認証・バックエンドなしの完全静的サイトで、`main` への push で Vercel が自動デプロイする。

## セットアップ

```bash
npm install
npm run dev
```

http://localhost:3000 を開く。

環境変数は `.env.local`（git 管理外）に置く。

| 変数 | 用途 |
| --- | --- |
| `NEXT_PUBLIC_GA_ID` | GA4 の測定 ID。未設定なら GA を読み込まない |
| `NEXT_PUBLIC_SITE_URL` | canonical・OG・sitemap の基準 URL。未設定時は `https://thelongthought.com` |

## 記事を書く

`content/ar/<slug>.mdx` と `content/en/<slug>.mdx` を同じ slug で1組置いて push する。

```yaml
---
title: "……"            # 必須
date: "2026-10-19"     # 必須。YYYY-MM-DD
slug: "starting-again" # 必須。ファイル名と一致（kebab-case）
description: "……"      # 必須。メタ情報に使う
pinned: true           # 任意。トップの「Start here」に固定
ogImage: "/og/xxx.png" # 任意。サイト相対パスのみ
---
```

- アラビア語はサウジ口語で書く（`AGENTS.md`）。
- 一覧の抜粋は本文の最初の段落から自動で作られる。
- frontmatter の誤りはビルドエラーになる。

## コマンド

```bash
npm run dev           # 開発サーバー
npm run build         # 本番ビルド
npm run lint          # ESLint
npx tsc --noEmit      # 型チェック
npm test              # ユニットテスト（Node 組み込みの node:test）
npm audit --omit=dev  # 本番依存の脆弱性チェック（0件を維持）
```

## 構成

| パス | 内容 |
| --- | --- |
| `app/[lang]/` | 一覧（`page.tsx`）・記事（`[slug]/page.tsx`）・共通レイアウト |
| `app/globals.css` | デザイントークンと全スタイル |
| `components/` | Header / ArticleCard / GhostNode / ShareBar / InstagramDmCTA / NextArticleCTA / Footer / ScrollDepth |
| `content/{ar,en}/` | 記事（MDX） |
| `lib/` | `i18n.ts`（ロケール）・`mdx.ts`（読み込みと検証）・`site.ts`（サイトURL・SNSアカウント） |
| `proxy.ts` | ロケールなしのパスを、アクセス元の国（Vercel の `x-vercel-ip-country`）とブラウザの言語設定（`lib/i18n.ts` の `chooseLang`）で `/ar` か `/en` へリダイレクト |
| `docs/` | `SECURITY.md`（セキュリティ方針）・`UTM.md`（SNS リンクの UTM 運用） |

SNS アカウント（フッター・DM ボタンのリンク先）は `lib/site.ts` の `SOCIAL_LINKS` で一元管理している。
