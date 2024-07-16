import { AppStateModel } from "../../shared/models/app-state.model";
import { BrowserWindow, app, ipcMain, protocol } from "electron";
import fs from "fs";
import { ElectronIpcEvent } from "../../shared/models/electron-ipc-events";
import { getPublicPath } from "../../shared/utils/resources";
import path from "path";
import { mainWindow } from ".";



export function saveAppStateElectron(state: any) {
    try {
        const jsonData = JSON.stringify({ ...state, llmResults: [], taskFlows: [] }, null, 2);
        const appPath = path.join(getPublicPath(), 'app-state.json');
        fs.writeFileSync(appPath, jsonData, 'utf-8');
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
    const appPath = path.join(getPublicPath(), 'app-state.json');
    const jsonData = fs.readFileSync(appPath, 'utf-8');
    const state = JSON.parse(jsonData);
    mainWindow?.webContents.send(ElectronIpcEvent.INITAL_STATE, state);
    return state;
}