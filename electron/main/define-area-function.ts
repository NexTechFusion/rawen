import { BrowserWindow, desktopCapturer, ipcMain, screen } from "electron";
import { join } from "path";
import { getScreenSize } from "./utils";

async function getActiveScreen() {
    const { width, height, scaleFactor, id } = getScreenSize();
    const sources = await desktopCapturer.getSources({ types: ['screen'], thumbnailSize: { width, height } });
    return sources.find((s) => s.display_id == id.toString());
}

export async function defineArear() {
    return new Promise((resolve) => {
        const { width, height } = getScreenSize();

        let overlayWindow = new BrowserWindow({
            width,
            height,
            frame: false,
            transparent: true,
            alwaysOnTop: true,
            webPreferences: {
                nodeIntegration: true,
                contextIsolation: false
            }
        });

        overlayWindow.setAlwaysOnTop(true, "pop-up-menu");


        overlayWindow.loadFile(join(process.env.PUBLIC, 'templates/overlay.html'));

        ipcMain.on('area-selected', async (event, rect) => {
            try {
                overlayWindow.close();
                setTimeout(async () => {
                    const res = await captureAndSaveArea(rect);
                    resolve(res);
                }, 50);
            } catch (err) {
                console.log(err);
                resolve(null);
            }
        });

    });
}


async function captureAndSaveArea(rect) {
    return new Promise(async (resolve) => {
        const { width, height, scaleFactor } = getScreenSize();
        const activeScreen = await getActiveScreen();

        const captureRect = {
            x: Math.floor(rect.startX * scaleFactor),
            y: Math.floor(rect.startY * scaleFactor),
            width: Math.floor(rect.width * scaleFactor),
            height: Math.floor(rect.height * scaleFactor)
        };
        const realSize = {
            width: Math.floor(width * scaleFactor),
            height: Math.floor(height * scaleFactor)
        };

        const resized = activeScreen.thumbnail.resize({
            height: realSize.height,
            width: realSize.width,
            quality: 'best'
        });

        try {
            const fileBuffer = resized.crop(captureRect).toPNG();
            resolve({
                fileBuffer: JSON.stringify(fileBuffer),
                captureRect: {
                    x: Math.floor(rect.startX),
                    y: Math.floor(rect.startY),
                    width: Math.floor(rect.width),
                    height: Math.floor(rect.height)
                }
            });
        } catch (err) {
            console.error('Failed to capture screenshot:', err);
            resolve(null);
        }
    });
}