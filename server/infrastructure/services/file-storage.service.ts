import { Service } from "typedi";
import fs from 'fs';

@Service()
export class FileStorageService {

    public saveToFile(path: string, obj: any) {
        try {
            fs.writeFileSync(path, JSON.stringify(obj));
        } catch (e) {
            console.log(e);
        }
    }

    public appendToFile(path: string, objs: any[]) {
        try {
            const result = JSON.parse(fs.readFileSync(path, 'utf8'));
            result.push(...objs);

            fs.writeFileSync(path, JSON.stringify(result));
        } catch (e) {
            console.log(e);
        }
    }

    public readFromFile(path: string) {
        try {
            return JSON.parse(fs.readFileSync(path, 'utf8'));
        } catch (e) {
            console.log(e);
        }
    }

    public createFileIfNotExists(path: string, content: string) {
        try {
            if (!fs.existsSync(path)) {
                fs.writeFileSync(path, content);
            }
        } catch (e) {
            console.log(e);
        }
    }

    public load(path: string) {
        try {
            const result = JSON.parse(fs.readFileSync(path, 'utf8'));
            return result;
        } catch (e) {
            console.log(e);
        }
    }

    public save(path: string, content: any) {
        try {
            fs.writeFileSync(path, JSON.stringify(content));
        } catch (e) {
            console.log(e);
        }
    }
}