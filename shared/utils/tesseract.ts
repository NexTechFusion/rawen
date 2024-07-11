import { createWorker } from "tesseract.js";
// import sharp from "sharp";

let worker = null;
let workerTimer = null;
export const img2Text = async (imgPath: string, lang = "eng") => {
    if (!worker) {
        worker = await createWorker();
    }
    // const imgBuffer = await preprocessImageForOCR(imgPath);
    const ret = await worker.recognize(imgPath, lang);
    refreshWorkerTerminate();
    return ret;
}

function refreshWorkerTerminate() {
    if (worker) {
        clearTimeout(workerTimer);
        workerTimer = setTimeout(() => {
            if (worker) {
                worker.terminate();
                worker = null;
            }
        }, 60000);
    }
}


// async function preprocessImageForOCR(buffer) {
//     try {
//         let processedBuffer = await sharp(buffer)
//             .greyscale()
//             .sharpen()
//             .threshold(200)
//             .toBuffer();

//         return processedBuffer;
//     } catch (error) {
//         console.error('Error processing image for OCR:', error);
//         throw error;
//     }
// }