export const SERVER_PORT = 3410;
export const SERVER_URL = `http://localhost:${SERVER_PORT}/api`;
export const CODE_SERVER_PORT = 3440;

// xenova models
export const EMBEDDING_MODEL = 'Xenova/all-MiniLM-L6-v2'; //if you change this delete the lancedb folder
export const EMBEDDING_IMAGE_MODEL = 'Xenova/clip-vit-base-patch32'; //if you change this delete the lancedb folder
export const ZERO_SHOT_CLASSIFICATION_IMAGE_MODEL = 'Xenova/clip-vit-base-patch32';
export const ZERO_SHOT_CLASSIFICATION_MODEL = 'Xenova/nli-deberta-v3-xsmall';
export const SIMILARITY_MODEL = 'Xenova/all-MiniLM-L6-v2';