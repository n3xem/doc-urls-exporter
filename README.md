# URL抽出ツール

このツールは、指定されたWebページからURLを抽出し、ルートパス以下のリンクを収集します。

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
- 同じドメイン内のURLのみ抽出
- ルートパス（「/」で始まるパス）のリンクのみをフィルタリング
- URLからフラグメント識別子（#以降の部分）を削除
- 重複するURLを除外
- 結果をシンプルに1行1URLで出力 
# doc-urls-exporter
