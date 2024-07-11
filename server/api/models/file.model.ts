export interface FileModel {
    fieldname: string,
    originalname: string,
    encoding: string,
    mimetype: string,
    size: number;
    buffer: Buffer;
    path: string;
}