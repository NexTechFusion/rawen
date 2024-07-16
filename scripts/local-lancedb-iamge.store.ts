import * as fs from "node:fs/promises";
import { initTransformers, AutoProcessor, CLIPVisionModelWithProjection, RawImage } from "./transformer-wrapper";
import { retrive, setEmbeddingFn, update } from "./local-lancedb.store";
import { MetricType } from "vectordb";
import { getPublicPath } from "../shared/utils/resources";
let processor;
let vision_model;
let loaded = false;
const sourceColumn = "image";
const model_id = 'Xenova/clip-vit-base-patch32';

export interface IngestImageRequest {
    id: string;
    image: string | Buffer;
    relations?: [{ id: string, table: string }],
    additionalData?: string;
    text?: string;
}

export async function ingestImages(imgs: IngestImageRequest[], table = "images") {
    try {
        await ensureLoaded();

        const data = [];
        for (const img of imgs) {
            const genId = img.id ?? Math.random().toString(36).substring(7);

            let srcOrBuffer: any = img.image;
            let image = srcOrBuffer;
            if (typeof srcOrBuffer !== "string" || srcOrBuffer.startsWith("data")) {
                let saveToName = genId + ".png";

                if (typeof srcOrBuffer === "string" && srcOrBuffer.startsWith("data")) {
                    let m = srcOrBuffer.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
                    let binaryData = Buffer.from(m[2], 'base64');
                    srcOrBuffer = binaryData;
                }
                const imgPath = `${getPublicPath()}/lancedb/images`;
                await fs.writeFile(`${imgPath}/${saveToName}`, srcOrBuffer);
                image = `${imgPath}/${saveToName}`;
            }

            await new Promise((resolve, reject) => setTimeout(resolve, 300));
            //check if file exists
            await fs.access(image);

            data.push({
                id: genId,
                image,
                path: image,
                date: new Date().toISOString(),
                relations: JSON.stringify(img.relations ?? []),
                additionalData: img.additionalData ?? "",
                text: img.text ?? ""
            });
        }
        await update({
            data,
            table,
            embed: embed_fn
        });

        return data.map(o => o.path);
    } catch (err) {
        console.error(err);
        throw new Error(err);
    }
}

export interface ImageStoreModel {
    id: number;
    image: string;
    date: string;
    relations?: { id: string, table: string }[];
    distance?: number;
    path?: string;
}

export async function retriveImages(srcOrBuffer: string | any, limit = 10, filter?: string, where?: string, maxDistance = 0.1, table = "images") {
    await ensureLoaded();
    let isBuffer = false;

    if (srcOrBuffer != "*") {
        if (typeof srcOrBuffer !== "string" || srcOrBuffer.startsWith("data")) {

            if (typeof srcOrBuffer === "string" && srcOrBuffer.startsWith("data")) {
                let m = srcOrBuffer.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
                let binaryData = Buffer.from(m[2], 'base64');
                srcOrBuffer = binaryData;
            }

            isBuffer = true;
            const imgPath = `${getPublicPath()}/lancedb/images`;
            const tmpFileName = imgPath + "/" + Math.random().toString(36).substring(7) + "TMP.png";
            await fs.writeFile(tmpFileName, srcOrBuffer);
            srcOrBuffer = tmpFileName;
        }
    }

    const result: any = await retrive({
        query: srcOrBuffer,
        table,
        filter,
        where,
        limit,
        metricType: MetricType.Cosine,
        isImage: true,
        embed: embed_fn
    });

    if (isBuffer) {
        await fs.unlink(srcOrBuffer);
    }

    const filterdByScore = result.sort(
        (a, b) => a._distance - b._distance
    ).filter(o => o._distance < maxDistance);

    return filterdByScore.map(o => ({
        ...o,
        distance: o._distance,
        relations: JSON.parse(o.relations ?? "[]")
    })) as ImageStoreModel[];
}

const ensureLoaded = async () => {
    if (loaded) return;
    await initTransformers();
    processor = await AutoProcessor.from_pretrained(model_id);
    vision_model = await CLIPVisionModelWithProjection.from_pretrained(model_id, {
        quantized: false,
    });

    loaded = true;
}

async function getImgEmbedding(imgPath: string) {
    await ensureLoaded();
    const image = await RawImage.read(imgPath);
    let image_inputs = await processor(image);
    const { image_embeds } = await vision_model(image_inputs);
    const embed_as_list = image_embeds.tolist()[0];
    return embed_as_list;
}

const embed_fn = {
    sourceColumn,
    embed: async function (batch) {
        let result = []
        for (let src of batch) {

            if (src.startsWith("*")) {
                result.push([0, 0])
                continue;
            }


            const res = await getImgEmbedding(src)
            result.push(res)
        }
        return (result)
    }
}

export async function getAll(config = null) {
    const storeId = config?.storeId ?? "global";

    const docsArray: ImageStoreModel[] = await retriveImages(
        "*",
        20000,
        undefined,
        undefined,
        2000,
        storeId
    ) as any[];

    const groupedDocs = docsArray.reduce((r, a) => {
        r[a.id] = [...r[a.id] || [], a];
        return r;
    }, {});

    return groupedDocs;
}
