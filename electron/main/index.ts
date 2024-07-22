import { app, BrowserWindow, globalShortcut, ipcMain, screen, shell, protocol } from 'electron'
import { join } from 'node:path'
import { update } from './update'
import { spawn } from 'node:child_process';
import path from "path";
import { addUpdateAppStateHandler, saveAppStateElectron } from '../handlers/state.handler';
import { addCodeExecuterHandler, removeBlutListener } from './electron-code-executer';
import { AppStateModel } from '../../shared/models/app-state.model';
import { ElectronIpcEvent } from '../../shared/models/electron-ipc-events';
import { addShortcutHandlerKeyListner } from '../handlers/shortcut-handler';
import { startExternalCodeServer, stopExternalCodeServer } from './external-code-server';
import { getScreenSize } from './utils';
import { clearAreasE } from '../code-functions/mark-areas.functon';
import { clearContentPos } from '../code-functions/display-content-pos.function';
import { Readable } from 'node:stream';
import { getPublicPath, getResourcesPath } from '../../shared/utils/resources';
import { waitForAllPermissions } from './mac-permissions';
import * as dotenv from 'dotenv';
dotenv.config();

process.env.DIST_ELECTRON = join(__dirname, '../')
process.env.DIST = join(process.env.DIST_ELECTRON, '../dist')
process.env.ELECTRON_USER_PATH = app.getAppPath()
let expressAppProcess: any;

let currAppWidth = [110, 110];
let posBeforeCollapse;
export let isAppCollapsed = false;
const appName = app.getPath("exe");

let expressPath;
if (process.env.NODE_ENV !== 'development') {
  expressPath = path.join(`${getResourcesPath()}/app.asar`, 'dist-electron/server/express-app.js');
}
export let canClick = true;
let externalWindows = [];

// Set application name for Windows 10+ notifications
if (process.platform === 'win32') app.setAppUserModelId(app.getName())

if (!app.requestSingleInstanceLock()) {
  app.quit()
  process.exit(0)
}

export let latestState: AppStateModel | null = null;
export let mainWindow: BrowserWindow | null = null
export let editorWindow: BrowserWindow | null = null
export let curorWindow: BrowserWindow | null = null
const url = process.env.VITE_DEV_SERVER_URL

const indexHtml = join(process.env.DIST, 'index.html')

function startExpressServer() {

  if (!expressPath) return;


  expressAppProcess = spawn(appName, [expressPath], {
    env: {
      ELECTRON_RUN_AS_NODE: "1",
      ELECTRON_USER_DATA_PATH: app.getPath("userData")
    },
  } as any);

  mainWindow!.webContents.send(ElectronIpcEvent.LOG, `Starting express server with path: ${expressPath}`);

  log(expressAppProcess.stdout);
  log(expressAppProcess.stderr);
}

function safeStringify(obj1: any) {
  return (obj1 != null ? JSON.stringify(obj1) : "");
}

function addShortcuthandlers(state?: AppStateModel) {
  if (!state?.shortcuts || safeStringify(latestState?.shortcuts) == safeStringify(state.shortcuts)) return;

  globalShortcut.unregisterAll();

  globalShortcut.register('F1', () => {
    mainWindow.webContents.openDevTools()
  })

  addShortcutHandlerKeyListner(state.shortcuts);
}

export function closeCursorWindow() {
  curorWindow?.close();
}

export async function openExternalShell(filePathOrUrl: string) {
  filePathOrUrl = decodeURI(filePathOrUrl);
  await shell.openExternal(filePathOrUrl);
}

export function openExternalWindow(filePathOrContent: string, options?: {
  browserWindowOptions?: Electron.BrowserWindowConstructorOptions,
  position?: { x: number, y: number },
  size?: { width: number, height: number },
  bringToFront?: boolean
  focus?: boolean,
  asFile?: string,
  inShell?: boolean,
  code: string
}) {

  if (options?.inShell) {
    openExternalShell(filePathOrContent);
    return;
  }

  const externalWindow = new BrowserWindow({
    title: 'rawen-external',
    icon: join(getPublicPath(), 'favicon.ico'),
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      webSecurity: false,
      experimentalFeatures: true
    },
    ...options?.browserWindowOptions
  })

  if (options?.asFile) {
    if (filePathOrContent.startsWith("http")) {
      externalWindow.loadURL(filePathOrContent)
    } else {
      externalWindow.loadFile(filePathOrContent)
    }
  } else {
    externalWindow.loadFile(join(getPublicPath(), 'templates/tailwind-basic.html'))
  }

  if (options?.position) {
    externalWindow.setPosition(options.position.x, options.position.y);
  }

  if (options?.size) {
    externalWindow.setSize(options.size.width, options.size.height);
  }

  if (options?.bringToFront) {
    externalWindow.setAlwaysOnTop(true, "floating");
  }

  if (options?.focus) {
    externalWindow.focus();
  }

  externalWindow.on('close', () => {
    externalWindows = externalWindows.filter(w => w !== externalWindow);
  });

  externalWindows.push(externalWindow);

  externalWindow.webContents.on('did-finish-load', () => {

    if (!options?.asFile) {
      const stateJSON = JSON.stringify(filePathOrContent);
      externalWindow.webContents.executeJavaScript(`
         document.body.innerHTML = ${stateJSON}
      `);
    }

    if (options?.code) {
      externalWindow.webContents.executeJavaScript(options.code, true);
    }
  });
}

export function openFollowingWindow(content) {
  if (curorWindow != null) {
    curorWindow.close();
  }

  curorWindow = new BrowserWindow({
    title: 'rawen-cursor',
    autoHideMenuBar: true,
    frame: false,
    focusable: false,
    transparent: true,
    alwaysOnTop: true,
    icon: join(getPublicPath(), 'favicon.ico'),
    webPreferences: {
      nodeIntegration: true,
      nodeIntegrationInSubFrames: true,
      nodeIntegrationInWorker: true,
      contextIsolation: false
    },
  })
  curorWindow.setAlwaysOnTop(true, "pop-up-menu");

  curorWindow.loadFile(join(getPublicPath(), 'templates/tailwind-basic.html'))

  curorWindow.setIgnoreMouseEvents(true);
  const intervall = setInterval(() => {
    if (curorWindow == null) {
      clearInterval(intervall);
      return;
    };

    let { x, y } = screen.getCursorScreenPoint();
    let currentDisplay = screen.getDisplayNearestPoint({ x, y });
    curorWindow.setPosition(x - currentDisplay.bounds.x + 32, y - currentDisplay.bounds.y + 20);
  }, 10);

  curorWindow.webContents.on('did-finish-load', () => {
    let stateJSON = JSON.stringify(content);
    curorWindow.webContents.executeJavaScript(`
    document.body.innerHTML = ${stateJSON}

    setTimeout(() => {
        feather.replace();
    }, 250);
    `);
  });

  curorWindow.on('close', () => {
    clearInterval(intervall);
    curorWindow = null;
  });
}


export function registerProtocol() {
  const customProtocol = 'rawenapp';
  app.setAsDefaultProtocolClient(customProtocol);
  protocol.registerSchemesAsPrivileged([
    { scheme: customProtocol, privileges: { secure: true, standard: true, bypassCSP: true, supportFetchAPI: true } }
  ])
}

async function createWindow() {
  mainWindow = new BrowserWindow({
    title: 'rawen',
    autoHideMenuBar: true,
    width: 400,
    height: 550,
    frame: false,
    alwaysOnTop: true,
    icon: join(getPublicPath(), 'favicon.ico'),
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      experimentalFeatures: true,
      allowRunningInsecureContent: true,
      autoplayPolicy: 'no-user-gesture-required',
      webSecurity: false
    },
  })
  mainWindow.setAlwaysOnTop(true, "pop-up-menu");

  addUpdateAppStateHandler(mainWindow, (state) => {
    addShortcuthandlers(state);
    latestState = state;
  });

  if (url) {
    await mainWindow.loadURL(url)
  } else {
    await mainWindow.loadFile(indexHtml)
  }

  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: 'deny' };
  });

  startExpressServer();
  startExternalCodeServer();
  addCodeExecuterHandler();

  //MAC OS ask permission
  setTimeout(() => {
    if (process.platform === 'darwin') {
      console.log("Waiting for permissions");
      waitForAllPermissions();
    }
  }
    , 3000);
  // checkOllama();

  ipcMain.on(ElectronIpcEvent.OPEN_EXTERNAL_WINDOW, (_, args) => {
    openExternalWindow(args.filePath, args.options);
  });

  ipcMain.on(ElectronIpcEvent.SET_CAN_CLICK, (_, args) => {
    canClick = args
  });

  currAppWidth = mainWindow.getSize();
  ipcMain.on(ElectronIpcEvent.COLLAPSE_APP, (_, { isCollapsed, width, height, position, placement }) => {
    isAppCollapsed = isCollapsed;
    collapseApp({ isCollapsed, width, height, position, placement });
  });

  // Apply electron-updater
  update(mainWindow)
}

registerProtocol();
app.whenReady().then(createWindow)

app.on('before-quit', async () => {
  if (latestState) {
    saveAppStateElectron(latestState);
  }

  if (expressAppProcess) {
    expressAppProcess.kill("SIGINT");
  }

  stopExternalCodeServer();

  mainWindow = null
  editorWindow = null
  curorWindow = null

  clearAreasE();
  clearContentPos();

  externalWindows.forEach(w => w.close());
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})

export function collapseApp(options: { isCollapsed: boolean, width?: number, height?: number, position?: { x: number, y: number }, placement?: "RIGHT" }) {
  const isCollapsed = options.isCollapsed;
  const collapsedWidth = options.width ?? 66;
  const collapsedHeight = options.height ?? 66;
  removeBlutListener();
  mainWindow.setAlwaysOnTop(true, "pop-up-menu");


  if (isCollapsed) {
    currAppWidth = mainWindow.getSize();
  }

  mainWindow.setSize(isCollapsed ? collapsedWidth : currAppWidth[0], isCollapsed ? collapsedHeight : currAppWidth[1]);
  // position to right to the mouse pos
  const mousePos = { x: mainWindow.getPosition()[0], y: mainWindow.getPosition()[1] };

  if (!isCollapsed) {
    posBeforeCollapse = { x: mousePos.x, y: mousePos.y };
    let newCalcX = mousePos.x - currAppWidth[0] + collapsedWidth;
    let newCalcY = mousePos.y - currAppWidth[1] + collapsedHeight;

    if (newCalcX < 0) {
      newCalcX = 0;
    }

    if (newCalcY < 0) {
      newCalcY = 0;
    }

    mainWindow.setPosition(newCalcX, newCalcY);
    mainWindow.webContents.send(ElectronIpcEvent.FOCUS);
  } else {
    const pos = posBeforeCollapse ? posBeforeCollapse : mousePos;

    if (options.placement == "RIGHT") {
      const { width, height } = getScreenSize();
      mainWindow.setPosition(width - collapsedWidth - 36, height - collapsedHeight - 90);
      return;
    }

    if (options.position) {
      mainWindow.setPosition(options.position.x, options.position.y);
      return;
    }

    mainWindow.setPosition(pos.x - collapsedWidth + collapsedWidth, pos.y - collapsedHeight + collapsedHeight);
  }

  mainWindow.setResizable(!isCollapsed);
}

function log(x: Readable | string) {
  if (x instanceof Readable) {
    x.on("data", function (data: any) {
      data
        .toString()
        .split("\n")
        .forEach((line: string) => {
          if (line !== "") {
            let serverLogEntry = line.replace(
              /[\u001b\u009b][[()#;?]*(?:[0-9]{1,4}(?:;[0-9]{0,4})*)?[0-9A-ORZcf-nqry=><]/g,
              ""
            );
            mainWindow!.webContents.send(ElectronIpcEvent.LOG, serverLogEntry);
          }
        });
    });
  } else {
    mainWindow!.webContents.send(ElectronIpcEvent.LOG, x);
  }
}