import { JsonController, Post, Body, HttpError, UploadedFiles, Param } from 'routing-controllers';
import { Service } from 'typedi';
import { FileTrainerService } from '../services/trainers/files-trainer.service';
import { SuccessResponse, asSuccess as Ok } from '../models/success-response';
import { WebsiteTrainerService } from '../services/trainers/website-trainer.service';
import { KeyValueSettings } from '../../../shared/models/app-state.model';

@Service()
@JsonController('/trainer')
export class TrainerController {

    constructor(
        private websiteTrainerService: WebsiteTrainerService,
        private trainerService: FileTrainerService) { }

    /**
     * Trains on input in the store.
     * @param request 
    */
    @Post('/trainInput')
    public async trainInput(@Body() request: { prompt: string, config: any }): Promise<SuccessResponse> {
        try {
            const name = request.config?.id || request.prompt.slice(0, 15);
            //ReferenceError: File is not defined
            // const textFile: any = new File([request.prompt], name + '.txt', { type: 'text/plain' });
            const textFile: any = {
                buffer: Buffer.from(request.prompt),
                mimetype: 'text/plain',
                originalname: name + '.txt',
                path: undefined,
            };

            const docs = await this.trainerService.parseFiles([textFile], request.config);
            await this.trainerService.ingestDocs(docs, request.config);
            return Ok();
        } catch (err) {
            console.log(err);
            throw new HttpError(500, err);
        }
    }

    /**
     * Trains on the provided files in the store.
     * @param request 
    */
    @Post('/trainFiles')
    public async trainFiles(@UploadedFiles('files', {
        options: {
            encoding: 'utf-8'
        }
    }) files: any[], @Body() req: any): Promise<any> {
        try {
            const config = req?.config && req.config != "undefined" ? JSON.parse(req.config) : undefined;
            const filePaths = req?.filePaths && req.filePaths != "undefined" ? JSON.parse(req.filePaths) : undefined;

            if (filePaths) {
                files = files.map((file, index) => {
                    const path = filePaths[index];
                    return {
                        ...file,
                        originalname: path?.key ?? file.originalname, // Workaround for encoding issue
                        path: path?.path,
                    };
                });
            }
            const docs = await this.trainerService.parseFiles(files, config);
            await this.trainerService.ingestDocs(docs, config);

            return docs;
        } catch (err) {
            console.log(err);
            throw err;
        }
    }

    /**
     * Trains to a website.
     * @param request 
     */
    @Post('/trainWebsite')
    public async trainWebsite(@Body() request: { url: string, maxDepth?: number, maxConcurrency?: number, keyValues: KeyValueSettings }): Promise<SuccessResponse> {
        try {
            await this.websiteTrainerService.trainWebsite(request.url, {
                maxDepth: request.maxDepth ?? 1,
                maxConcurrency: request.maxConcurrency ?? 120,
                keyValues: request.keyValues
            });
            return Ok();
        } catch (err) {
            throw new HttpError(500, err);
        }
    }



    /**
     * Trains on the provided files in the store.
     * @param request 
    */
    @Post('/parseFiles')
    public async parseFile(@UploadedFiles('files', {
        options: {
            encoding: 'utf-8'
        }
    }) files: any[], @Body() req: any): Promise<any> {
        try {
            const config = req?.config && req.config != "undefined" ? JSON.parse(req.config) : undefined;
            const filePaths = req?.filePaths && req.filePaths != "undefined" ? JSON.parse(req.filePaths) : undefined;

            if (filePaths) {
                files = files.map((file, index) => {
                    const path = filePaths[index];
                    return {
                        ...file,
                        originalname: path?.key ?? file.originalname, // Workaround for encoding issue
                        path: path?.path,
                    };
                });
            }
            const docs = await this.trainerService.parseFiles(files, config);
            return docs;
        } catch (err) {
            console.log(err);
            throw err;
        }
    }
}