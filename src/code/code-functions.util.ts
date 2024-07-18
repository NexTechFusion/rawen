import { LlmApi } from "@/api/llm.api";
import EasySpeech from "@/lib/easy-speech";
import { ipcRenderer } from "electron";
import { KeyValueSetting } from "../../shared/models/app-state.model";
import { CodeApi } from "@/api/code.api";
import { addInteractionContentR, addNewInteractionIfNotExists, assignStreamedToLastInteraction, startStreamer } from "@/lib/interaction-manager";
import { getConvoId, saveStateElectron } from "@/lib/utils";
import { interactionStateChange, pushStreamOutput } from "@/modules/interaction/interaction";
import { collapseApp } from "@/electron/electron-ipc-handlers";
import { appState, changeState } from "@/state/app.state";
import { MimicStore } from "@/modules/task/taskflow.model";
import { ElectronIpcEvent } from "../../shared/models/electron-ipc-events";

export class CodeFunctions {

    static input: any;
    static sources: any;
    static actionState: any;

    static setCodeParams(input: any, sources: any, actionState: any) {
        CodeFunctions.input = input;
        CodeFunctions.sources = sources;
        CodeFunctions.actionState = actionState;
    }

    static async execElectron(code) {
        return new Promise(async (resolve, reject) => {
            try {
                const result = await ipcRenderer.invoke(ElectronIpcEvent.ELECTRON_CODE_EXEC, code);
                resolve(result);
            } catch (err) {
                reject(err);
            }
        });
    }

    static async execNode(code) {
        return new Promise(async (resolve, reject) => {
            try {
                const res = await CodeApi.exec(code, {
                    input: CodeFunctions.input,
                    sources: CodeFunctions.sources,
                    actionState: CodeFunctions.actionState
                });
                resolve(res);
            } catch (err) {
                console.log(err);
                reject(err);
            }
        });
    }

    static async waitUntilMarked(): Promise<any> {
        const result: any = await CodeFunctions.execElectron(`
                return defineArea();
        `);
        result.fileBuffer = Buffer.from(JSON.parse(result.fileBuffer))
        return result;
    }

    static async callRag(prompt: string, llmSetting: KeyValueSetting, docs: any) {
        const result = await LlmApi.reqRag(prompt, llmSetting, docs, true);
        return result;
    }

    static async classifyText(text: string, labels: string[], model?: string): Promise<{ labels: string[], scores: number[] }> {
        return await CodeFunctions.execNode(`
            return classifyText("${text}", ${JSON.stringify(labels)}, "${model}");
        `) as any
    }

    static async classifyImage(img: string, labels: string[], model?: string): Promise<{ labels: string[], scores: number[] }> {
        return await CodeFunctions.execNode(`
            return classifyImage("${img}", ${JSON.stringify(labels)}, "${model}");
        `) as any
    }

    static async extractTextFromImage(img: Buffer, langs: string = "eng"): Promise<{ text: string, words: any[] }> {
        const res = await CodeFunctions.execNode(`
            return await extractTextFromImage('${JSON.stringify(img)}', '${langs}');
        `);

        if (!res) return null;

        return JSON.parse((res as any)?.result); //TODO lol
    }

    static addResult(content: string, options = null) {
        addInteractionContentR(content, getConvoId(), options);
    }

    static pushContentToStream(content: string) {
        addNewInteractionIfNotExists(getConvoId());
        pushStreamOutput(content);
    }

    static async startStream() {
        startStreamer(getConvoId());
        await new Promise(r => setTimeout(r, 50));
    }

    static endStream() {
        assignStreamedToLastInteraction(getConvoId());
    }

    static async speak(text: string) {
        const voice = EasySpeech.voices()[6];
        await EasySpeech.speak({
            text,
            voice,
            pitch: 0.1,
            rate: 1.9,
            volume: 0.8
        });
    }

    static startTaskRecording() {
        return new Promise((resolve) => {
            collapseApp(true, 400, 65, null, "RIGHT");
            interactionStateChange({ isTrackRecording: true });
            addTaskListener(() => {
                stopTaskRecordingListener();
                resolve(null);
            });
        });
    }

    static async addNewTaskFlow(taskFlow: MimicStore) {
        const currentFlows = appState.taskFlows ?? [];
        currentFlows.push(taskFlow);
        changeState({ ...appState, taskFlows: currentFlows });
        await new Promise(r => setTimeout(r, 100));
        saveStateElectron();
    }

    static stopTaskRecording() {
        collapseApp(false);
        interactionStateChange({ isTrackRecording: false });
        pushTaskEnd();
    }

    static taskMarkListener() {
        return new Promise((resolve) => {
            addMarkListener(() => {
                stopMarkListener();
                resolve(null);
            });
        });
    }

    static taskExplainListener() {
        return new Promise((resolve) => {
            addTaskSubmitExplainListener((text) => {
                stopTaskSubmitExplainListener();
                resolve(text);
            });
        });
    }
}

let taskRecordingListener;
export function pushTaskEnd() {
    if (taskRecordingListener) {
        taskRecordingListener();
    }
}
export function addTaskListener(func: () => void) {
    taskRecordingListener = func;
}

export function stopTaskRecordingListener() {
    taskRecordingListener = null;
}


let markListener;
export function pushTaskMark() {
    if (markListener) {
        markListener();
    }
}
export function addMarkListener(func: () => void) {
    markListener = func;
}

export function stopMarkListener() {
    markListener = null;
}

let taskSubmitExplainListener;
export function pushTaskExplain(text: string) {
    if (taskSubmitExplainListener) {
        taskSubmitExplainListener(text);
    }
}
export function addTaskSubmitExplainListener(func: (text: string) => void) {
    taskSubmitExplainListener = func;
}

export function stopTaskSubmitExplainListener() {
    taskSubmitExplainListener = null;
}