import { BrowserWindow } from "electron";
import { join } from "path";
import { getScreenSize } from "./utils";

export let overlayWindow;

interface Area {
    x: number;
    y: number;
    width: number;
    height: number;
    classes: string;
    label: string;
    labelClasses: string;
}


export async function markAreasE(areas: Area[]) {
    const { width, height, scaleFactor } = getScreenSize();

    if (overlayWindow) {
        overlayWindow.webContents.send('mark-areas', areas);
        return;
    }

    overlayWindow = new BrowserWindow({
        x: 0,
        y: 0,
        width,
        height,
        autoHideMenuBar: true,
        frame: false,
        focusable: false,
        transparent: true,
        alwaysOnTop: true,
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false
        }
    });
    overlayWindow.setIgnoreMouseEvents(true)
    overlayWindow.setAlwaysOnTop(true, "pop-up-menu");

    overlayWindow.loadFile(join(process.env.PUBLIC, 'templates/mark-areas.html'));

    overlayWindow.webContents.once('did-finish-load', () => {
        overlayWindow.webContents.send('mark-areas', areas);
    });

    overlayWindow.on('closed', () => {
        overlayWindow = null;
    });
}

export function clearAreasE() {
    if (overlayWindow) {
        overlayWindow.close();
    }
}