import { ActionModel } from "./action.model";

export interface CommandModel {
    id: string;
    name: string;
    description: string;
    actions: ActionModel[];
    isDefault?: boolean;
    isTool?: boolean;
    asFollowUp?: boolean;
    publisher?: CommandPublisher;
}

export interface CommandPublisher {
    name: string;
    img?: string;
    info?: string;
}