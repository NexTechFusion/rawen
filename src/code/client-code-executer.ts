import { addStreamListner, interactionStateChange, pushLogsStreamOutput, pushStreamOutput, submitPromptFn } from '@/modules/interaction/interaction';
import { appState, changeState } from '@/state/app.state';
import { InteractionState } from '../lib/interaction-state';
import { getConvoId as getConvoIder, randomUUID } from '../lib/utils';
import { TrainerApi } from '@/api/train.api';
import { ActionState, execCommands } from '../lib/command-execute';
import { addInteractionLog, addInteractionPrompt, updateLastInteractionPrompt, isStreamActive } from '../lib/interaction-manager';
import { startAudioRecordingfn, stopAudioRecordingFn } from '@/lib/audio-recording';
import { collapseApp as collapseAppE, ElectronState, openExternalWindowElectron } from '@/electron/electron-ipc-handlers';
import { DefaultLlmSetting } from '../../shared/models/settings.model';
import { abortController as abortControllerX } from '@/api/llm.api';
import { getPublicPath } from '../../shared/utils/resources';
import { VectorApi } from '@/api/vector.api';
import { ImageVectorApi } from '@/api/image-vector.api';
import { findTemplateMatch, labelImage as labelImager } from '@/lib/label-image';
import { CodeFunctions } from './client-code-functions';
import { LinkExtractor } from '@/lib/link-extractor';

export interface ExecuteCodeOptions {
    [key: string]: any;
    input?: string;
    sources?: any[];
    actionState: ActionState;
}

export async function executeCode(code: string, { actionState, input, sources, ...rest } = {} as ExecuteCodeOptions) {
    Object.keys(rest ?? {}).forEach(l => window[l] = rest[l]); // destructuring 
    CodeFunctions.setCodeParams(input, sources, actionState);

    const publicPath = getPublicPath() + "/";

    function navigate(url) {
        onNavigate(url);
    };

    const abortControllers = () => {
        return abortControllerX;
    }

    function openAiSettings() {
        return appState.keyValues.settings.find(o => o.name === DefaultLlmSetting.OPENAI)?.values;
    }

    function getConvoId() {
        return getConvoIder();
    }

    async function waitForInput() {
        return new Promise(async (resolve) => {
            if (!window.location.href.includes("interact")) {
                const randomGUID = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
                const url = `/interact?convoId=${randomGUID}`;
                navigate(url);
                await new Promise(r => setTimeout(r, 50));
            }

            if (isStreamActive()) {
                endStream();
            }

            InteractionState.waitForNextInput((text) => {
                resolve(text);
            });
        });
    }

    function addStreamListener(callback) {
        addStreamListner(callback);
    }

    async function startAudioRecording(autoStop = true, callback) {
        return new Promise((resolve) => {
            startAudioRecordingfn((buffer) => {
                if (callback) {
                    callback(buffer);
                }

                if (autoStop) {
                    stopAudioRecording();
                }

                resolve(JSON.stringify(buffer));
            });
        });
    }

    function stopAudioRecording() {
        stopAudioRecordingFn();
    }

    async function addPrompt(content, isEncoded = false) {
        if (isEncoded) {
            content = decodeURI(content);
        }

        addInteractionPrompt(getConvoId(), content);
    }

    function updatePrompt(content, isEncoded = false) {
        if (isEncoded) {
            content = decodeURI(content);
        }
        updateLastInteractionPrompt(getConvoId(), content);
    }

    function addResult(content, options = null, isEncoded = false) {
        if (isEncoded) {
            content = decodeURI(content);
        }
        CodeFunctions.addResult(content, options);
    }

    function pushLog(log, isEncoded = false) {
        pushLogsStreamOutput(log);

        if (isEncoded) {
            log = decodeURI(log);
        }

        addInteractionLog(log)
    }

    function pushContentStream(token) {
        CodeFunctions.pushContentToStream(token);
    }

    function replaceContentStream(token, replaceText) {
        pushStreamOutput(token, replaceText);
    }

    async function startStream() {
        await CodeFunctions.startStream();
    }

    function endStream() {
        CodeFunctions.endStream();
    }

    function isStreaming() {
        return isStreamActive();
    }

    function setInput(text) {
        interactionStateChange({ prompt: text });
    }

    function submitPrompt(text) {
        submitPromptFn(text);
    }

    function newInteraction() {
        const convoId = randomUUID();
        navigate("#interact?convoId=" + convoId);
        return convoId;
    }

    function getInteractionState() {
        const history = appState.llmResults.find(o => o.convoId === getConvoId())?.results ?? [];
        return {
            conversationId: getConvoId(),
            history,
            ...InteractionState.getState()
        };
    }

    function updateInteractionState(state) {
        InteractionState.updateState(state);
    }

    async function closeApp() {
        await CodeFunctions.execElectron(`
            closeApp();
        `)
    }

    async function restoreApp() {
        await CodeFunctions.execElectron(`
            restoreApp();
        `)
    }

    async function openApp(options: { url, width, height, convoId, tasks, prompt, focus, bringToFront, preload, disableAutoResize, keepInteraction, onCursor, closeOnBlur }) {
        return new Promise(async (resolve) => {
            const convoIdbefore = getConvoId();

            await CodeFunctions.execElectron(`
             openApp(${JSON.stringify(options)});
           `);

            if (options?.keepInteraction) {
                return resolve(null);
            } else {
                const checkInterval = setInterval(async () => {
                    const convo = getConvoId();

                    if (convo != convoIdbefore) {
                        clearInterval(checkInterval);
                        resolve(convo);
                    }
                }, 10);
            }
        });
    }


    async function getAllDocs() {
        const docs = await VectorApi.getStoreInfo();
        return docs;
    }

    async function getDocsBySimilarity(text: string, topK = 2, options = {}, table = "global") {
        const docs = await VectorApi.call(text, {
            keyValues: appState.keyValues,
            storeId: table
        }, topK, options);
        return docs;
    }

    async function getDocsByUrl(url) {
        const docs = await LinkExtractor.extractContent(url);
        return docs;
    }

    async function ingestText(text, metaData = {}, table = "global") {
        await TrainerApi.trainInput(text, { ...metaData }, table);
    }

    async function ingestImages(images, metaData = {}, table = "images") {
        if (typeof images === "string") {
            images = JSON.parse(images);
        }

        const paths = await ImageVectorApi.ingestImages(images.map(o => ({
            image: o,
            ...metaData
        })),
            {
                keyValues: appState?.keyValues,
                storeId: table
            }
        );

        return paths;
    }

    async function getImagesBySimilarity(text: string, topK = 2, options = {}, table = "images") {
        const docs = await ImageVectorApi.call(text, {
            keyValues: appState.keyValues,
            storeId: table
        }, topK, options);

        return docs;
    }

    async function ingestFile(filePath, metaData = {}) {
        const fs = require('fs').promises;
        const { Blob } = require('buffer');
        const buffer = await fs.readFile(filePath);

        const blob = new Blob([buffer], { type: 'application/octet-stream' });
        const file = new File([blob], "filename", { type: blob.type });

        await TrainerApi.trainFiles([file], metaData);
    }

    async function addInteractionContent(text, title) {
        const blob = new Blob([text], { type: "text/plain;charset=utf-8" });
        const fileType = title.includes(".") ? title.split(".").pop() : "txt";
        const file = new File([blob], title + "." + fileType, { type: "text/plain;charset=utf-8" });

        const docs = await TrainerApi.trainFiles([file], {
            storeId: getConvoId()
        });

        interactionStateChange({
            files: [file],
            docs
        })
    }

    async function getKeyValues() {
        return appState.keyValues?.settings;
    }

    async function getCommands() {
        return appState.commands?.map(o => ({ id: o.id, name: o.name, description: o.description, isTool: o.isTool }));
    }

    async function execCommand(prompt, cmdId, convoId = getConvoId()) {
        const cmds = appState.commands.filter(o => cmdId.includes(o.id) || cmdId.includes(o.name));
        return await execCommands(prompt, cmds, convoId, true);
    }

    async function sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    async function shellOpenExternal(url) {
        await CodeFunctions.execElectron(`
            shellOpenExternal(\`${url}\`);
        `)
    }

    async function shellOpen(url) {
        await CodeFunctions.execElectron(`
            shellOpen(\`${url}\`);
        `)
    }

    async function playAudio(url, fromArrayBuffer = false) {
        return new Promise((resolve) => {
            if (fromArrayBuffer) {
                const parsed = JSON.parse(url);
                const buffer = Buffer.from(parsed);
                const blob = new Blob([buffer], { type: "audio/mp3" });
                const speechFile = window.URL.createObjectURL(blob);
                url = speechFile;
            }

            const audio = new Audio(url);
            audio.play();
            audio.onended = () => {
                resolve(true);
            }
        });
    }

    function addIframeResponse(htmlTemplate, options = null) {
        return new Promise((resolve) => {
            const iframe = document.createElement('iframe');
            iframe.style.border = 'none';
            iframe.style.width = options?.width ?? '100%';
            iframe.style.height = options?.height ?? '100%';
            iframe.src = htmlTemplate;
            iframe.id = randomUUID();

            addInteractionContent(getConvoId(), iframe.outerHTML);

            const checkAttachInterval = setInterval(() => {
                const iframeElement = document.getElementById(iframe.id);
                if (iframeElement) {
                    clearInterval(checkAttachInterval);
                    resolve(iframeElement);
                }
            }, 1000);
        });
    }

    async function markAreas(areas) {
        await CodeFunctions.execElectron(`
            markAreas(${JSON.stringify(areas)});
        `)
    }

    async function clearAreas() {
        await CodeFunctions.execElectron(`
            clearAreas();
        `)
    }

    async function waitUntilMarked() {
        const res = await CodeFunctions.waitUntilMarked();
        res.fileBuffer = JSON.stringify(res.fileBuffer);
        return res;
    }

    async function openExternalWindow(contentOrPath, options) {
        if (typeof options === "string") {
            options = JSON.parse(options);
        }

        openExternalWindowElectron(contentOrPath, options);
    }

    function encodeContent(content: any): string {
        if (!content) {
            return "";
        }

        if (typeof content !== "string") {
            content = JSON.stringify(content);
        }

        return encodeURIComponent(content);
    }

    async function displayContentAtPositions(contents, options) {
        if (typeof contents !== "string") {
            contents = encodeContent(contents);
        }

        if (options && typeof options !== "string") {
            options = encodeContent(options);
        }


        await CodeFunctions.execElectron(`
            displayContentAtPositions(\`${contents}\`, \`${options}\`);
        `)
    }

    async function clearContentAtPositions() {
        await CodeFunctions.execElectron(`
        clearContentAtPositions();
        `)
    }

    async function displayCursorContent(content, encoded) {
        await CodeFunctions.execElectron(`
            displayCursorWindow(\`${content}\`, ${encoded});
        `)
    }

    async function hideCursorContent() {
        await CodeFunctions.execElectron(`
            hideCursorWindow();
        `)
    }

    function updateState(state) {
        changeState({ ...appState, ...state });
    }

    async function labelImage(base64) {
        const response = await labelImager(base64);

        return { imgBufferStr: JSON.stringify(response.imgBuffer), fields: response.fields }
    }

    async function determineMatches(imagePath, templatePath, threshold = 0.8) {
        const response = await findTemplateMatch(imagePath, templatePath, threshold);
        return response;
    }

    async function callRag(prompt, llmSetting, docs) {
        if (typeof llmSetting === "string") {
            llmSetting = JSON.parse(llmSetting);
        }

        if (typeof docs === "string") {
            docs = JSON.parse(docs);
        }

        const result = await CodeFunctions.callRag(prompt, llmSetting, docs);
        return result;
    }

    // return : Promise<{ labels: string[], scores: number[] }> text: string, labels: string[], model?: string 
    function classifyText(text, labels, model) {
        if (typeof labels === "string") {
            labels = JSON.parse(labels);
        }

        return CodeFunctions.classifyText(text, labels, model);
    }


    async function getTaskFlows() {
        return appState.taskFlows ?? [];
    }

    async function addNewTaskFlow(taskFlow) {
        await CodeFunctions.addNewTaskFlow(taskFlow);
    }

    function startTaskRecording() {
        return CodeFunctions.startTaskRecording();
    }

    function stopTaskRecording() {
        CodeFunctions.stopTaskRecording();
    }

    function taskMarkListener() {
        return CodeFunctions.taskMarkListener();
    }

    function taskExplainListener() {
        return CodeFunctions.taskExplainListener();
    }

    function collapseApp(collapse, width = undefined, height = undefined) {
        collapseAppE(collapse, width, height);
    }

    function isAppCollapsed() {
        return ElectronState.isAppCollapsed;
    }

    async function toggleAppCollapse() {
        const isAppCollapsed = !ElectronState.isAppCollapsed;
        if (!isAppCollapsed) {
            await CodeFunctions.execElectron(`focusApp()`);
        }

        collapseApp(isAppCollapsed);
        
        setTimeout(async () => {
            if (!isAppCollapsed) {
                interactionStateChange({ focus: true });
            }
        }, 250);
    }

    //purce prevention TODO : resolve this
    const asyncCode = `
        (async () => {
            ${toggleAppCollapse}
            ${isAppCollapsed}
            ${collapseApp}
            ${taskExplainListener} 
            ${taskMarkListener}
            ${getTaskFlows}
            ${addNewTaskFlow}
            ${startTaskRecording}
            ${stopTaskRecording}
            ${classifyText}
            ${callRag}
            ${injectScript}
            ${abortControllers}
            ${pushLog}
            ${pushContentStream}
            ${replaceContentStream}
            ${openAiSettings}
            ${waitForInput}
            ${addStreamListener}
            ${openExternalWindow}
            ${setInput}
            ${submitPrompt}
            ${startAudioRecording}
            ${stopAudioRecording}
            ${updatePrompt}
            ${addPrompt}
            ${addResult}
            ${sleep}
            ${openApp}
            ${closeApp}
            ${restoreApp}
            ${execCommand}
            ${getKeyValues}
            ${getCommands}
            ${addIframeResponse}
            ${ingestText}
            ${ingestImages}
            ${getImagesBySimilarity}
            ${ingestFile}
            ${waitUntilMarked}
            ${getInteractionState}
            ${playAudio}
            ${endStream}
            ${isStreaming}
            ${startStream}
            ${getAllDocs}
            ${getDocsBySimilarity}
            ${getDocsByUrl}
            ${markAreas}
            ${clearAreas}
            ${displayContentAtPositions}
            ${clearContentAtPositions}
            ${labelImage}
            ${determineMatches}
         ${addInteractionContent}
         ${displayCursorContent}
         ${hideCursorContent}
         ${navigate}
         ${updateInteractionState}
         ${updateState}
         ${newInteraction}
         ${shellOpenExternal}
         ${shellOpen}

        ${code}
        })()
    `;

    try {
        // const replacedStr = replaceServerSideCode(asyncCode);
        const result = await eval(asyncCode);
        return result;
    } catch (err) {
        console.log(err);
        throw new Error(err);
    }
}

export function injectScript(script) {
    return require(script);
}

export function abortControllers() {
    return abortControllerX;
}

export function openAiSettings() {
    return appState.keyValues.settings.find(o => o.name === DefaultLlmSetting.OPENAI)?.values;
}

// TODO move to a better place
export function onNavigate(url: string) {
    nav(url);
}
let nav: any;
export function addNavigateListener(func: any) {
    nav = func;
}

