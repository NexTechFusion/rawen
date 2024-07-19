import axios from 'axios'
import os from 'os'
import path from 'path'
import fs from 'fs'
import { exec } from 'child_process'
import { app } from 'electron'
import { platform } from 'process'
export const downloadDirectory = app.getPath('downloads')

type binary = {
    name: string
    url: string
}

const binaries = {
    win32: {
        name: 'OllamaSetup.exe',
        url: 'https://github.com/ollama/ollama/releases/download/v0.1.44/OllamaSetup.exe'
    },
    darwin: {
        name: 'ollama-darwin',
        url: 'https://github.com/ollama/ollama/releases/download/v0.1.45/Ollama-darwin.zip'
    },
    linux: {
        name: 'ollama-linux',
        url: 'https://github.com/ollama/ollama/releases/download/v0.1.44/ollama-linux-arm64'
    }
}

export async function checkOllama(): Promise<void> {
    const isInstalled = await isOllamaInstalledAndRunning();
    console.log('Ollama is:', isInstalled ? 'installed' : 'not installed');
    //display not
    try {
        if (!isInstalled) {
            const downloadStatus = await downloadBinaries()
            if (downloadStatus == 'success') {
                if (os.platform() == 'linux') {
                    await installOllamaLinux()
                }

                const result = await installingOllama();

                if (result) {
                    console.log('Ollama installed successfully');
                    const isRunning = await isOllamaInstalledAndRunning();
                    console.log('Ollama is:', isRunning ? 'running' : 'not running');
                }
            }
        }
    } catch (error) {
        console.log('Ollama Error:', error)
    }
}

export function isOllamaInstalledAndRunning(): Promise<boolean> {
    return new Promise((resolve) => {
        exec('ollama serve', (error) => {
            const ollamaAlreadyRunning = error?.message.includes(`listen tcp`)
            const ollamaNotInstalled =
                error?.message.includes(`not found`) ||
                error?.message.includes(`not recognized`) ||
                error?.message.includes(`not internal`) ||
                error?.message.includes(`not an internal`)

            if (ollamaNotInstalled) {
                resolve(false)
            } else if (ollamaAlreadyRunning) {
                resolve(true)
            } else {
                resolve(true)
            }
        })
    })
}

function dir(): string {
    const operatingSystem = os.platform()
    switch (operatingSystem) {
        case 'darwin':
            return path.join(downloadDirectory, 'LLocal', 'binaries')
        case 'win32':
            return path.join(os.homedir(), 'AppData', 'Roaming', 'LLocal', 'binaries')
        default:
            return path.join(downloadDirectory, 'LLocal', 'Binaries')
    }
}

export function binaryPath(binary: string): string[] {
    const val: binary = binaries[binary]
    const directory = dir()
    const binaryDirectory = path.resolve(directory, val.name)
    return [binaryDirectory, binaryDirectory.replace(/\s/g, '^ ')]
}

export async function downloadBinaries(): Promise<string> {
    const operatingSystem = os.platform()

    const binary: binary = binaries[operatingSystem]
    if (!binary) return 'Not availble for this platform'

    const directory = dir()
    let binaryDirectory = ''
    if (operatingSystem == 'darwin' || operatingSystem == 'linux') {
        binaryDirectory = path.join(directory, `${binary.name}.zip`)
    } else {
        binaryDirectory = path.join(directory, binary.name)
    }

    if (!fs.existsSync(directory)) fs.mkdirSync(directory, { recursive: true })

    if (fs.existsSync(binaryDirectory)) return 'exists'

    let filePath = ''
    if (operatingSystem == 'darwin' || operatingSystem == 'linux') {
        filePath = path.resolve(directory, `${binary.name}.zip`)
    } else {
        filePath = path.resolve(directory, binary.name)
    }

    try {
        const writer = fs.createWriteStream(filePath)
        const response = await axios.get(binary.url, { responseType: 'stream' })
        await new Promise<void>((resolve, reject) => {
            response.data.pipe(writer)
            writer.on('finish', resolve)
            writer.on('error', reject)
        })
        return 'success'
    } catch (error) {
        return 'error'
    }
}

export async function installOllamaLinux(): Promise<string> {
    return new Promise((resolve) => {
        exec('gnome-terminal -- bash -c "curl -fsSL https://ollama.com/install.sh | sh; exec bash"', (error) => {
            if (error == null) {
                resolve('linux-detected')
            } else {
                resolve('download-failed')
            }
        })
    })
}

async function installingOllama(): Promise<boolean> {
    return new Promise((resolve) => {
        if (platform == 'darwin') {
            const extractDirectory = path[1].replace('/ollama-darwin', '')
            exec(`unzip ${path[1]}.zip -d ${extractDirectory} && chmod +x ${extractDirectory}/Ollama.app && ${extractDirectory}/Ollama.app/Contents/MacOS/Ollama`, (error) => {
                if (error == null) {
                    resolve(true)
                } else {
                    resolve(false)
                }
            })
        }
        else {

            exec(path[1], (error) => {
                if (error == null) {
                    resolve(true)
                } else {
                    resolve(false)
                }
            })
        }
    })
}