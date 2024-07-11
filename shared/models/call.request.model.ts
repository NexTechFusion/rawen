import { SettingsModel } from "./settings.model";

export interface ICallRequest {
    prompt: string;
    topK?: number;
    config?: SettingsModel;
    [key: string]: any;
}