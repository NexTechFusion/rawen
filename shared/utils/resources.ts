import path from "path";

export function getPublicPath(): string {
    if (process.env.NODE_ENV === 'development') {
        return 'public';
    } else {
        return path.join("resources", 'public');
    }
}