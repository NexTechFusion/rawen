import axios from "axios";
import { SettingsModel } from "../../shared/models/settings.model";
import { appState } from "@/state/app.state";
import { ImageStoreModel, IngestImageRequest } from "../../scripts/local-lancedb-iamge.store";
import { SERVER_URL } from "../../config";
const baseUrl = "imageVector";

export class ImageVectorApi {
    static async call(img: string, config?: SettingsModel, topK?: number, options?: any) {
        try {
            const request: any = {
                topK,
                img,
                config,
                options
            }

            const res = await axios.post(`${SERVER_URL}/${baseUrl}/call`, request);
            return res.data as ImageStoreModel[];
        } catch (error) {
            console.error(error);
            return undefined;
        }
    }

    static async getStoreInfo(config: SettingsModel) {
        try {
            const res = await axios.post(`${SERVER_URL}/${baseUrl}/info`, config);
            return res.data as any;
        } catch (error) {
            console.error(error);
            return undefined;
        }
    }

    static async deleteById(id: string, config: SettingsModel = { keyValues: appState?.keyValues, storeId: "images" }, imgPath?: string) {
        try {
            const res = await axios.post(`${SERVER_URL}/${baseUrl}/delete`, { id, config, imgPath });
            return res.data as any;
        } catch (error) {
            console.error(error);
            throw new Error(error);
        }
    }

    static async ingestImages(images: IngestImageRequest[], config: SettingsModel = { keyValues: appState?.keyValues, storeId: "images" }) {
        try {

            const res = await axios.post(`${SERVER_URL}/${baseUrl}/ingest`, { config, images });
            return res.data as any;
        } catch (error) {
            console.error(error);
            throw new Error(error);
        }
    }
}