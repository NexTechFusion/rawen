import {
    RetrievalQAChain,
    RefineDocumentsChain,
    LLMChain,
} from "langchain/chains";
import { MemoryVectorStore } from "langchain/vectorstores/memory";
import { PromptTemplate } from "@langchain/core/prompts";
import { callChatChain } from "./basic-llm-chat";
import { getLLMModel } from "../../../shared/utils/llm-model";
import { RemoteEmbeddings } from "./remove-embeddings";
import { checkTextsMatchLLM } from "./llm-matcher";
import { EMBEDDING_MODEL } from "../../../config";

export async function callRag(
    query: string,
    llmSetting: any,
    docs: any,
    callback: Function,
    abortController: AbortController,
    strict = false,
    history: any[] = []
) {
    try {
        const model = getLLMModel(llmSetting);
        const embeddings = new RemoteEmbeddings({
            model: EMBEDDING_MODEL,
        });
        const response = await langchainRag(query, model, docs, embeddings, callback, abortController, strict, history);
        return response;
    } catch (err) {
        throw err;
    }
}

const ANSWER_INDICATOR = "QA:";
const DEFAULT_REFINE_PROMPT_TMPL = `The original question is as follows: {question}
We have provided an existing answer: {existing_answer}
We have the opportunity to refine the existing answer
(only if needed) with some more context below.
------------
{context}
------------
Given the new context, refine the existing answer to better answer the question or 
If the context isn't useful for refining the answer, return the existing answer but with a prefix "${ANSWER_INDICATOR}: \n\n".
`;

const refinePrompt = new PromptTemplate({
    inputVariables: ["question", "existing_answer", "context"],
    template: DEFAULT_REFINE_PROMPT_TMPL,
});

// Response to the human by looking at the **Context**.
const questionPromptTemplateString = `You are a helpful assistant designed to provide accurate and concise answers to the Human's request. Follow these guidelines when responding:

- Direct Answer: If you can answer the question without the Context, prefix your response with "${ANSWER_INDICATOR}" and format it in markdown.
- Contextual Answer: If the question requires information from the Context, incorporate the relevant details into your response.

Human request:
{question}

Context:
{context}

Response:
`;

const questionPromptTemplateStringRag = `Context: 
{context}.

Given the context information and no prior knowledge, answer the question: {question}`;

const documentPrompt = new PromptTemplate({
    inputVariables: ["page_content", "id", "date", "file_path"],
    template: `
    {page_content}

    (id : {id}, date : {date}, path : {file_path})
        `,
});

async function langchainRag(
    query: string,
    model: any,
    docs: any[],
    embeddings: any,
    callback: Function,
    abortController: AbortController,
    strict = false,
    history: any[] = []
) {

    if (docs?.length === 0) {
        const result = await callChatChain(query, model, callback, abortController, history);
        return { output_text: result, sourceDocuments: [] };
    }

    const firstDoc = docs[0];
    const firstDocContent = firstDoc.pageContent;
    const metaData = firstDoc.metadata;
    const hasMatch = await checkTextsMatchLLM(`ID:${metaData?.id}. ${firstDocContent}. `, query, model);

    if (!hasMatch) {
        const result = await callChatChain(query, model, callback, abortController, history);
        return { output_text: result, sourceDocuments: [] };
    }

    const vectorStore = await MemoryVectorStore.fromDocuments(docs, embeddings);
    const vectorStoreRetriever = vectorStore.asRetriever();
    const verbose = false;
    const questionPrompt = new PromptTemplate({
        inputVariables: ["context", "question"],
        template: strict ? questionPromptTemplateStringRag : questionPromptTemplateString,
    });

    const combineDocumentsChain = new RefineDocumentsChain({
        llmChain: new LLMChain({ prompt: questionPrompt, llm: model, verbose }),
        refineLLMChain: new LLMChain({ prompt: refinePrompt, llm: model, verbose }),
        verbose,
        documentPrompt,
    });

    const chain = new RetrievalQAChain({
        combineDocumentsChain,
        retriever: vectorStoreRetriever,
        verbose,
        returnSourceDocuments: true,
    });

    let hasAnswer = false;
    let stopCallback = false;
    let collectedText = "";
    let sourceDocuments: any[] = [];
    let callbackCount = 0;
    try {
        let response = await chain.call({ query, signal: abortController.signal }, {
            callbacks: [
                {
                    handleRetrieverEnd(documents: any) {
                        sourceDocuments.push(...documents);
                    },
                    handleLLMStart() {
                        if (hasAnswer) {
                            stopCallback = true;
                            if (abortController) {
                                abortController.abort("Answer found");
                                if (callbackCount === 0) { // if the answer chunks are bigi
                                    callback(collectedText.replace(ANSWER_INDICATOR, ""));
                                }
                            }
                            return;
                        }
                        hasAnswer = docs.length === 1;
                        collectedText = "";
                    },
                    handleLLMNewToken(token: string) {
                        if (stopCallback) {
                            return;
                        }

                        if (hasAnswer) {
                            collectedText += token;
                            callback(token.replace(ANSWER_INDICATOR, ""));
                            callbackCount++;
                        } else {
                            collectedText += token;
                            if (collectedText.includes(ANSWER_INDICATOR)) {
                                collectedText = collectedText.replace(ANSWER_INDICATOR, "");
                                hasAnswer = true;
                            }
                        }
                    },
                },
            ],
        });
        response.output_text = response.output_text.replace(ANSWER_INDICATOR, "");
        return response;
    } catch (err) {
        if (abortController.signal.reason === "Answer found") {
            return {
                output_text: collectedText,
                sourceDocuments
            };
        }
        throw err;
    }
}
