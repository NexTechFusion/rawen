import { SIMILARITY_MODEL, ZERO_SHOT_CLASSIFICATION_IMAGE_MODEL, ZERO_SHOT_CLASSIFICATION_MODEL } from '../config';
import sync from 'import-sync';

export let RawImage;
export let AutoProcessor;
export let CLIPVisionModelWithProjection;
export let pipeline;
export let cos_sim;

export function ensureTransfomersLoaded() {
    if(RawImage) return;

    const userDataPath = process.env.ELECTRON_USER_DATA_PATH || "./";
    const loaded = sync(`@xenova/transformers`);
    loaded.env.localModelPath = userDataPath;
    loaded.env.cacheDir = userDataPath;

    RawImage = loaded.RawImage;
    AutoProcessor = loaded.AutoProcessor;
    CLIPVisionModelWithProjection = loaded.CLIPVisionModelWithProjection;
    pipeline = loaded.pipeline;
    cos_sim = loaded.cos_sim;
}

export const classifyImage = async (image: string, labels: string[], model?: string) => {
    ensureTransfomersLoaded();
    const classifier = await pipeline('zero-shot-classification', ZERO_SHOT_CLASSIFICATION_IMAGE_MODEL);
    const output = await classifier(image, labels);
    return output;
}

export const classifyText = async (text: string, labels: string[], model?: string) => {
    ensureTransfomersLoaded();
    const classifier = await pipeline('zero-shot-classification', ZERO_SHOT_CLASSIFICATION_MODEL);
    const output = await classifier(text, labels);

    return output;
}

export const getSimilarity = async (text1: string, text2: string | string[], model?: string) => {
    ensureTransfomersLoaded();
    const embedding1 = await pipeline('feature-extraction', model ?? SIMILARITY_MODEL);
    const embedding2 = await pipeline('feature-extraction', model ?? SIMILARITY_MODEL);

    const output = await embedding1(text1, { pooling: 'mean', normalize: true });
    const output2 = await embedding2(text2, { pooling: 'mean', normalize: true });

    const similarity = cos_sim(output['data'], output2['data']);

    return similarity;
}

export const textGeneration = async (text: string, model: string = 'Xenova/distilgpt2', callback?: (char: string) => void) => {
    ensureTransfomersLoaded();
    const pipe = await pipeline('text-generation', model);
    const output = await pipe(text, {
        callback_function: (beams) => {
            const decodedText = pipe.tokenizer.decode(beams[0].output_token_ids, {
                skip_special_tokens: true,
            })

            if (callback) {
                callback(decodedText);
            }
        }
    })

    return output;
}