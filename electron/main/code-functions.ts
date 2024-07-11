import { ipcMain, screen, app, Notification, clipboard, shell } from "electron";
import { closeCursorWindow, collapseApp, isAppCollapsed, latestState, mainWindow, openExternalWindow, openFollowingWindow } from ".";
import { ElectronIpcEvent } from "../../shared/models/electron-ipc-events";
import { defineArear } from "./define-area-function";
import { saveAppStateElectron } from "./state.handler";
import { clearAreasE, markAreasE } from "./mark-areas-functon";
import { clearContentPos, displayContentAtPos } from "./display-content-pos-functions";
import { getScreenSize } from "./utils";
let closeOnBlur = null;
let lastAppBounds = null;
export function addCodeExecuterHandler() {
    ipcMain.handle("execute-code", async (event, arg) => {
        const result = await executeCode(arg);
        return result;
    });

    ipcMain.on("close-app", async (event, arg) => {
        event.preventDefault();
        if (closeOnBlur) {
            mainWindow.removeListener('blur', closeOnBlur);
            closeOnBlur = null;
        }

        mainWindow.hide();
    });
}

export async function executeCode(code: string, preDefinitions?: any) {

    function closeApp() {
        mainWindow.minimize();
        removeBlutListener();
    }

    function restoreApp() {
        mainWindow.restore();
        closeOnBlur = null;
    }

    function openApp(options: {
        url: "/interact",
        keepInteraction,
        pinRight?: boolean,
        width?: number, height?: number, convoId: undefined, tasks: [], closeOnBlur?: boolean, prompt: undefined, focus?: boolean, bringToFront?: boolean, preload?: boolean, disableAutoResize,
        onCursor,
        forceOpen

    }) {
        let url = options.url ?? "/interact";

        if (!options.height) {
            options.height = 800;
        }

        if (!options.width) {
            options.width = 1024;
        }

        if (!options?.convoId) {
            if (!url.includes("?")) {
                url += "?";
            }

            const randomGUID = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
            url += `convoId=${randomGUID}`;
        }

        if (options?.tasks) {
            const tasks = options?.tasks?.join(",");
            url += `&cmd=${tasks}`;
        }

        if (options?.prompt) {
            url += `&prompt=${options?.prompt}`;
        }

        if (options?.preload) {
            url += `&preload=1`;
        }

        if (options?.disableAutoResize) {
            url += `&disableAutoResize=1`;
        }

        if (url && !options?.keepInteraction) {
            mainWindow.webContents.send(ElectronIpcEvent.NAVIGATE, url)
        }

        if (isAppCollapsed) {
            collapseApp({ isCollapsed: false });
        }

        displayApp(options);
    }

    function displayCursorWindow(content) {
        openFollowingWindow(content);
    }

    function openExtWindow(filePath, options) {
        openExternalWindow(filePath, options);
    }

    function hideCursorWindow() {
        closeCursorWindow();
    }

    function saveState() {
        saveAppStateElectron(latestState);
    }

    function displayNotification(title, body) {
        const notification = new Notification({
            title: title,
            body: body,
            icon: "public/favicon.ico"
        });
        notification.show();
    }

    function getCursorPosition() {
        return preDefinitions?.cursorPosition;
    }

    function getMarkedText() {
        return clipboard.readText();
    }

    function getAllContent() {
        return preDefinitions?.allContent;
    }

    function getWindowTitle() {
        return preDefinitions?.activeTitle;
    }

    async function sleep(ms: number) {
        return new Promise((resolve) => setTimeout(resolve, ms));
    }

    function resizeWindow(newWidth: number, newHeight: number) {
        const width = newWidth ?? mainWindow.getBounds().width;
        const height = newHeight ?? mainWindow.getBounds().height;
        mainWindow.setBounds({ width, height });
    }

    function shellOpenExternal(url) {
        shell.openExternal(url);
    }

    function shellOpen(url) {
        shell.openPath(url);
    }

    async function defineArea() {
        const area = await defineArear();
        return area;
    }

    function markAreas(areas) {
        if (typeof areas === "string") {
            areas = JSON.parse(areas);
        }

        markAreasE(areas);
    }

    function clearAreas() {
        clearAreasE();
    }

    function displayContentAtPositions(content, options) {
        if (typeof content === "string") {
            content = decodeContent(content);
        }

        if (typeof options === "string") {
            options = decodeContent(options);
        }

        displayContentAtPos(content, options);
    }

    function clearContentAtPositions() {
        clearContentPos();
    }

    function decodeContent(content) {
        if (content && typeof content === "string") {
            content = decodeURIComponent(content);

            if (typeof content === "string") {
                content = JSON.parse(content);
            }
        }

        return content;
    }

    const asyncCode = `
    ${displayContentAtPositions}
        ${clearContentAtPositions}
        ${shellOpen}
        ${shellOpenExternal}
        ${openExtWindow}
        ${displayCursorWindow}
        ${hideCursorWindow}
        ${getCursorPosition}
        ${getMarkedText}
        ${getAllContent}
        ${openApp}
        ${restoreApp}
        ${closeApp}
        ${getWindowTitle}
        ${sleep}
        ${displayNotification}
        ${resizeWindow}
        ${defineArea}
        ${saveState}
        ${markAreas}
        ${clearAreas}

        (async () => {
        ${code}
        })()
    `;

    try {
        const result = await eval(asyncCode);

        return result;
    } catch (err) {
        console.log(err);
        return err;
    }
}
interface DisplayAppOptions {
    width?: number;
    height?: number;
    focus?: boolean;
    pinRight?: boolean;
    closeOnBlur?: boolean;
    onCursor?: boolean;
    convoId?: string;
}

export function displayApp(options: DisplayAppOptions) {
    let { x, y } = screen.getCursorScreenPoint();
    let currentDisplay = screen.getDisplayNearestPoint({ x, y });

    lastAppBounds = {
        ...mainWindow.getBounds(),
        isMinimized: mainWindow.isMinimized(),
        isFocused: mainWindow.isFocused(),
        convoId: options.convoId
    };

    x = options.onCursor ? x : mainWindow.getBounds().x;
    y = options.onCursor ? y : mainWindow.getBounds().y;

    if (!options.width) {
        options.width = currentDisplay.bounds.width;
    }

    if (!options.height) {
        options.height = currentDisplay.bounds.height / 2;
    }

    // Ensure the window is not outside the screen horizontally
    if (x + options.width > currentDisplay.bounds.x + currentDisplay.bounds.width) {
        x = currentDisplay.bounds.x + currentDisplay.bounds.width - options.width;
    }

    // Ensure the window is not outside the screen vertically
    if (y + options.height > currentDisplay.bounds.y + currentDisplay.bounds.height) {
        y = currentDisplay.bounds.y + currentDisplay.bounds.height - options.height;
    }

    if (options.pinRight) {
        const Awidth = options.width ?? mainWindow.getBounds().width;
        const Aheight = options.height ?? mainWindow.getBounds().height;
        mainWindow.setSize(Awidth, Aheight);

        const { width } = getScreenSize();
        mainWindow.setPosition(width - Awidth - 10, mainWindow.getBounds().y);
    }

    if (closeOnBlur) {
        removeBlutListener();
        if (!mainWindow.isMinimized() && mainWindow.isVisible() && !mainWindow.isFocused()) mainWindow.minimize();
    }

    if (mainWindow.isMinimized()) mainWindow.restore();

    mainWindow.setBounds({ x: x, y: y, width: options.width, height: options.height });
    mainWindow.setAlwaysOnTop(true);
    mainWindow.show();

    if (options.closeOnBlur) {
        function closeOnBlurFn() {
            mainWindow.minimize();
            mainWindow.removeListener('blur', closeOnBlurFn);
        }
        mainWindow.on('blur', closeOnBlurFn);
        closeOnBlur = closeOnBlurFn;
    }

    if (options.focus && !mainWindow.isFocused()) {
        mainWindow.focus();
    }
}

export function removeBlutListener() {
    if (!closeOnBlur) return;
    mainWindow.removeListener('blur', closeOnBlur);
    closeOnBlur = null;
}
