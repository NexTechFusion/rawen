import { useAppContext } from "@/state/app.state";
import React, { useEffect } from "react";
import { ipcRenderer } from "electron";
import { ShortCutModel } from "../../shared/models/shortcut.model";
import { ElectronIpcEvent } from "../../shared/models/electron-ipc-events";
import { executeCode, onNavigate } from "../code/code-executer.util";
import { registerCodePlayerHandler } from "./electron-ipc-handlers";
import { execCommands } from "@/lib/command-execute";
export let versionInfo: any = null;
let isInitialized = false;
const ElectronMarkHandlerComponent: React.FC = () => {
  const { dispatch, state } = useAppContext();

  useEffect(() => {
    if (isInitialized) return;

    isInitialized = true;

    ipcRenderer.on(ElectronIpcEvent.LOG, (_, arg) => {
      console.log("LOG", arg);
    });

    ipcRenderer.on(ElectronIpcEvent.INITAL_STATE, (_, arg) => {
      dispatch(arg);
    });

    ipcRenderer.on(ElectronIpcEvent.NAVIGATE, (_, arg) => {
      onNavigate(arg);
    });

    addCodeEditorListener((req) => {
      ipcRenderer.send(ElectronIpcEvent.OPEN_EDITOR, req);
    });
    registerCodePlayerHandler(async (req) => {
      try {
        const result = await executeCode(req.code, {
          actionState: req.actionState,
          input: req.input,
        });

        ipcRenderer.send(ElectronIpcEvent.CODE_EXEC_RESULT, {
          result,
          requestId: req.requestId,
        });
      } catch (e) {
        alert("Error: " + e.message);
        ipcRenderer.send(ElectronIpcEvent.CODE_EXEC_RESULT, { error: e });
      }
    });

    ipcRenderer.once(ElectronIpcEvent.VERSION_INFO, (_, arg) => {
      versionInfo = arg;
    });
  }, []);

  useEffect(() => {
    if (state?.shortcuts != null) {
      addElectronShortcutHandler(state.shortcuts);
    }
  }, [state?.shortcuts]);

  function addElectronShortcutHandler(shortcuts: ShortCutModel[]) {
    shortcuts.forEach((shortCutData) => {
      ipcRenderer.removeAllListeners(
        `${ElectronIpcEvent.CODE_RESULT}${shortCutData.id}`
      );
      ipcRenderer.on(
        `${ElectronIpcEvent.CODE_RESULT}${shortCutData.id}`,
        async (_, args) => {
          if (shortCutData.cmdIds) {
            const commands = shortCutData.cmdIds
              .map((id) => state.commands.find((t) => t.id === id))
              .filter((t) => t != null);
            await execCommands(args, commands, false);
          }
        }
      );
    });
  }

  return null;
};

export default ElectronMarkHandlerComponent;

export function openCodeEditor(req) {
  nav(req);
}
let nav: any;
export function addCodeEditorListener(func: any) {
  nav = func;
}
