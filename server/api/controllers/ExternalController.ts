import { JsonController, Post, Body, HttpError } from 'routing-controllers';
import { Service } from 'typedi';
import { CommandModel } from '../../../shared/models/command.model';
import { KeyValueSetting, LllmEndpointModel } from '../../../shared/models/app-state.model';

@Service()
@JsonController('/external')
export class ExternalController {

    constructor() { }

    @Post('/code')
    public async execExternalCode(@Body() request: ExternalCodeRequest): Promise<boolean> {
        try {
            try {
                if (process.send) {
                    process.send({ type: 'external_code', data: request });
                }
            } catch (err) {
                console.log(err);
            }

            return true;
        } catch (err) {
            throw new HttpError(500, err);
        }
    }
}

export interface ReceiveCommandsRequrest {
    filePathsToDownload: string[];
    commands: CommandModel[];
    keyValueSettings?: KeyValueSetting[];
    endpoints?: LllmEndpointModel[];
}

interface ExternalCodeRequest {
    key: string;
    code: string;
}