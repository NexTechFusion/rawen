import { appState } from "@/state/app.state";
import { CommandModel } from "../../shared/models/command.model";
import { DocumentData } from "../../shared/models/app-state.model";
import { ActionModel, DefaultLLMActionModel, DynamicActionType, JsScripActionModel, LmmRequestActionModel, VectorRequestActionModel } from "../../shared/models/action.model";
import { executeCode } from "../code/code-executer.util";
import { LlmApi, collectedOutput } from "@/api/llm.api";
import { VectorApi } from "@/api/vector.api";
import { getConvoId, hasFiles } from "./utils";
import { addInteractionPrompt, addInteractionContentR, isStreamActive, assignStreamedToLastInteraction, getInteractionHistory, addInteractionLog } from "./interaction-manager";
import { setCanClick } from "@/electron/electron-ipc-handlers";
import { CodeFunctions } from "@/code/code-functions.util";
import { getPublicPath } from "../../shared/utils/resources";
import path from "node:path";
export enum DefaultCommandIds {
    LOCAL_CHAT = "localChat",
}
export interface ActionState {
    docs?: DocumentData[];
    initalInput?: string;
    command?: CommandModel;
    defaultLLMendpointId?: string;
}

async function getIntentCommandByPrompt(prompt: string) {
    // const taskCmds = appState.commands.filter(o => o.isTool).map(o => o.description);
    // const promises = taskCmds.map((checksum) => getSimilarity(prompt, checksum));
    // const results = await Promise.all(promises);
    // console.log(results);
    const commands = appState.commands.filter(o => o.isTool);

    if (commands.length == 0) {
        return undefined;
    }

    const names = commands.map(o => o.name);
    const classify = await CodeFunctions.classifyText(prompt, names);

    if (!classify) {
        return undefined;
    }

    console.log(classify);
    const bestScore = classify.scores[0];
    const bestScoreName = classify.labels[0];

    if (bestScore > 0.7) {
        const command = commands.find(o => o.name == bestScoreName);
        return command;
    }

    return undefined;
}

export async function execCommands(initalPrompt: string, commands: CommandModel[], convoId?: boolean | string, killStream = false, initalDocs?: DocumentData[]) {
    let prompt = initalPrompt;

    try {
        // if stream is active assign it to last interaction
        if (killStream && isStreamActive()) {
            assignStreamedToLastInteraction(getConvoId());
        }

        // add strart streaming
        if (convoId !== false) {
            addInteractionPrompt(getConvoId(), initalPrompt, []);
        }

        // if no commands are given try to get the best command
        if (!commands || commands.length == 0) {
            const bestCommand = await getIntentCommandByPrompt(initalPrompt); // get the best command
            if (bestCommand) {
                commands = [bestCommand];
            } else {
                commands = getDefaultCommands();
            }
        }


        for (let command of commands) {
            try {
                const result = await execActions(prompt, initalPrompt, command, initalDocs);

                if (result) {
                    prompt = result;
                }
            }
            catch (error) {
                if (error.message == "AbortError") {
                    addInteractionContentR(collectedOutput);
                    return;
                }

                addInteractionLog(error);

                if (convoId !== false) {
                    addInteractionContentR(`Error during command execution.`);
                }
            }
        }

        if (isStreamActive()) {
            CodeFunctions.endStream();
        }

    } catch (error) {
        console.error(error);
    } finally {
        setCanClick(true);
        return prompt;
    }
}

export async function execActions(prompt: string, initalPrompt: string, command: CommandModel, initalDocs?: DocumentData[]) {
    const actions = command.actions;
    let actionsState = { docs: initalDocs ?? [], initalInput: initalPrompt, command } as ActionState;
    let input = prompt ? prompt.replace(command.name, "") : undefined;

    for (let action of actions) {
        const newInput = await execAction(input, action, actionsState);

        if (newInput) {
            input = newInput;
        }
    }

    return input;
}

export async function execAction(input: any, action: ActionModel, actionState: ActionState) {

    // if action is a code execution
    if (typeof action.type != "string") {
        const dynamicAction = action.type as DynamicActionType;
        const code = dynamicAction.code;

        let params = { input, actionState };
        if (typeof input === "object") {
            params = { ...input, actionState };
        }

        // editables fields to params
        for (let field of dynamicAction.editableFields) {
            const value = field.value ?? field.defaultValue;

            switch (field.type) {
                case "Checkbox":
                    params[field.id] = value == "true" || value == true || value == "1";
                    break;
                case "Number":
                    params[field.id] = Number(value);
                    break;
                default:
                    params[field.id] = value;
                    break;
            }
        }

        return await executeCode(code, params);
    }

    switch (action.type) {
        case "LmmRequest":
            return await callLlm(input, action, actionState);
        case "LmmSummarize":
            return await callSummarize(input, action, actionState);
        case "LmmDocsRequest":
            return await callRagLlm(input, action, actionState);
        case "VectorRequest":
            await callVector(input, action as VectorRequestActionModel, actionState);
        case "DefaultLLM":
            return setDefaultLlm(input, action as VectorRequestActionModel, actionState);
        case "CallJsScript":
            return await callJsScript(input, action as JsScripActionModel, actionState);;
    }
}

function setDefaultLlm(input: string, action: DefaultLLMActionModel, actionsState: ActionState) {
    actionsState.defaultLLMendpointId = action.endpointId;
    return input;
}

function getDefaultCommands() {
    return [appState.commands.find(a => a.id === DefaultCommandIds.LOCAL_CHAT)];
}

function formatPrompt(prompt: string, action: LmmRequestActionModel, state: ActionState) {
    const promptFormat = (action as LmmRequestActionModel).promptFormat;

    if (promptFormat && promptFormat != "") {
        prompt = promptFormat.replace(`{{INPUT}}`, prompt)

        let index = 1;
        for (let store of state.docs) {
            prompt = prompt.replace(`{{SOURCE${index}}}`, JSON.stringify(store))
            index++;
        }
    }

    return prompt;
}

async function callRagLlm(input: string, action: LmmRequestActionModel, state: ActionState) {
    let prompt = input ?? "";
    prompt = formatPrompt(prompt, action, state);

    const history = getInteractionHistory(getConvoId());
    const llmSetting = appState.keyValues?.settings?.find(e => e.id === action.endpointId);

    if (!llmSetting) {
        throw new Error("No LLM setting found.");
    }

    let result = await LlmApi.reqRag(prompt, llmSetting, state.docs, hasFiles(), history);

    // setInteractionSources(getConvoId(), result.sourceDocuments);
    return result.output_text;
}

async function callLlm(input: string, action: LmmRequestActionModel, state: ActionState) {
    let prompt = input ?? "";
    prompt = formatPrompt(prompt, action, state);
    const history = getInteractionHistory(getConvoId());
    const llmSetting = appState.keyValues?.settings?.find(e => e.id === action.endpointId);

    if (!llmSetting) {
        throw new Error("No LLM setting found.");
    }

    const result = await LlmApi.call(prompt, llmSetting, history);

    return result;
}

async function callSummarize(input: string, action: LmmRequestActionModel, state: ActionState) {

    let prompt = input ?? "";
    prompt = formatPrompt(prompt, action, state);
    let content = prompt;

    if (content == prompt) {
        prompt = "";
    }

    const llmSetting = appState.keyValues?.settings?.find(e => e.id === action.endpointId);

    if (!llmSetting) {
        throw new Error("No LLM setting found.");
    }

    const result = await LlmApi.summarize(content, prompt, llmSetting);

    return result;
}

async function callVector(input: string, action: VectorRequestActionModel, actionstate: ActionState) {
    let prompt = input ?? "";
    prompt = formatPrompt(prompt, action, actionstate);

    try {
        let resultDocs: DocumentData[] = [];
        resultDocs = await VectorApi.call(prompt, {
            keyValues: appState.keyValues,
            llmSettingId: action.endpointId
        });
        actionstate.docs.push(...resultDocs);

        return resultDocs;
    } catch (error) {
        console.error(error);
        throw error;
    }
}

async function callJsScript(input: string, action: JsScripActionModel, actionstate: ActionState) {
    process.env.prompt = input;
    try {
        const currentDir = process.cwd();
        const fullPath = path.join(currentDir, getPublicPath(), 'scripts', action.name);
        const { main } = require(fullPath);

        if (main) {
            const result = await main(input, actionstate);
            return result ?? input;
        }

        return input;
    } catch (error) {
        console.error(error);
        throw error;
    }
}

