import { CodeApi } from "@/api/code.api";
import { TrainerApi } from "@/api/train.api";

/**
 * Extracts content from a given link
 */
export class LinkExtractor {

    static async extractContent(url: string) {
        return new Promise(async (resolve, reject) => {
            try {

                const isYoutube = url.toLowerCase().includes("youtube");
                let files: File[] = [];
                let docs: any[] = [];

                async function extractWebsiteContent(url: string, maxDepth: number = 1): Promise<{ url: string, content: string }[]> {
                    const code = `return await extractWebsiteContent(\`${url}\`, ${maxDepth}, true);`;
                    const res = await CodeApi.exec(code, {});
                    return res;
                }

                async function extractYoutubeContent(url: string): Promise<any[]> {
                    const code = `return await extractYoutubeContent(\`${url}\`)`;
                    const res = await CodeApi.exec(code, {});
                    return res;
                }

                if (isYoutube) {
                    const response = await extractYoutubeContent(url);

                    if (!response) {
                        resolve([]);
                        return;
                    }

                    const text = response.map((item) => item.text).join("\n");
                    const file = new File([text], url + ".txt", { type: "text/plain" });

                    const resDocs = await TrainerApi.parseFiles([file], {});

                    files = [file];
                    docs = resDocs;

                } else {
                    const contents = await extractWebsiteContent(url);

                    if (!contents) {
                        resolve([]);
                        return;
                    }

                    const file = new File([contents[0].content], url + ".txt", { type: "text/plain" });
                    const resDocs = await TrainerApi.parseFiles([file], {});

                    files = [file];
                    docs = resDocs;

                }

                resolve(docs);
            } catch (err) {
                reject(err);
            }
        });
    }

}