import axios from "axios";
import { CODE_SERVER_PORT } from "../config";

export class BackendApi {

    static async execCode(code: string, params = {}) {
        try {
            const res = await axios.post(`http://localhost:${CODE_SERVER_PORT}/code/exec`, { code, params }, {
                headers: {
                    'Content-Type': 'application/json; charset=utf-8',
                },
            });
            return res.data as string;
        } catch (error) {
            console.error(error);
            return undefined;
        }
    }
}
