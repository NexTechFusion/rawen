import { MetricType, OpenAIEmbeddingFunction, connect } from 'vectordb';
import { initTransformers, pipeline } from './transformer-wrapper';
import path from 'node:path';
let embedFunction;
export interface IngestOptions extends EmbeddFn {
    table: string;
    data: Array<Record<string, unknown>>;
}
interface EmbeddFn { // TMP solution lazy to fix
    embed?: any;
}
export interface RetriveOptions extends EmbeddFn {
    query: string;
    table: string;
    limit?: number;
    filter?: string;
    where?: string;
    select?: Array<string>;
    metricType?: MetricType;
    isImage?: boolean;
}

export interface DeleteOptions extends EmbeddFn {
    table: string;
    filter: string;
}

export interface UpdateOptions extends EmbeddFn {
    table: string;
    data: any[]
}

export function setEmbeddingFn(fn) {
    embedFunction = fn;
}

async function ensureSet() {
    if (embedFunction == null) {
        await useLocalEmbedding();
    }
}

export async function useLocalEmbedding() {
    await initTransformers();
    const pipe = await pipeline('feature-extraction', 'Xenova/all-MiniLM-L6-v2');

    const embed_fun: any = {};
    embed_fun.sourceColumn = 'pageContent';
    embed_fun.embed = async function (batch) {
        let result = [];
        for (let text of batch) {
            const res = await pipe(text, { pooling: 'mean', normalize: true });
            result.push(Array.from(res['data']));
        }
        return (result);
    }

    embedFunction = embed_fun;
}

export async function getEmbedding(texts: string[], model = 'Xenova/all-MiniLM-L6-v2'): Promise<any> {
    await initTransformers();
    const pipe = await pipeline('feature-extraction', model);
    const output = await pipe(texts, { pooling: "mean", normalize: true });
    return output.tolist();
}

export function useOpenAiEmbedding(apiKey: string, sourceColumn = 'pageContent') {
    embedFunction = new OpenAIEmbeddingFunction(sourceColumn, apiKey)
}

export async function update(options: UpdateOptions) {
    try {
        if (!options.embed) {
            await ensureSet();
        }

        const db = await ensureConnect();

        if ((await db.tableNames()).includes(options.table)) {
            const tbl = await db.openTable(options.table, options.embed ?? embedFunction)

            const toRemove = options.data.map(o => `'${o.id}'`).join(", ");
            await tbl.delete("id IN (" + toRemove + ")");

            await tbl.add(options.data)
        } else {
            await db.createTable(options.table, options.data, options.embed ?? embedFunction)
        }
    } catch (e) {
        console.error(e);
        throw e;
    }
}

export async function remove(options: DeleteOptions) {
    try {
        if (!options.embed) {
            await ensureSet();
        }
        const db = await ensureConnect();

        if ((await db.tableNames()).includes(options.table)) {
            const tbl = await db.openTable(options.table, options.embed ?? embedFunction)
            await tbl.delete(options.filter)
        } else {

            return new Error("Table does not exist")
        }
    } catch (e) {
        console.error(e);
        throw e;
    }
}

async function ensureConnect() {
    const lancePath = process.env.ELECTRON_USER_DATA_PATH || "./lancedb";
    return await connect(lancePath);
}

export async function ingest(options: IngestOptions) {
    try {
        if (!options.embed) {
            await ensureSet();
        }
        const db = await ensureConnect();

        if ((await db.tableNames()).includes(options.table)) {
            const tbl = await db.openTable(options.table, options.embed ?? embedFunction)
            await tbl.overwrite(options.data)
        } else {
            await db.createTable(options.table, options.data, options.embed ?? embedFunction)
        }
    }
    catch (e) {
        console.error(e);
        throw e;
    }
}

export async function retrive(options: RetriveOptions) {
    try {
        if (!options.embed) {
            await ensureSet();
        }
        const db = await ensureConnect();

        if ((await db.tableNames()).includes(options.table)) {
            const tbl = await db.openTable(options.table, options.embed ?? embedFunction)
            const build = tbl.search(options.query).metricType(MetricType.Cosine);

            if (options.filter) {
                build.filter(options.filter);
            }

            if (options.where) {
                build.where(options.where);
            }

            if (options.select) {
                build.select(options.select);
            }

            if (options.limit) {
                build.limit(options.limit);
            }
            let results: any = await build.execute();

            if (options.query !== "*") {
                //filter _distance above
                results = results.filter((r) => r._distance < 1);
                // for (let i = 0; i < results.length; i++) {
                //     const simi = await getSimilarity(results[i].pageContent, options.query);
                //     console.log("Similarity: ", simi);
            }

            //sort by the property _distance, the smaller the better
            results = results.sort((a, b) => a._distance - b._distance);
            if (options.isImage) {
                return results;
            }

            return mapToDocumentData(results);
        } else {
            return [];
        }
    }
    catch (e) {
        console.error(e);
        throw e + ">_________>";
    }

}

function mapArrayToSting(arr: any[]) {
    if (arr == null) return "[]";
    return JSON.stringify(arr);
}

export function mapToLanceModel(docs: any[], config = null) {
    const mappedDocs: any[] = docs.map((doc: any) => ({ //LanceDocumentData DocumentData
        id: config?.metadata?.id || doc.metadata?.id,
        pageContent: doc.pageContent,
        date: doc.metadata?.date,
        file_page_lines_from: doc.metadata?.file_page_lines_from ?? 0,
        file_page_lines_to: doc.metadata?.file_page_lines_to ?? 0,
        file_page_number: doc.metadata?.file_page_number ?? 1,
        file_path: config?.metadata?.file_path ?? doc.metadata?.file_path ?? '',
        file_total_pages: doc.metadata?.file_total_pages ?? 1,
        keywords: config?.metadata?.keywords ?? doc.keywords ?? "",
        tags: config?.metadata?.tags ?? doc.metadata?.tags ?? "",
        relations: mapArrayToSting(config?.metadata?.relations || doc.relations),
    }));

    return mappedDocs;
}

// TODO as service
function mapToDocumentData(docs: any[]) {
    return docs.map(doc => {
        return {
            pageContent: doc.pageContent,
            metadata: {
                id: doc.id,
                date: doc.date,
                file_path: doc.file_path,
                file_page_number: doc.file_page_number,
                file_page_lines_from: doc.file_page_lines_from,
                file_page_lines_to: doc.file_page_lines_to,
                file_total_pages: doc.file_total_pages,
                keywords: doc.keywords,
                tags: doc.tags,
                relations: JSON.parse(doc.relations ?? "[]")
            }
        }
    })

}

export async function getDocsbyFileName(fileName: string, config = null) {
    const docsArray = await retrive({
        filter: `file_name LIKE '%${fileName.slice(0, 10)}%'`,
        table: config?.storeId ?? "global",
        query: "",
        limit: 5000
    });

    return mapToDocumentData(docsArray as any);
}

export async function getDocs(config = null) {
    const storeId = config?.storeId ?? "global";

    const docsArray = await retrive({
        table: storeId,
        query: "*",
        limit: 5000
    }) as any[];

    const groupedDocs = docsArray.reduce((r, a) => {
        r[a.metadata.id] = [...r[a.metadata.id] || [], a];
        return r;
    }, {});

    return groupedDocs;
}