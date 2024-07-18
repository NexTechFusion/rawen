import { Service } from "typedi";
import { img2Text } from "../../../shared/utils/tesseract";
import { clusterWords, } from "../../utils/general.utls";
import { classifyText as zclassifyText, classifyImage as zclassifyImage } from "../../../scripts/transformer-wrapper";
import { extractDataFromWebsite } from "../../../scripts/website-extractor";
import { YoutubeTranscript } from "../../../scripts/youtube-transcript";

@Service()
export class CodeExecService {

    public async exec(code: string, { actionState, input, sources, ...rest }) {

        async function sleep(ms) {
            return new Promise(resolve => setTimeout(resolve, ms));
        }

        async function extractTextFromImage(image, langs = "eng", parse = true) {

            if (image === null || image === undefined || image === "" || image === "undefined") {
                return undefined;
            }

            if (typeof image === "string") {
                image = Buffer.from(JSON.parse(image));
            }
            const result = await img2Text(image, langs);

            if (parse) {

                const words = result.data.words.map(o => ({
                    bbox: o.bbox,
                    text: o.text,
                    fontSize: o.font_size
                }));

                return {
                    result: JSON.stringify({
                        text: result.data.text,
                        words: clusterWords(words)
                    })
                }
            }

            return result;
        }

        async function classifyText(text, labels, model) {

            if (typeof labels === "string") {
                labels = JSON.parse(labels);
            }

            const respose = zclassifyText(text, labels, model);
            return respose;
        }

        async function classifyImage(text, labels, model) {

            if (typeof labels === "string") {
                labels = JSON.parse(labels);
            }

            const respose = zclassifyImage(text, labels, model);
            return respose;
        }

        async function extractWebsiteContent(input) {
            const res = await extractDataFromWebsite(input);
            return res;
        }

        async function extractYoutubeContent(input) {
            const res = await YoutubeTranscript.fetchTranscript(input, {
                lang: "en"
            });
            return res;
        }

        const asyncCode = `
        (async () => {
            ${code}
        })()
        `;

        try {
            const result = await eval(asyncCode);
            return result ?? "";
        } catch (err) {
            console.error(err);
        }
    }
}