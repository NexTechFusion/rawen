import { AppStateModel } from "../../shared/models/app-state.model";
import { BrowserWindow, app, ipcMain, protocol } from "electron";
import fs from "fs";
import { ElectronIpcEvent } from "../../shared/models/electron-ipc-events";
import { getPublicPath } from "../../shared/utils/resources";
import path from "path";
import { mainWindow } from "../main/index";
import { waitForAllPermissions as askPermissions } from "../main/mac-permissions";
import { logElectron } from "../main/utils";

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
    let didFinishLoadExecuted = false;
    
    const fallbackTimeout = setTimeout(() => {
        logElectron('Loading state');
        if (!didFinishLoadExecuted) {
            executeDidFinishLoadLogic();
        }
    }, 2000);
    
    win.webContents.on('did-finish-load', () => {
        logElectron('Loading state');
        didFinishLoadExecuted = true;
        clearTimeout(fallbackTimeout);
        executeDidFinishLoadLogic();
    });

    function executeDidFinishLoadLogic() {
        try {

            logElectron('State loaded, pusing to app');
            callback(pushStateToApp());

            win.webContents.send(ElectronIpcEvent.VERSION_INFO, {
                version: app.getVersion(),
                name: app.getName()
            });

            ipcMain.on(ElectronIpcEvent.UPDATE_STATE, (_, state) => {
                if (state != null) {
                    callback(state);
                }
            });

            if (process.platform === 'darwin') {
                askPermissions();
            }
        } catch (err) {
            console.log(err);
        }
    }
}

export function pushStateToApp() {
    try {
        const jsonData = fs.readFileSync(getAppstatePath(), 'utf-8');
        const state = JSON.parse(jsonData);
        mainWindow?.webContents.send(ElectronIpcEvent.INITAL_STATE, state);
        return state;
    } catch (error) {
        console.error('Failed to load state:', error);
    }
}
