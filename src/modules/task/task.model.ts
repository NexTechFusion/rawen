
export interface TaskModel {
    id: string;
    name: string;
    promptFormat?: string;
    vectorStores?: VectorStoreSettingsModel[]
    llmEndpointId?: string;
    postCode?: string;
    preCode?: string;
}

export interface VectorStoreSettingsModel {
    isLocal: boolean;
    endpointId?: string;
}

export interface ExecExternalCodeModel {
    code: string;
    requestId: string;
    actionState?: any;
    input?: string;
}