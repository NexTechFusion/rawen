import { DefaultLlmSetting } from "./settings.model";
import { CommandModel } from "./command.model";
import { ShortCutModel } from "./shortcut.model";
import { MimicStore } from "@/modules/task/taskflow.model";

export type LmmResultType = "prompt" | "response" | "info";
export type SourcesType = "File" | "Website";

export interface DocumentData {
    pageContent: string;
    metadata: DocumentMetaData;
}

export interface DocumentMetaData {
    id: string;
    date: string;
}

export interface LlmHistoryModel {
    convoId: string;
    results: Array<LlmResultModel>;
}
export interface LlmResultModel {
    id: string;
    header?: string;
    content?: string;
    date: Date;
    sources?: DocumentData[];
    logs?: string;
    confirmElements?: InlineElementConfirmation[];
    commands?: string[];
    isRetry?: boolean;
}

export interface InlineElementConfirmation {
    message: string;
    buttons: Array<{ text: string; classes: ""; id: string }>;
}
export interface VectorEndpointModel {
    id: string;
    url: string;
    body?: string;
}

export interface LllmEndpointModel {
    id: string;
    url: string;
    body?: string;
}
export interface LlMEndpointModel {
    url: string;
    body?: string;
}

export interface ExternalApiSources {
    sourceEndpoints: VectorEndpointModel[];
    inferenceEndpoints: LllmEndpointModel[];
}
export interface KeyValueSetting {
    id: string | DefaultLlmSetting;
    name: string;
    values: any;
    isDefault?: boolean;
}
export interface KeyValueSettings {
    settings?: KeyValueSetting[];
    embeddingModel?: string;
}

export interface AppDetails {
    version: string;
    appId: string;
    versionEndpoint: string;
}

export interface AppStateModel {
    appDetails: AppDetails;
    keyValues: KeyValueSettings;
    shortcuts: ShortCutModel[];
    llmResults: LlmHistoryModel[];
    commands: CommandModel[];
    generalSettings: GeneralSettingsModel;
    taskFlows: MimicStore[];
}

export interface GeneralSettingsModel {
    isAdvancedMode?: boolean;
}
