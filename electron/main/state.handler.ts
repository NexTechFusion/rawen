import { AppStateModel } from "../../shared/models/app-state.model";
import { BrowserWindow, app, ipcMain, protocol } from "electron";
import fs from "fs";
import { ElectronIpcEvent } from "../../shared/models/electron-ipc-events";
import { getPublicPath } from "../../shared/utils/resources";
import path from "path";
import { mainWindow } from ".";

function getAppstatePath() {
    const appPath = path.join(getPublicPath(), 'app-state.json');
    return appPath;
}

export function saveAppStateElectron(state: any) {
    try {
        const jsonData = JSON.stringify({ ...state, llmResults: [], taskFlows: [] }, null, 2);
        fs.writeFileSync(getAppstatePath(), jsonData, 'utf-8');
    } catch (err) {
        console.log(err);
    }
}

export function addUpdateAppStateHandler(win: BrowserWindow, callback: (state: AppStateModel) => void) {
    ipcMain.on(ElectronIpcEvent.UPDATE_STATE, (_, state) => {
        if (state != null) {
            callback(state);
        }
    });

    win.webContents.on("did-finish-load", () => {
        try {
            callback(pushStateToApp());
            win.webContents.send(ElectronIpcEvent.VERSION_INFO, {
                version: app.getVersion(),
                name: app.getName()
            });
        } catch (err) {
            console.log(err);
        }
    });
}

export function pushStateToApp() {
    const jsonData = fs.readFileSync(getAppstatePath(), 'utf-8');
    mainWindow!.webContents.send(ElectronIpcEvent.LOG, getAppstatePath()); // TODO RM
    const state = JSON.parse(jsonData);
    mainWindow?.webContents.send(ElectronIpcEvent.INITAL_STATE, state);
    return state;
}