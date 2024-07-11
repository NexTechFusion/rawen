import { getLLMModel } from "../../../shared/utils/llm-model";
import { KeyValueSetting } from "../../../shared/models/app-state.model";
import { BaseVision } from "./basic-llm-vision-chat";

export async function callChat(
    prompt: string,
    llmSetting: KeyValueSetting,
    callback: Function,
    abortController: AbortController,
    history: string[]
) {
    try {
        const model = getLLMModel(llmSetting);
        await callChatChain(prompt, model, callback, abortController, history);
    } catch (err) {
        throw err;
    }
}

export async function callChatChain(query: string, llm, callback, abortController, history) {
    try {
        const llmChat = new BaseVision(llm);
        const res = await llmChat.call(query, {
            abortController,
            history
        }, callback);

        return res;
    } catch (err) {
        throw err;
    }
} 