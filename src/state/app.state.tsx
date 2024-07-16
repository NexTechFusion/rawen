import { AppStateModel, LlmResultModel } from '../../shared/models/app-state.model';
import React, { SetStateAction, createContext, useContext, useEffect, useState } from 'react';
import { getConvoId } from '@/lib/utils';
import { updateStateElectron } from '@/electron/electron-ipc-handlers';

export let appState: AppStateModel = null;

export let isInitialized = false;
export const AppContext = createContext<{
    state: AppStateModel;
    dispatch: React.Dispatch<SetStateAction<Partial<AppStateModel>>>;
}>({
    state: {} as any,
    dispatch: () => { },
});
const storageKey = "ui-theme";
type Theme = "dark" | "light" | "system"

export const AppProvider = ({ children }) => {
    const [state, dispatch] = useState<AppStateModel>(undefined);

    const [theme, setTheme] = useState<Theme>(
        () => (localStorage.getItem(storageKey) as Theme) || "dark"
    )

    useEffect(() => {
        const root = window.document.documentElement

        root.classList.remove("light", "dark")

        if (theme === "system") {
            const systemTheme = window.matchMedia("(prefers-color-scheme: dark)")
                .matches
                ? "dark"
                : "light"

            root.classList.add(systemTheme)
            return
        }

        root.classList.add(theme)
    }, [theme])

    useEffect(() => {
        if(state == null) return;

        console.log("STATE CHANGED", state);
        updateStateElectron(state);
    }, [state]);

    useEffect(() => {
        if (isInitialized) return;

        isInitialized = true;

        const element = document.getElementById('app-loading-style')
        element.parentNode.removeChild(element);

        addChangeStateListener((state) => {
            checkForResultChange(state?.llmResults ?? []);
            dispatch(state);
        });
    }, []);

    function checkForResultChange(newResults) {
        const currentLlmResult = appState?.llmResults?.find(r => r.convoId == getConvoId())?.results ?? [];
        const newllmResult = newResults?.find(r => r.convoId == getConvoId())?.results ?? [];

        if (newllmResult.length > 0) {
            const isEq = JSON.stringify(currentLlmResult) == JSON.stringify(newResults);
            if (!isEq) {
                changedResults(currentLlmResult);
            }
        }
    }

    useEffect(() => {
        appState = state;
    }, [state]);

    return (
        <>
            <AppContext.Provider value={{ state, dispatch }}>{children}</AppContext.Provider>
        </>
    );
};

export const useAppContext = () => useContext(AppContext);

export function changeState(state: AppStateModel) {
    changeStateCallback(state);
}

let changeStateCallback: any;
export function addChangeStateListener(func: any) {
    changeStateCallback = func;
}


export function changedResults(state: LlmResultModel[]) {
    if (changeResultCallback == null) {
        return;
    }
    changeResultCallback(state);
}

let changeResultCallback: any;
export function addResultChangedListener(func: any) {
    changeResultCallback = func;
}