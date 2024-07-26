import { screen, webContents } from "electron";
import { mainWindow } from "./index";
import { ElectronIpcEvent } from "../../shared/models/electron-ipc-events";

export function getScreenSize() {
  const mpusepos = screen.getCursorScreenPoint();
  const activeDisplay = screen.getDisplayNearestPoint(mpusepos);
  const { width, height } = activeDisplay.bounds;
  const scaleFactor = activeDisplay.scaleFactor;
  return { width, height, scaleFactor, id: activeDisplay.id };
}

export async function getElectronWindows() {
  const windows = []
  for (const electronWindow of webContents.getAllWebContents()) {
    const nativeImage = await electronWindow.capturePage();
    const window = {
      name: electronWindow.getTitle(),
      isAppWindow: true,
      id: electronWindow.getOSProcessId(),
      thumbnail: nativeImage
    };
    windows.push(window);
  }

  return windows;
}

export function logElectron(text: string) {
  mainWindow!.webContents.send(ElectronIpcEvent.LOG, text);
}