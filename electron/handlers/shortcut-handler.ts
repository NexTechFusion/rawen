import { mainWindow } from '../main/index';
import { ElectronIpcEvent } from '../../shared/models/electron-ipc-events';
import { app, globalShortcut } from 'electron';
import { mapKeycodesToKeysElectron } from '../../shared/utils/keymap.util';
import { GlobalKeyboardListener } from "node-global-key-listener";

let keyboardListener;
let isDoingShortcut = false;
let pressedKeys = [];

export function addShortcutHandlerKeyListner(shortcuts) {
    if (keyboardListener) {
        keyboardListener.kill();
    }

    pressedKeys = [];
    isDoingShortcut = false;
    keyboardListener = new GlobalKeyboardListener();

    function checkShortCut() {
        shortcuts.forEach((shortcut) => {
            const shortcutKeysStr = shortcut.shortcut.join("+").toLowerCase();
            const pressedKeysStr = pressedKeys.join("+").toLowerCase();
            if (pressedKeysStr === shortcutKeysStr) {
                pressedKeys = [];
                mainWindow!.webContents.send(`${ElectronIpcEvent.CODE_RESULT}${shortcut.id}`, undefined);
            }
        });
    }

    keyboardListener.addListener((e, down) => {
        if (pressedKeys.includes(e.name) && e.state == "DOWN") {
            return;
        }

        if (e.state == "UP") {
            if (isDoingShortcut) {
                isDoingShortcut = false;
                checkShortCut();
            }

            pressedKeys = [];
            mainWindow!.webContents.send(ElectronIpcEvent.KEY_RELEASED, e.name);
        } else {
            isDoingShortcut = true;
            pressedKeys.push(e.name);
            mainWindow!.webContents.send(ElectronIpcEvent.KEY_PRESSED, e.name);

            setTimeout(() => {
                pressedKeys = pressedKeys.filter((key) => key !== e.name);
            }, 2000);
        }
    });

}

export function addElectronShortcuthandlers(shortcuts) {
    shortcuts.forEach((shortcut) => {
        const keymaps = mapKeycodesToKeysElectron(shortcut.shortcut);
        const keyStr = keymaps.length > 1 ? keymaps.join("+") : keymaps[0];
        try {
            globalShortcut.register(keyStr, async () => {
                mainWindow!.webContents.send(`${ElectronIpcEvent.CODE_RESULT}${shortcut.id}`, undefined);
            });
        } catch (err) {
            console.error(err);
        } finally {
        }
    });
}

