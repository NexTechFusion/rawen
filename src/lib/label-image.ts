import cv from '@techstark/opencv-js';

async function waitUntilCvLoaded() {
    return new Promise((resolve) => {
        if (cv.getBuildInformation) {
            resolve(true);
        }
        else {
            cv['onRuntimeInitialized'] = () => {
                resolve(true);
            }
        }
    });
}

export async function labelImage(imgBase64: string) {
    try {
        await waitUntilCvLoaded();
        // Load the image from the provided source onto a canvas
        const image = new Image();
        image.src = imgBase64;

        await new Promise<void>((resolve) => {
            image.onload = () => {
                resolve();
            };
        });

        const canvas1 = document.createElement('canvas');
        canvas1.width = image.width;
        canvas1.height = image.height;
        const ctx = canvas1.getContext('2d');
        ctx.drawImage(image, 0, 0, image.width, image.height);

        let src = cv.imread(canvas1); // Load the canvas as an image

        const contours: any = new cv.MatVector();
        const hierarchy = new cv.Mat();

        const grayscale = new cv.Mat();
        cv.cvtColor(src, grayscale, cv.COLOR_RGBA2GRAY, 0);

        const blurred = new cv.Mat();
        cv.GaussianBlur(grayscale, blurred, new cv.Size(5, 5), 0);

        const thresholded = new cv.Mat();
        cv.adaptiveThreshold(
            blurred,
            thresholded,
            255,
            cv.ADAPTIVE_THRESH_GAUSSIAN_C,
            cv.THRESH_BINARY_INV,
            11,
            2
        );

        const edges = new cv.Mat();
        cv.Canny(thresholded, edges, 50, 150, 3, false);

        const dilated = new cv.Mat();
        const M = cv.Mat.ones(5, 5, cv.CV_8U);
        cv.dilate(edges, dilated, M);

        cv.findContours(
            dilated,
            contours,
            hierarchy,
            cv.RETR_EXTERNAL,
            cv.CHAIN_APPROX_SIMPLE
        );

        const fields = [];
        for (let i = 0; i < contours.size(); i++) {
            const contour = contours.get(i);
            const rect = cv.boundingRect(contour);

            if (rect.width > 10 && rect.height > 5) {
                const point1 = new cv.Point(rect.x, rect.y);
                const point2 = new cv.Point(rect.x + rect.width, rect.y + rect.height);
                cv.rectangle(src, point1, point2, [255, 0, 0, 255], 1);

                cv.rectangle(src, new cv.Point(rect.x, rect.y + rect.height), new cv.Point(rect.x + 24, rect.y + rect.height + 20), [255, 0, 0, 255], cv.FILLED);
                cv.putText(
                    src,
                    i.toString(),
                    new cv.Point(rect.x + 2, rect.y + rect.height + 14),
                    cv.FONT_HERSHEY_DUPLEX,
                    0.5,
                    [255, 255, 255, 255]
                );

                fields.push({ number: i, rect });
            }
        }

        const canvas = document.createElement('canvas');
        canvas.width = src.cols;
        canvas.height = src.rows;

        cv.imshow(canvas as any, src);

        src.delete();
        grayscale.delete();
        contours.delete();
        hierarchy.delete();

        const imgBuffer = await new Promise((resolve) => {
            canvas.toBlob((blob) => {
                const reader: any = new FileReader();
                reader.onload = () => {
                    const buffer = Buffer.from(reader.result);
                    resolve(buffer);
                };
                reader.readAsArrayBuffer(blob);
            }, 'image/png');
        });

        return { imgBuffer, fields };

    } catch (e) {
        console.error(e)
    }
}


// Function to load an image from a URL
function loadImage(url: string): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.crossOrigin = "Anonymous";
        img.src = url;
        img.onload = () => resolve(img);
        img.onerror = (err) => reject(err);
    });
}

// Function to find template matches
export async function findTemplateMatch(imgBase64: string, tmplBase64: string, threshold: number = 0.8): Promise<{ x: number, y: number, width: number, height: number }> {
    await waitUntilCvLoaded();
    
    // Load the images
    const imgElement = await loadImage(imgBase64);
    const templateElement = await loadImage(tmplBase64);

    // Create OpenCV mats from the images
    const img = cv.imread(imgElement);
    const template = cv.imread(templateElement);

    // Perform template matching
    const matched = new cv.Mat();
    let mask = new cv.Mat();

    cv.matchTemplate(img, template, matched, cv.TM_SQDIFF_NORMED, mask);

    // Find the best match
    const result = cv.minMaxLoc(matched, mask);
    const { maxLoc, maxVal, minVal, minLoc } = result;

    // console.log(maxVal, maxLoc, minVal, minLoc);
    let toReturn = null;
    if (maxVal >= threshold) {
        const { x, y } = minLoc;
        const { cols: width, rows: height } = template;
        toReturn = { x, y, width, height };
    }

    // Clean up
    img.delete();
    template.delete();
    matched.delete();

    return toReturn;
}