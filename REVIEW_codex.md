# レビュー結果

Codex (gpt-5.4) によるレビュー。git history のシークレット混入チェックはサンドボックス制約のためスキップし、Claude側で別途 `git log --all -p` によるスキャンを実施済み（`.env*` は一度もコミットされていないことを確認）。

集計: 高 0件 / 中 1件 / 低 2件

## セキュリティ

### NEXT_PUBLIC_ prefix misuse
該当なし。`process.env` の使用箇所は `NEXT_PUBLIC_SITE_URL` と `NEXT_PUBLIC_GA_ID` のみで、`.env.local` にある変数名も `NEXT_PUBLIC_GA_ID` のみでした。いずれも公開前提の値で、秘密情報を `NEXT_PUBLIC_` で露出している実装は確認できませんでした。

### Git history check
Codexの実行環境ではスキップ（Claude側で別途実施、問題なし）。

### MDX rendering / dangerouslySetInnerHTML
該当なし。`dangerouslySetInnerHTML` は見当たらず、MDX は `app/[lang]/[slug]/page.tsx:103` で `MDXRemote` を使って repo 内の固定 MDX コンテンツを描画していました。ユーザー入力起点ではないため、この脅威モデルでは直ちに問題とは判断しませんでした。

### External links with `target="_blank"`
該当なし。確認できた `target="_blank"` の外部リンクはすべて `rel="noopener noreferrer"` を伴っていました。
対象: `components/Footer.tsx:20`, `components/Footer.tsx:28`, `components/ShareBar.tsx:68`, `components/ShareBar.tsx:77`, `components/ShareBar.tsx:86`

### [重要度: 中] Security headers are entirely absent
- **ファイル:行**: next.config.ts:3
- **理由**: `next.config.ts` が空のままで、CSP、HSTS、`X-Content-Type-Options`、`Referrer-Policy` の付与がありません。静的サイトで攻撃面は小さいものの、配信境界での基本ヘッダーが未設定だと、将来コンテンツや外部スクリプトが増えた際に防御が弱いままになります。特に GA4 を使っているため、CSP では `googletagmanager.com` と `google-analytics.com` を許可する前提を明示して設計すべきです。
- **推奨対応**: `next.config.ts` の `headers()` で最低限のセキュリティヘッダーを定義してください。CSP は GA4 の通信先を考慮して組み立て、`HSTS`、`X-Content-Type-Options: nosniff`、`Referrer-Policy` も併せて追加してください。

## コード品質

### Unused imports/variables, dead code
該当なし。目視した範囲では未使用 import / 未使用変数の残骸は見当たりませんでした。

### [重要度: 低] Repeated type-erasing casts hide invalid route/frontmatter data
- **ファイル:行**: lib/mdx.ts:34, app/[lang]/page.tsx:19, app/[lang]/page.tsx:25, app/[lang]/[slug]/page.tsx:33, app/[lang]/[slug]/page.tsx:42, app/[lang]/[slug]/page.tsx:83, app/[lang]/[slug]/page.tsx:88
- **理由**: `data as Frontmatter` と複数の `lang as Lang` / `lang as 'ar' | 'en'` は、実行時に値が不正でも TypeScript 上だけ正しいことにしてしまいます。このサイトは静的コンテンツ中心なので深刻度は低いですが、MDX frontmatter の欠落や想定外の locale が入った際に、型で守れているように見えて実際には守れていない状態です。
- **推奨対応**: frontmatter は実行時バリデーションを入れ、`lang` は route params 受領時に `'ar' | 'en'` へ絞り込む関数を作って以後の `as` キャストを不要にしてください。

### [重要度: 低] `SITE_URL` logic is duplicated with inconsistent fallbacks
- **ファイル:行**: app/robots.ts:3, app/sitemap.ts:5, app/[lang]/layout.tsx:48, app/[lang]/[slug]/page.tsx:43, app/[lang]/[slug]/page.tsx:85
- **理由**: `NEXT_PUBLIC_SITE_URL` の参照と fallback が複数箇所に散らばっており、`https://example.com` と `https://thelongthought.com` が混在しています。環境変数未設定時に robots / sitemap / metadata / canonical の参照先が食い違うため、SSG サイトでは SEO 設定の不整合に直結します。
- **推奨対応**: site URL 解決を単一の共通関数または定数に寄せ、fallback も 1 か所に統一してください。公開環境で必須なら、未設定時にビルドエラーにする方が安全です。

### `any` types / `console.log`
該当なし。`any` と `console.log` は確認できませんでした。`as const` は使われていますが、問題は上記の型消去キャストに限定されます。

### RTL / CSS logical properties
該当なし。確認したスタイルでは `padding-inline-start`、`inset-inline-start`、`border-inline-start`、`margin-inline-start` などの論理プロパティが使われており、`margin-left` / `padding-left` などの物理プロパティへの後退は見当たりませんでした。

### Unnecessary `use client`
該当なし。`use client` は `components/ScrollDepth.tsx:1` と `components/ShareBar.tsx:1` のみで、前者は `window` と GA イベント送信、後者は `navigator.clipboard` と state を使っており、どちらもクライアント化の理由は明確でした。
