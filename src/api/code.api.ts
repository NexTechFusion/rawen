import axios from "axios";
import { SERVER_URL } from "../../config";
const baseUrl = "code";

export class CodeApi {
    static async exec(code: string, params: any) {
        try {
            const res = await axios.post(`${SERVER_URL}/${baseUrl}/exec`, { code, params }, {
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