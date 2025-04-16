import * as https from "https";
import * as http from "http";
import { URL } from "url";
import * as cheerio from "cheerio";

interface UrlExtractorOptions {
  url: string;
  rootOnly: boolean;
}

class UrlExtractor {
  private readonly url: URL;
  private readonly rootOnly: boolean;

  constructor(options: UrlExtractorOptions) {
    this.url = new URL(options.url);
    this.rootOnly = options.rootOnly;
  }

  async extract(): Promise<string[]> {
    const htmlContent = await this.fetchUrl(this.url.href);
    const $ = cheerio.load(htmlContent);
    const links: string[] = [];
    const uniqueUrls = new Set<string>();

    $("a[href]").each((_, element) => {
      const href = $(element).attr("href");
      if (!href) return;

      try {
        // 絶対URLに変換
        const absoluteUrl = new URL(href, this.url.href);

        // 同じドメインのリンクのみ処理
        if (absoluteUrl.hostname !== this.url.hostname) return;

        // rootOnlyがtrueの場合、ルートパス以下のリンクのみ処理
        if (this.rootOnly && !absoluteUrl.pathname.startsWith("/")) return;

        // #以降を削除したURLを作成
        absoluteUrl.hash = "";
        const cleanUrl = absoluteUrl.href;

        // 重複を避けるため、Setに追加
        if (!uniqueUrls.has(cleanUrl)) {
          uniqueUrls.add(cleanUrl);
          links.push(cleanUrl);
        }
      } catch (error) {
        // URLの解析に失敗した場合はスキップ
        console.error(`無効なURL: ${href}`, error);
      }
    });

    return links;
  }

  private fetchUrl(url: string): Promise<string> {
    return new Promise((resolve, reject) => {
      const protocol = this.url.protocol === "https:" ? https : http;

      protocol
        .get(url, (response) => {
          if (response.statusCode !== 200) {
            reject(new Error(`HTTPステータスコード: ${response.statusCode}`));
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
}

async function main() {
  if (process.argv.length < 3) {
    console.error("使用方法: ts-node url-extractor.ts <URL>");
    process.exit(1);
  }

  const targetUrl = process.argv[2];

  try {
    const extractor = new UrlExtractor({
      url: targetUrl,
      rootOnly: true,
    });

    const links = await extractor.extract();

    // 結果を出力（ヘッダーとフッターを表示せず、URLのみを表示）
    links.forEach((link) => console.log(link));
  } catch (error) {
    console.error("エラーが発生しました:", error);
    process.exit(1);
  }
}

main();
