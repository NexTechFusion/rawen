import { Service } from "typedi";
import { mapToLanceModel, update } from '../../../../scripts/local-lancedb.store';
import { FileModel } from "../../models/file.model";
import { splitText, splitImage, splitPdf, splitXlsx, splitCsv } from "../../../../scripts/file-splitter.tool";
import { SettingsModel } from "../../../../shared/models/settings.model";

@Service()
export class FileTrainerService {

    public async retrain(req: IRetrainModel, config?: SettingsModel) {
        try {
            const docs = await splitText({ text: req.text, name: req.id, path: req.file_path, metaData: { ...(req.tags ? { tags: req.tags } : {}) } });
            await update({
                data: mapToLanceModel(docs),
                table: config?.storeId ?? 'global'
            });
        } catch (e) {
            console.log(e);
        }
    }

    public async parseFiles(files: FileModel[], config?: SettingsModel) {
        try {
            let docs: any[] = [];

            for (const file of files) {

                // png, jpg, bmp, pbm
                if (
                    file.mimetype.toLowerCase().includes('image') ||
                    file.originalname.toLowerCase().includes('.png') || file.originalname.toLowerCase().includes('.jpg') || file.originalname.toLowerCase().includes('.bmp') || file.originalname.toLowerCase().includes('.pbm')) {
                    const splitDocuments = await splitImage(file)
                    docs = [...docs, ...splitDocuments];
                    continue;
                }

                if (file.originalname.toLowerCase().includes('.xls')) {
                    const splitDocuments = await splitXlsx(file)
                    docs = [...docs, ...splitDocuments];
                    continue;
                }

                if (file.originalname.toLowerCase().endsWith('.pdf')) {
                    const splittedDocs = await splitPdf(file);
                    docs = [...docs, ...splittedDocs];
                    continue;
                }

                if (file.originalname.toLowerCase().endsWith('.csv') || file.mimetype.toLowerCase().includes('csv')) {
                    const splittedDocs = await splitCsv(file);
                    docs = [...docs, ...splittedDocs];
                    continue;
                }

                if (file.originalname.toLowerCase().includes('.txt')) {
                    const splitDocuments = await splitText({ text: file.buffer.toString(), name: file.originalname, path: file.path });
                    docs = [...docs, ...splitDocuments];
                    continue;
                }

            }

            return docs;
        } catch (e) {
            console.log('training failed');
            console.log(e);
        }
    }

    async ingestDocs(docs, config) {
        const data = mapToLanceModel(docs, config);
        const table = config?.storeId ?? 'global';

        console.log('training started', docs.length);
        await update({
            data,
            table,
        });
        console.log('training finished');
    }
}

export interface IRetrainModel {
    id: string;
    text: string;
    date: string;
    file_path: string;
    tags?: string;
}