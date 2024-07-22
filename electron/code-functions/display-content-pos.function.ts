import { BrowserWindow } from "electron";
import { join } from "path";
import { getScreenSize } from "../main/utils";
import { getPublicPath } from "../../shared/utils/resources";

export let window;

export interface ContentPosition {
    x: number;
    y: number;
    html: string;
    width?: number;
    height?: number;
}


export function displayContentAtPos(content: ContentPosition[], options = {
    clickable: false,
    additionalCss: "",
    function: () => { } // will be exec on start
}) {
    const { width, height } = getScreenSize();
    if (window) {
        window.webContents.send('contents', content);
        return;
    }

    window = new BrowserWindow({
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

    if (!options.clickable) {
        window.setIgnoreMouseEvents(true)
    }

    window.loadFile(join(getPublicPath(), 'templates/content-at-positions.html'));

    window.webContents.once('did-finish-load', () => {
        window.webContents.send('contents', content);
    });

    window.on('closed', () => {
        window = null;
    });
}

export function clearContentPos() {
    if (window) {
        window.close();
    }
}
