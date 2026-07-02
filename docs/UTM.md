# UTM 運用ルール — 思想プラットフォーム

## なぜ UTM が必要か

Instagram / TikTok のアプリ内ブラウザはリファラーを壊す。UTM を付けないと GA4 上で流入が「Direct」に化けて、どの SNS から来たか判別不能になる。

---

## テンプレート

### プロフィール（bio）——常時の入口

SNS プロフィールリンクに貼る。プラットフォームごとに `utm_source` を変える。`utm_medium=bio` で固定。

```
# Instagram
https://yourdomain.com/ar?utm_source=instagram&utm_medium=bio

# TikTok
https://yourdomain.com/ar?utm_source=tiktok&utm_medium=bio
```

### ストーリー——記事ごとの送客

1記事 = 1リンク。`utm_campaign` に記事 slug を入れる。

```
# Instagram ストーリー → 記事「welcome」
https://yourdomain.com/ar/welcome?utm_source=instagram&utm_medium=story&utm_campaign=welcome

# TikTok ストーリー → 記事「welcome」
https://yourdomain.com/ar/welcome?utm_source=tiktok&utm_medium=story&utm_campaign=welcome
```

---

## パラメータ一覧

| パラメータ | 値 | 意味 |
|---|---|---|
| `utm_source` | `instagram` / `tiktok` | 流入元 SNS |
| `utm_medium` | `bio` / `story` | 掲載場所 |
| `utm_campaign` | 記事 slug（例：`welcome`） | ストーリー時のみ設定 |

---

## 使い分けの意図

- **bio vs story を分ける**：プロフィール経由の常連と、記事プッシュで来た新規読者を GA4 上で比較できる。
- **campaign に slug**：どの記事がストーリーからの流入を最も呼んでいるか追跡できる。

---

## 運用チェックリスト

新しい記事を投稿する前に：
1. `utm_campaign` に今回の記事 slug をセット
2. Instagram / TikTok のストーリーリンクに貼り付け
3. bio リンクは変更不要（常に `/ar` 向け）
4. GA4 → レポート → 集客 → トラフィック獲得で確認（反映に最大48h）
