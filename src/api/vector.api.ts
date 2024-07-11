import axios from "axios";
import { serverURL } from "./api.config";
import { ICallRequest } from "../../shared/models/call.request.model";
import { SettingsModel } from "../../shared/models/settings.model";
import { DocumentData } from "../../shared/models/app-state.model";
import { appState } from "@/state/app.state";
const baseUrl = "vector";

export class VectorApi {
    static async call(prompt: string, config?: SettingsModel, topK?: number, options?: any) {
        try {
            const request: ICallRequest = {
                topK,
                prompt,
                config,
                options
            }

            const res = await axios.post(`${serverURL}/${baseUrl}/call`, request);
            return res.data as DocumentData[];
        } catch (error) {
            console.error(error);
            return undefined;
        }
    }

    static async getContentOfFile(fileName: string, config?: SettingsModel) {
        try {
            const res = await axios.post(`${serverURL}/${baseUrl}/content/${fileName}`, config);
            return res.data as any[];
        } catch (error) {
            console.error(error);
            return undefined;
        }
    }

    static async getStoreInfo(config: SettingsModel = { keyValues: appState?.keyValues, storeId: "global" }) {
        try {
            const res = await axios.post(`${serverURL}/${baseUrl}/info`, config);
            return res.data as any;
        } catch (error) {
            console.error(error);
            return undefined;
        }
    }

    static async deleteById(id: string, config: SettingsModel = { keyValues: appState?.keyValues, storeId: "global" }) {
        try {
            const res = await axios.post(`${serverURL}/${baseUrl}/delete`, { id, config });
            return res.data as any;
        } catch (error) {
            console.error(error);
            return undefined;
        }
    }

    static async updateFile(data: any, config: SettingsModel = { keyValues: appState?.keyValues, storeId: "global" }) {
        try {
            const res = await axios.post(`${serverURL}/${baseUrl}/update`, { config, data });
            return res.data as any;
        } catch (error) {
            console.error(error);
            return undefined;
        }
    }

    static async getEmbedding(texts: string[] | string) {
        try {
            const res = await axios.post(`${serverURL}/${baseUrl}/embedding`, { texts });
            return res.data?.result as any;
        } catch (error) {
            console.error(error);
            return undefined;
        }
    }

    static async getSimilarity(text1: string, text2: string[] | string): Promise<number> {
        try {
            const res = await axios.post(`${serverURL}/${baseUrl}/similar`, { text1, text2 });
            return res.data?.result as any;
        } catch (error) {
            console.error(error);
            return undefined;
        }
    }
}