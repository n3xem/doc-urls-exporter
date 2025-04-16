# doc-urls-exporter

このツールは、指定されたWebページからURLを抽出し、そのページと最初に見つかったリンク先のページからもリンクを収集します。

## インストール

```bash
npm install
```

## 使用方法

```bash
# TypeScriptから直接実行
npm start https://example.com

# またはビルド後に実行
npm run build
node dist/url-extractor.js https://example.com
```

## 機能

- 指定されたURLからすべてのリンク（a要素のhref属性）を抽出
- 最初に見つかったリンク先のページからも再帰的にリンクを抽出（深さ1レベルまで）
- 同じドメイン内のURLのみ抽出
- ルートパス（「/」で始まるパス）のリンクのみをフィルタリング
- URLからフラグメント識別子（#以降の部分）を削除
- 重複するURLを除外
- 結果をシンプルに1行1URLで出力
- サーバーに負荷をかけないよう、1秒間隔でアクセス 
