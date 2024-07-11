
import { Embeddings } from "@langchain/core/embeddings";

const chunkArray = <T>(arr: T[], chunkSize: number) =>
    arr.reduce((chunks, elem, index) => {
        const chunkIndex = Math.floor(index / chunkSize);
        const chunk = chunks[chunkIndex] || [];
        // eslint-disable-next-line no-param-reassign
        chunks[chunkIndex] = chunk.concat([elem]);
        return chunks;
    }, [] as T[][]);

export class HuggingFaceTransformersEmbeddings extends Embeddings {
    modelName = "Xenova/all-MiniLM-L6-v2";

    batchSize = 512;

    stripNewLines = true;

    timeout?: number;

    private pipelinePromise: Promise<any>;

    constructor(fields?: Partial<any>) {
        super(fields ?? {});

        this.modelName = fields?.modelName ?? this.modelName;
        this.stripNewLines = fields?.stripNewLines ?? this.stripNewLines;
        this.timeout = fields?.timeout;
    }

    async embedDocuments(texts: string[]): Promise<number[][]> {
        const batches = chunkArray(
            this.stripNewLines ? texts.map((t) => t.replace(/\n/g, " ")) : texts,
            this.batchSize
        );

        const batchRequests = batches.map((batch) => this.runEmbedding(batch));
        const batchResponses = await Promise.all(batchRequests);
        const embeddings: number[][] = [];

        for (let i = 0; i < batchResponses.length; i += 1) {
            const batchResponse = batchResponses[i];
            for (let j = 0; j < batchResponse.length; j += 1) {
                embeddings.push(batchResponse[j]);
            }
        }

        return embeddings;
    }

    async embedQuery(text: string): Promise<number[]> {
        const data = await this.runEmbedding([
            this.stripNewLines ? text.replace(/\n/g, " ") : text,
        ]);
        return data[0];
    }

    private async runEmbedding(texts: string[]) {
        const TransformersApi = Function('return import("@xenova/transformers")')();
        const { pipeline } = await TransformersApi;
        const pipe = await (this.pipelinePromise ??= pipeline(
            "feature-extraction",
            this.modelName
        ));

        return this.caller.call(async () => {
            const output = await pipe(texts, { pooling: "mean", normalize: true });
            return output.tolist();
        });
    }
}