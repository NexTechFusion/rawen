import path from "path";

export function getPublicPath(): string {
    if (process.env.NODE_ENV === 'development') {
        return 'public';
    } else {
        console.log('resources path:', getResourcesPath());
        return path.join(getResourcesPath(), 'public');
    }
}

export function getResourcesPath(): string {
    return path.join((process as any).resourcesPath || path.dirname(__dirname) + "/resources");
}