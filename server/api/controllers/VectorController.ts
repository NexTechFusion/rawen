import { JsonController, Post, Body, HttpError, Param, UploadedFiles } from 'routing-controllers';
import { Service } from 'typedi';
import { ICallRequest } from '../../../shared/models/call.request.model';
import { SettingsModel } from '../../../shared/models/settings.model';
import { getDocs, getDocsbyFileName, getEmbedding, remove, retrive } from '../../../scripts/local-lancedb.store';
import { FileTrainerService } from '../services/files-trainer.service';
import { getSimilarity } from '../../../scripts/transformer-wrapper';

@Service()
@JsonController('/vector')
export class VectorController {
    constructor(private readonly trainService: FileTrainerService) { }

    @Post('/call')
    public async call(@Body() request: ICallRequest): Promise<DocumentData[]> {
        try {
            const response = await retrive({
                query: request.prompt,
                table: request.config?.storeId ?? 'global',
                limit: request.topK ?? 3,
                where: request.options?.where,
                filter: request.options?.filter,
            });

            return response as any;
        } catch (err) {
            console.error(err);
            throw new HttpError(500, err);
        }
    }

    @Post('/content/:fileName')
    public async getContentOfFile(@Param("fileName") fileName: string, @Body() config: SettingsModel): Promise<any[]> {
        try {
            const response = await getDocsbyFileName(fileName, config);
            return response;
        } catch (err) {
            console.error(err);
            throw new HttpError(500, err);
        }
    }

    @Post('/info')
    public async getStoreInfo(@Body() config: SettingsModel): Promise<any> {
        try {
            const response = await getDocs(config);
            return response;
        } catch (err) {
            console.error(err);
            throw new HttpError(500, err);
        }
    }

    @Post('/delete')
    public async deleteById(@Body() req: { id: string, config: SettingsModel }): Promise<any> {
        try {
            await remove({
                table: req?.config?.storeId ?? 'global',
                filter: "id IN ('" + req.id + "')"
            });
            return true;
        } catch (err) {
            console.error(err);
            throw new HttpError(500, err);
        }
    }

    @Post('/update')
    public async updateById(@Body() req: { config: SettingsModel, data: any }): Promise<any> {
        try {
            await this.trainService.retrain(req.data, req.config);
            return true;
        } catch (err) {
            console.error(err);
            throw new HttpError(500, err);
        }
    }

    @Post('/embedding')
    public async getEmbedding(@Body() req: { texts: string[], model?: any }): Promise<any> {
        try {
            const result = await getEmbedding(req.texts, req.model);
            return { result };
        } catch (err) {
            console.error(err);
            throw new HttpError(500, err);
        }
    }


    @Post('/similar')
    public async getSimilartiy(@Body() req: { text1: string, text2: string | string[], model?: any }): Promise<any> {
        try {
            const result = await getSimilarity(req.text1, req.text2, req.model);
            return { result };
        } catch (err) {
            console.error(err);
            throw new HttpError(500, err);
        }
    }

}

export interface DocumentData {
    pageContent: string;
    metadata: GeneralDocumentData;
}

export interface GeneralDocumentData {
    id: string;
    date: string;//ISO
    file_path?: string;
    file_page_number?: number;
    file_page_lines_from?: number;
    file_page_lines_to?: number;
    file_total_pages?: number;
}

export interface LanceDocumentData extends GeneralDocumentData {
    pageContent: string;
}