import { ipcRenderer } from 'electron'
import { ElectronIpcEvent } from '../../shared/models/electron-ipc-events'
import { ExecExternalCodeModel } from '@/modules/task/task.model'
import { pushUpdateCollapse } from '@/components/ui/app-collapse';

export const ElectronState = {
    isAppCollapsed: false,
};

export const registerCodePlayerHandler = (callback: (taskEditorData: ExecExternalCodeModel) => void) => {
    ipcRenderer.on(ElectronIpcEvent.CODE_EXEC, (_, taskEditorData) => callback(taskEditorData))
}

export const destoryAllHandlers = () => {
}

export const setCanClick = (canClick: boolean) => {
    ipcRenderer.send(ElectronIpcEvent.SET_CAN_CLICK, canClick)
};

export const registerKeyPressHandler = (callback: (data) => void) => {
    ipcRenderer.on(ElectronIpcEvent.KEY_PRESSED, (_, data) => callback(data))
}

export const registerKeyReleaseHandler = (callback: (data) => void) => {
    ipcRenderer.on(ElectronIpcEvent.KEY_RELEASED, (_, data) => callback(data))
}

export const addFocusHandler = (callback: () => void) => {
    ipcRenderer.on(ElectronIpcEvent.FOCUS, (_,) => callback())
}

export const openExternalWindowElectron = (filePath: string, options: any) => {
    ipcRenderer.send(ElectronIpcEvent.OPEN_EXTERNAL_WINDOW, { filePath, options })
}

export const updateStateElectron = (state) => {
    ipcRenderer.send(ElectronIpcEvent.UPDATE_STATE, state)
}

export const collapseApp = (isCollapsed: boolean, width?: number, height?: number, position?: { x: number, y: number }, placement?: "RIGHT") => {
    ElectronState.isAppCollapsed = isCollapsed;
    pushUpdateCollapse();
    ipcRenderer.send(ElectronIpcEvent.COLLAPSE_APP, { isCollapsed, width, height, position, placement })
};
