import axios from "axios";
import { SettingsModel } from "../../shared/models/settings.model";
import { DocumentData } from "../../shared/models/app-state.model";
import { appState } from "@/state/app.state";
import { SERVER_URL } from "../../config";
const baseUrl = "trainer";

const getConfig = (config: any): SettingsModel => ({
    ...config,
    keyValues: appState?.keyValues,
})
export class TrainerApi {
    static async trainInput(prompt: string, metadata?: any, storeId?: string) {
        try {
            await axios.post(`${SERVER_URL}/${baseUrl}/trainInput`, {
                prompt,
                config: getConfig({
                    metadata,
                    storeId
                })
            });
        } catch (error) {
            console.error(error);
            return undefined;
        }
    }

    static async parseFiles(files: File[], config?: SettingsModel) {
        try {
            const formData = new FormData();
            const filePaths = files.map(f => ({
                key: f.name,
                path: f.path
            }));
            files.forEach(file => {
                formData.append("files", file);
            });

            formData.append('config', JSON.stringify(getConfig(config)));
            formData.append('filePaths', JSON.stringify(filePaths));

            const response = await axios.post(`${SERVER_URL}/${baseUrl}/parseFiles`, formData);
            return response.data as DocumentData[];
        } catch (error) {
            console.error(error);
            return undefined;
        }
    }

    static async trainFiles(files: File[], config?: SettingsModel) {
        try {
            const formData = new FormData();
            const filePaths = files.map(f => ({
                key: f.name,
                path: f.path
            }));
            files.forEach(file => {
                formData.append("files", file);
            });

            formData.append('config', JSON.stringify(getConfig(config)));
            formData.append('filePaths', JSON.stringify(filePaths));

            const response = await axios.post(`${SERVER_URL}/${baseUrl}/trainFiles`, formData);
            return response.data as DocumentData[];
        } catch (error) {
            console.error(error);
            return undefined;
        }
    }

    static async trainWebsite(url: string, options: { maxDepth?: number }) {
        try {
            const request = { url, ...getConfig({}), ...options };
            await axios.post(`${SERVER_URL}/${baseUrl}/trainWebsite`, request);
        } catch (error) {
            console.error(error);
            return undefined;
        }
    }
}