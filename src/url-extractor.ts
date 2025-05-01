import * as https from "https";
import * as http from "http";
import { URL } from "url";
import * as cheerio from "cheerio";

interface UrlExtractorOptions {
  url: string;
  rootOnly: boolean;
  firstLevelOnly?: boolean;
}

class UrlExtractor {
  private readonly url: URL;
  private readonly rootOnly: boolean;
  private readonly firstLevelOnly: boolean;
  private readonly allUniqueUrls = new Set<string>();
  private visitedUrls = new Set<string>();
  private firstLevelUrls: string[] = [];

  constructor(options: UrlExtractorOptions) {
    this.url = new URL(options.url);
    this.rootOnly = options.rootOnly;
    this.firstLevelOnly = options.firstLevelOnly || false;
  }

  async extractAll(): Promise<string[]> {
    // 最初のURLからリンクを抽出
    console.error(`最初のURLからリンクを抽出中: ${this.url.href}`);
    this.firstLevelUrls = await this.extract(this.url.href);

    // firstLevelOnlyがtrueの場合は、最初のレベルのURLのみを返す
    if (this.firstLevelOnly) {
      return this.firstLevelUrls;
    }

    // 最初に見つかったURLそれぞれに対して処理
    console.error(
      `見つかった${this.firstLevelUrls.length}個のURLをさらに処理します...`
    );
    for (let i = 0; i < this.firstLevelUrls.length; i++) {
      const url = this.firstLevelUrls[i];
      if (!this.visitedUrls.has(url)) {
        console.error(
          `処理中 (${i + 1}/${this.firstLevelUrls.length}): ${url}`
        );
        this.visitedUrls.add(url);

        try {
          // 1秒待機して負荷を軽減
          await this.sleep(1000);
          await this.extract(url);
        } catch (error) {
          console.error(`URLの処理中にエラーが発生しました: ${url}`, error);
        }
      }
    }

    // 重複を除去して結果を返す
    return Array.from(this.allUniqueUrls);
  }

  private async extract(url: string): Promise<string[]> {
    const links: string[] = [];
    try {
      const htmlContent = await this.fetchUrl(url);
      const $ = cheerio.load(htmlContent);

      $("a[href]").each((_, element) => {
        const href = $(element).attr("href");
        if (!href) return;

        try {
          // 絶対URLに変換
          const absoluteUrl = new URL(href, url);

          // 同じドメインのリンクのみ処理
          if (absoluteUrl.hostname !== this.url.hostname) return;

          // rootOnlyがtrueの場合、ルートパス以下のリンクのみ処理
          if (this.rootOnly && !absoluteUrl.pathname.startsWith("/")) return;

          // #以降を削除したURLを作成
          absoluteUrl.hash = "";
          const cleanUrl = absoluteUrl.href;

          // グローバルな重複チェックと追加
          if (!this.allUniqueUrls.has(cleanUrl)) {
            this.allUniqueUrls.add(cleanUrl);
            links.push(cleanUrl);
          }
        } catch (error) {
          // URLの解析に失敗した場合はスキップ
          console.error(`無効なURL: ${href}`);
        }
      });
    } catch (error) {
      console.error(`ページ取得エラー: ${url}`);
    }

    return links;
  }

  private fetchUrl(url: string): Promise<string> {
    return new Promise((resolve, reject) => {
      const urlObj = new URL(url);
      const protocol = urlObj.protocol === "https:" ? https : http;

      protocol
        .get(url, (response) => {
          if (response.statusCode !== 200) {
            reject(new Error(`HTTPステータスコード: ${response.statusCode}`));
            return;
          }

          // リダイレクト処理
          if (
            response.statusCode >= 300 &&
            response.statusCode < 400 &&
            response.headers.location
          ) {
            try {
              const redirectUrl = new URL(response.headers.location, url).href;
              resolve(this.fetchUrl(redirectUrl));
            } catch (error) {
              reject(error);
            }
            return;
          }

          let data = "";
          response.on("data", (chunk) => {
            data += chunk;
          });

          response.on("end", () => {
            resolve(data);
          });
        })
        .on("error", (error) => {
          reject(error);
        });
    });
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

async function main() {
  if (process.argv.length < 3) {
    console.error(
      "使用方法: ts-node url-extractor.ts <URL> [--first-level-only]"
    );
    process.exit(1);
  }

  const targetUrl = process.argv[2];
  const firstLevelOnly = process.argv.includes("--first-level-only");

  try {
    const extractor = new UrlExtractor({
      url: targetUrl,
      rootOnly: true,
      firstLevelOnly: firstLevelOnly,
    });

    const links = await extractor.extractAll();

    // 結果を出力（URLのみを表示）
    links.forEach((link) => console.log(link));

    console.error(`\n合計: ${links.length}件のURLが見つかりました。`);
  } catch (error) {
    console.error("エラーが発生しました:", error);
    process.exit(1);
  }
}

main();
