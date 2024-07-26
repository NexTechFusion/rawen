export interface ActionModel {
    id: string;
    type: ActionType;
}

export interface JsScripActionModel extends ActionModel {
    name: string;
}

export interface DefaultLLMActionModel extends ActionModel {
    endpointId?: string;
}

export interface LmmRequestActionModel extends ActionModel {
    endpointId?: string;
    promptFormat?: string | undefined | DefaultActions;
}

export interface VectorRequestActionModel extends ActionModel {
    endpointId?: string | DefaultActions; // against current files, local learned knowledge or remote endpoint API
    promptFormat?: string;
}

export type ActionType = "DefaultLLM" | "LmmWebsearch" | "LmmSummarize" | "LmmRequest" | "LmmDocsRequest" | "VectorRequest" | "CallJsScript" | DynamicActionType; // Display cursor info

export interface DynamicActionType {
    id: string;
    name: string;
    code: string;
    editableFields: EditableFields[];
}

export interface EditableFields {
    id: string;
    name: string;
    options?: string[];
    type: "Checkbox" | "Text" | "Number" | "Dropdown";
    value?: any;
    defaultValue?: any;
}

export enum DefaultActions {
    Chat = "Chat"
}
// async function openApp(options: { url: "#interact", width: 1024, height: 800, convoId, tasks: [], prompt, focus: true, bringToFront: true, preload: false }) {

export const DynamicActionTypes: DynamicActionType[] = [
    {
        id: "openWebsite",
        name: "Open website",
        code: "shellOpenExternal(url);",
        editableFields: [
            {
                id: "url",
                name: "URL",
                type: "Text"
            }
        ]
    },
    {
        id: "toggleCollapseApp",
        name: "Toggle collapse app",
        code: "toggleAppCollapse();",
        editableFields: []
    },
    {
        id: "endStream",
        name: "End stream",
        code: "endStream();",
        editableFields: []
    }
];