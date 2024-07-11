import axios from "axios";
import { serverURL } from "./api.config";
const baseUrl = "code";

export class CodeApi {
    static async exec(code: string, params: any) {
        try {
            const res = await axios.post(`${serverURL}/${baseUrl}/exec`, { code, params }, {
                headers: {
                    'Content-Type': 'application/json; charset=utf-8',
                },
            });
            return res.data;
        } catch (error) {
            console.error(error);
            return undefined;
        }
    }
}