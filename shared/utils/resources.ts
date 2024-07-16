import path from "path";

export function getPublicPath(): string {
    if (process.env.NODE_ENV === 'development') {
        return 'public';
    } else {
        console.log('Production path:', (process as any).resourcesPath);
        return path.join((process as any).resourcesPath || path.dirname(__dirname) + "/resources", 'public');
    }
}