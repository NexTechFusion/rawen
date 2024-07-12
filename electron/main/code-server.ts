import express from 'express';
import bodyParser from 'body-parser';
import { ipcMain } from 'electron';
import { ElectronIpcEvent } from '../../shared/models/electron-ipc-events';
import { mainWindow } from '.';
import { CODE_SERVER_PORT } from '../../config';
import cors from 'cors';

let server: any = null;
const app: express.Application = express();
const PORT = CODE_SERVER_PORT;

export function startExternalCodeServer() {
    // allow cors any 
    app.use(cors({
        origin: '*'
    }));

    app.use(bodyParser.urlencoded({ extended: true }));
    app.use(bodyParser.json({ limit: '2500mb' }));

    const listeners = new Map();

    function waitUntilFinish(requestId) {
        return new Promise((resolve, reject) => {
            const listener = (_, result) => {
                if (result.requestId === requestId) {
                    resolve(result.result);
                    ipcMain.removeListener(ElectronIpcEvent.CODE_EXEC_RESULT, listener);
                    listeners.delete(requestId);
                }
            };
            ipcMain.on(ElectronIpcEvent.CODE_EXEC_RESULT, listener);
            listeners.set(requestId, listener);
        });
    }

    app.post('/execute', async (req, res) => {
        try {
            const requestId = Math.random().toString(36).substring(7); //random id;
            mainWindow.webContents.send(ElectronIpcEvent.CODE_EXEC, { ...req.body, requestId });
            const result: any = await waitUntilFinish(requestId);

            if (result?.error) {
                console.error(result.error);
                return res.status(400).send({ error: result.error });
            }

            return res.send({ result });
        } catch (error) {
            console.error(error);
            return res.status(400).send({ error: error.message });
        }
    });

    server = require('http').Server(app);
    server.listen(PORT, () => {
        console.log(`Code exec server listening on port ${PORT}`);
    });
}

export function stopExternalCodeServer() {
    if (server) {
        server.close(() => {
            console.log('Server terminated');
        });
    } else {
        console.log('Server not running');
    }
}