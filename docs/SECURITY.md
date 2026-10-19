# セキュリティ方針と残存リスク

最終監査: 2026-10-19

## 脅威モデル

ユーザー入力の受け口（フォーム / API route / 認証 / DB）を持たない静的生成サイト。
攻撃面は (1) URL のルートパラメータ、(2) 配信ヘッダー、(3) 依存関係、(4) ビルド時に読む
`content/**/*.mdx` の 4 つに限られる。

## 実装している防御

### ルートパラメータ

- `lib/i18n.ts` の `isLang()` でロケールを `'ar' | 'en'` に絞る。各 page / layout は
  キャストではなくこの絞り込みを通す。
- `lib/mdx.ts` の `isSafeSlug()` で slug を kebab-case のみ許可し、`..`・パス区切り・
  絶対パス・NUL バイトを fs 呼び出し前に落とす。`resolveMdxPath()` が
  `path.join` 後のパスが `content/<lang>` 直下であることを再確認する（二重防御）。
- `getMdxBySlug()` は未知の slug で例外ではなく `null` を返し、page 側が `notFound()` を呼ぶ。
  ファイルシステムのエラーがレスポンスに出ない。
- 両 page に `export const dynamicParams = false`。`generateStaticParams()` が返した組み合わせ
  以外は Next.js のルーティング層で 404 になり、アプリのコードに到達しない。

検証済み（`next start` に対する実リクエスト）:

| パス | 結果 |
| --- | --- |
| `/en/starting-again` | 200 |
| `/en/does-not-exist` | 404 |
| `/en/..%2F..%2Fpackage` | 404 |
| `/en/%2e%2e%2f%2e%2e%2fcontent%2far%2fstarting-again` | 404 |
| `/e.n/starting-again`（proxy の matcher を回避するドット入りロケール） | 404 |
| `/xx/starting-again` | 307 → `/ar/xx/...` → 404 |

### frontmatter

`validateFrontmatter()` が必須フィールドの型・`date` の形式・ファイル名と `slug` の一致を
ビルド時に検証する。`ogImage` はサイト相対パスのみ許可（OG/Twitter メタデータの参照先を
第三者ホストに向けられないようにする）。違反は明確なメッセージでビルドを失敗させる。

### 配信ヘッダー（`next.config.ts`）

CSP, HSTS（2年 + preload）, `X-Content-Type-Options`, `Referrer-Policy`,
`X-Frame-Options`, `Permissions-Policy`（未使用 API は全て拒否）,
`Cross-Origin-Opener-Policy: same-origin`。`poweredByHeader: false`。

## 受け入れたトレードオフ

### CSP の `script-src 'unsafe-inline'`

Next.js のハイドレーション用ブートストラップと GA4 スニペットがインラインスクリプトのため。
nonce 方式はリクエストごとに proxy で nonce を発行する必要があり、全ページが静的生成から
外れる。ユーザー由来の HTML を一切描画しないサイトである限りこの交換は許容する。
**フォームやコメントなどユーザー入力の描画を追加する場合は、nonce 方式へ移行すること。**

### `braces` の DoS 勧告（dev 依存のみ）

`eslint-config-next` → `@next/eslint-plugin-next` → `fast-glob` → `micromatch` → `braces`。
修正版が存在しない（全バージョンが対象）勧告で、`eslint-config-next@14` への降格以外の
解決策がない。lint 実行時に自分で書いた glob を処理するだけで、本番バンドルにも
ランタイムにも含まれないため据え置く。`npm audit --omit=dev` は 0 件。

## 依存関係

- `next` は 16.4.2 以上を維持する。16.2.9 には critical（RCE / キャッシュポイズニング /
  proxy バイパス）を含む多数の勧告があった。
- frontmatter の読み取りは `gray-matter` をやめ `js-yaml@4` に直接依存（`JSON_SCHEMA`、
  YAML の型強制とカスタムタグを無効化）。`gray-matter` が固定していた `js-yaml@3` 系の
  CPU 枯渇勧告（修正がバックポートされない）をツリーから除去するため。
- `postcss-selector-parser` は `overrides` で `^7.1.6` に固定（`@tailwindcss/typography`
  が脆弱な 6.0.10 を pin している）。生成 CSS がバイト単位で同一であることを確認済み。

## 定期的に実行すること

```bash
npm audit --omit=dev   # 本番ツリー: 0 件を維持
npm audit              # dev も含む: 上記 braces のみ許容
npx tsc --noEmit && npm run lint && npm run build
```
