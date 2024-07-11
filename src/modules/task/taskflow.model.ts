export interface MimicStore {
    id: string;
    description: string;
    events: EventStore[];
}

export interface EventStore extends EventStoreAnalyzed {
    index: number;
    explain?: string;
    scaleFactor?: number;
    window_title?: string;
    window_screenshot: Buffer;
    window_bounds?: { x: number, y: number, width: number, height: number };

    mouse_position?: { x: number, y: number };

    app_path?: string;
    underlyingText?: string;
    mouse_area_screenshot: Buffer;
    mouse_area_screenshot_small: Buffer;
    mouse_area_field?: Buffer;

    // Predictions by AI about the event
    prediction?: PredictionStore;

    //next event trigger flags
    isKeyboardEnter?: boolean;
    isMouseClick?: boolean;
    isMouseDoubleClick?: boolean;
    isOpenApp?: boolean;

    isExit?: boolean;
    isBlacklisted?: boolean; // if the window is blacklisted to prevent events

    keyboardTextReason?: string; // reason why the keyboard text is entered
    keyboardText?: string;
    keyboardEvents?: string[]; // in case of press of key combination like ctrl + c or ctrl + v etc
    mouseEvents?: MouseClickData[];

    isSearch?: boolean; // search on the current window for sth
}
export interface EventStoreAnalyzed {
    isUnclear?: boolean;
    isOptimized?: boolean;
    executeScript?: string;
}


interface PredictionStore {
    intention: string;
    isIcon: boolean;
    isInput: boolean;
    isButton: boolean;
    isLink: boolean;
    isCheckbox: boolean;
    isRadio: boolean;
    isSelect: boolean;
}

export interface MouseClickData {
    x: number;
    y: number;
    button: { LEFT: 1, RIGHT: 2, MIDDLE: 3 };
}