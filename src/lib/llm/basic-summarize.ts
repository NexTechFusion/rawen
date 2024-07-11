import {
    loadSummarizationChain,
} from "langchain/chains";
import { PromptTemplate } from "@langchain/core/prompts";
import { CharacterTextSplitter } from "langchain/text_splitter";
import { BaseLanguageModel } from "@langchain/core/language_models/base";
import { getLLMModel } from "../../../shared/utils/llm-model";

class BaseSummarize {
    private llm: BaseLanguageModel;

    constructor(llm: BaseLanguageModel) {
        this.llm = llm;
    }

    async call(content: string, prompt?: string): Promise<string> {
        return new Promise(async (resolve, reject) => {
            try {
                const textSplitter = new CharacterTextSplitter({ chunkSize: 800, separator: "\n", chunkOverlap: 50 });
                const docs = await textSplitter.createDocuments([content]);

                const addition = prompt ? `and take ${prompt} into account` : ``;
                const template = `Write a concise summary ${addition} of the following:

                "{text}"
                
                CONCISE SUMMARY:`

                const chain = loadSummarizationChain(this.llm, {
                    type: "refine", refinePrompt: new PromptTemplate({
                        template,
                        inputVariables: ['text'],
                    })
                });
                const result = await chain.invoke({
                    input_documents: docs
                });

                resolve(result.output_text?.trimStart() ?? "Nothing to summarize");
            } catch (err) {
                reject(err);
            }
        });
    }
}

export async function callSummarize(
    content: string,
    prompt: string,
    llmSetting: any
) {
    try {
        const model = getLLMModel(llmSetting);
        const summarizerO = new BaseSummarize(model);
        return await summarizerO.call(content, prompt);
    } catch (err) {
        throw err;
    }
}