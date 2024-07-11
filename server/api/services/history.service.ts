import { Service } from "typedi";

@Service()
export class HistoryService {
    private history = {} as { [key: string]: any[] };

    public setHistory(data: any) {
        this.history = data;
    }

    public getHistory() {
        return this.history;
    }

    public addHistory(historyKey: string, value: { input?: string, response?: string, type: "question" | "error" }) {
        if (!this.history[historyKey]) {
            this.history[historyKey] = [];
        }

        this.history[historyKey].push(value);
    }


    public includeHistory(historyKey: string, input: string): string {
        const history = this.getHistory();
        const myHistory = history[historyKey];
        if (!myHistory) {
            return input;
        }

        let historyText: any = history[historyKey]
        historyText = historyText.map((item: any) => {

            if (item.type === 'question') {
                return `Human:${item.input}\n Ai:${item.response}\n`;
            }

            if (item.type === 'error') {
                return `ERROR: ${item.response} cause of ${input}\n`;
            }

        }).join('');
        return `${historyText}${input}`;
    }
}