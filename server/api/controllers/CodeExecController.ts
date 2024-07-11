import { JsonController, Post, Body, HttpError } from 'routing-controllers';
import { Service } from 'typedi';
import { CodeExecService } from '../services/exec-code';

@Service()
@JsonController('/code')
export class CodeExecController {

    constructor(private service: CodeExecService) { }

    @Post('/exec')
    public async execCode(@Body() request: { code: string, params?: any }): Promise<any> {
        try {
            const result = await this.service.exec(request.code, request.params ?? {});
            return result;
        } catch (err) {
            throw new HttpError(500, err);
        }
    }
}