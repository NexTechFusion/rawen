import { ChatPromptTemplate, MessagesPlaceholder } from "@langchain/core/prompts";
import { StringOutputParser } from "@langchain/core/output_parsers";
import { HumanMessage, AIMessage } from "@langchain/core/messages";

export class BaseVision {
    private llm: any;

    constructor(llm: any) {
        this.llm = llm;
    }

    removeImageTag(content) {
        return content.replace(/<img[^>]*>/g, "");
    }

    async call(prompt: string, options: {
        abortController: AbortController
        history?: (HumanMessage | AIMessage)[],
    }, callback?: (prompt: string) => void): Promise<string> {
        return new Promise(async (resolve, reject) => {
            try {

                const latestMessage = options.history?.filter(o => o instanceof AIMessage).pop();
                const isLatestMessageImg = (latestMessage?.content as string)?.includes("<img");

                const promptTmpl = ChatPromptTemplate.fromMessages([
                    new MessagesPlaceholder("chat_history"),
                    new MessagesPlaceholder("input")
                ]);

                let input = new HumanMessage({
                    content: prompt
                });

                if (isLatestMessageImg) {
                    // get the image src path from <img element in the content string like : this is my live <img src="https://example.com/image.jpg">
                    let imageSrc: any = (latestMessage?.content as string).match(/<img[^>]+src="([^">]+)"/)
                    if (imageSrc.length >= 1) {
                        imageSrc = imageSrc[1];
                    }

                    input = new HumanMessage({
                        content: [
                            {
                                type: "text",
                                text: prompt
                            },
                            {
                                type: "image_url",
                                image_url: { url: imageSrc }
                            }
                        ]
                    });
                }

                let history = options.history?.slice(options?.history?.findIndex(o => o.content == undefined) + 1);
                const chatHistory = history?.filter(o => o.content != undefined).map(o => {
                    o.content = this.removeImageTag(o.content);
                    return o;
                });

                const chain = promptTmpl.pipe(this.llm).pipe(new StringOutputParser());
                const stream = await chain.stream({
                    signal: options.abortController,
                    chat_history: chatHistory ?? [],
                    input
                });

                let result = "";
                for await (const chunk of stream) {
                    result += chunk;
                    if (callback) {
                        callback(chunk);
                    }
                }

                resolve(result);
            } catch (err) {
                reject(err);
            }
        });
    }
}