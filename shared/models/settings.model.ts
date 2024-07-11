import { KeyValueSettings } from "./app-state.model";

export interface SettingsModel {
    llmSettingId?: DefaultLlmSetting | string;
    keyValues?: KeyValueSettings;
    storeId?: string;
    metadata?: any;
}

export enum DefaultLlmSetting {
    OPENAI = "OPENAI",
    GOOGLE = "GOOGLE",
    OLLAMA = "OLLAMA"
}