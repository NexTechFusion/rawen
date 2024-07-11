
//Quick workaround
export let RawImage;
export let AutoProcessor;
export let CLIPVisionModelWithProjection;
export let pipeline;
export let cos_sim;

export async function initTransformers() {
    const TransformersApi = Function('return import("@xenova/transformers")')();
    const loaded = await TransformersApi;
    RawImage = loaded.RawImage;
    AutoProcessor = loaded.AutoProcessor;
    CLIPVisionModelWithProjection = loaded.CLIPVisionModelWithProjection;
    pipeline = loaded.pipeline;
    cos_sim = loaded.cos_sim;
}

export const classifyImage = async (image: string, labels: string[], model?: string) => {
    await initTransformers();
    const classifier = await pipeline('zero-shot-classification', 'Xenova/clip-vit-base-patch32');
    const output = await classifier(image, labels);
    return output;
}

export const classifyText = async (text: string, labels: string[], model?: string) => {
    await initTransformers();
    const classifier = await pipeline('zero-shot-classification', 'Xenova/nli-deberta-v3-xsmall');
    const output = await classifier(text, labels);

    return output;
}

export const getSimilarity = async (text1: string, text2: string | string[], model?: string) => {
    await initTransformers();
    const embedding1 = await pipeline('feature-extraction', model ?? 'Xenova/all-MiniLM-L6-v2');
    const embedding2 = await pipeline('feature-extraction', model ?? 'Xenova/all-MiniLM-L6-v2');

    const output = await embedding1(text1, { pooling: 'mean', normalize: true });
    const output2 = await embedding2(text2, { pooling: 'mean', normalize: true });

    const similarity = cos_sim(output['data'], output2['data']);

    return similarity;
}