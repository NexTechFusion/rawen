import { JsonController, Post, Body, HttpError, Param } from 'routing-controllers';
import { Service } from 'typedi';
import { ICallRequest } from '../../../shared/models/call.request.model';
import { SettingsModel } from '../../../shared/models/settings.model';
import { ImageStoreModel, getAll, retriveImages, ingestImages, IngestImageRequest } from '../../../scripts/local-lancedb-iamge.store';
import { remove } from '../../../scripts/local-lancedb.store';
import * as fs from 'fs';

@Service()
@JsonController('/imageVector')
export class ImageVectorController {

    @Post('/call')
    public async call(@Body() request: ICallRequest): Promise<ImageStoreModel[]> {
        try {
            const response = await retriveImages(
                request.img,
                request.topK ?? 1,
                request.options?.filter,
                request.options?.where,
                undefined,
                request.config?.storeId ?? 'images'
            );

            return response as any;
        } catch (err) {
            console.error(err);
            throw new HttpError(500, err);
        }
    }

    @Post('/ingest')
    public async ingest(@Body() req: { images: IngestImageRequest[]; config: SettingsModel }): Promise<any> {
        try {
            const data = await ingestImages(req.images, req.config?.storeId ?? 'images');
            return data;
        } catch (err) {
            console.error(err);
            throw new HttpError(500, err);
        }
    }

    @Post('/info')
    public async getStoreInfo(@Body() config: SettingsModel): Promise<any> {
        try {
            const response = await getAll(config);
            return response;
        } catch (err) {
            console.error(err);
            throw new HttpError(500, err);
        }
    }

    @Post('/delete')
    public async deleteById(@Body() req: { id: string, imgPath: string, config: SettingsModel }): Promise<any> {
        try {
            if (req.imgPath) {
                fs.unlinkSync(req.imgPath);
            }

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
}