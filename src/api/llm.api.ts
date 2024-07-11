import { pushStreamOutput } from "@/modules/interaction/interaction";
import { DocumentData, KeyValueSetting } from "../../shared/models/app-state.model";
import { callRag } from "../lib/llm/basic-rag.call";
import { callChat } from "../lib/llm/basic-llm-chat";
import { callSummarize } from "../lib/llm/basic-summarize";
export let abortController = new AbortController();
export let collectedOutput = "";

export class LlmApi {
    static abortLLM() {
        abortController.abort();
    }

    static async call(prompt: string, llmSetting: KeyValueSetting, history: any[] = []) {
        abortController = new AbortController();
        collectedOutput = "";

        const res = await callChat(prompt, llmSetting, (token) => {
            collectedOutput += token;
            pushStreamOutput(token);
        }, abortController, history);

        return res;
    }

    static async reqRag(prompt: string, llmSetting: KeyValueSetting, docs: DocumentData[], contextFocuesed: boolean, history: any[] = []) {
        abortController = new AbortController();
        collectedOutput = "";
        const res = await callRag(prompt, llmSetting, docs, (token) => {
            collectedOutput += token;
            pushStreamOutput(token);
        }, abortController, contextFocuesed, history);

        return res;
    }

    static async summarize(content: string, prompt: string, llmSetting: KeyValueSetting) {
        abortController = new AbortController();
        const res = await callSummarize(content, prompt, llmSetting);
        pushStreamOutput(res);

        return res;
    }
}