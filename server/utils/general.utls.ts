import { getPublicPath } from "../../shared/utils/resources";
import os from "os";
import path from "path";
import fs from "fs";

export function safeParse(jsonString: string): any {
    const jsonStartIndex = jsonString.indexOf('{');
    const jsonSubstring = jsonString.substring(jsonStartIndex);
    return JSON.parse(jsonSubstring);
}

export function getStorePath(storeId: string): string {
    return `${getPublicPath()}/stores/${storeId}`;
}


export function getUserDataDir(fallbackPath: string) {
    const baseDir = os.homedir();
    const paths = {
        win32: ['AppData', 'Local', 'Google', 'Chrome', 'User Data'],
        darwin: ['Library', 'Application Support', 'Google', 'Chrome'],
        linux: ['.config', 'google-chrome']
    };

    const pathSegments = paths[os.platform()];
    if (pathSegments) {
        const fullPath = path.join(baseDir, ...pathSegments);
        if (fs.existsSync(fullPath)) {
            return fullPath;
        }
    }

    return fallbackPath && fs.existsSync(fallbackPath) ? fallbackPath : null;
}

export function getOpenUrlCommand(url) {
    let openCommand;
    let args;
    switch (process.platform) {
        case 'darwin': // macOS
            openCommand = 'open';
            args = [url];
            break;
        case 'win32': // Windows
            openCommand = 'cmd';
            args = ['/c', 'start', url];
            break;
        default: // Linux and other Unix-like systems
            openCommand = 'xdg-open';
            args = [url];
            break;
    }

    return { openCommand, args };
}


export function clusterWords(words: any[]) {
    const merged = [];
    // words = words.filter(o => o.text.length < 100 && o.text.length > 3); // filter out long words and short words

    for (let word of words) {
        // plus minus 10 pixels on y and x not to be distant from each other
        const found = merged.find(o =>
            (o.bbox.y0 == word.bbox.y0 ||
                o.bbox.y0 - word.fontSize < word.bbox.y0 && o.bbox.y0 + word.fontSize > word.bbox.y0) &&
            o.bbox.x1 + word.fontSize > word.bbox.x0
        );

        if (found && !found.text.includes(word.text)) {
            found.text += " " + word.text;
            found.bbox.x1 = word.bbox.x1;
        } else {
            merged.push(word);
        }

        words = merged;
    }

    return words;
}