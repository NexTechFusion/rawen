export class InteractionState {
    static state = {} as InteractionStateModel;

    static updateState(state) {
        InteractionState.state = { ...InteractionState.state, ...state };
    }

    static getState() {
        return InteractionState.state;
    }

    static clearState() {
        InteractionState.state = {};
    }

    static clickInlineConfirm(btnId: string) {
        const funcs = InteractionState.state.inlineConfirms?.filter((c) => c.btn.id == btnId);
        if (funcs?.length > 0) {
            funcs.forEach((res) => {
                res.func(res.btn.index);
            });
        }
    }

    static waitForNextInput(func: (text: string) => void) {
        InteractionState.state = { ...InteractionState.state, nextInput: func };
    }

    static addInlineConfirm(btn: { text: string, classses: string, id: string, index: number }, func: (index: number) => void) {
        InteractionState.state.inlineConfirms = InteractionState.state.inlineConfirms ?? [];
        InteractionState.state.inlineConfirms.push({ btn, func });
    }
}

interface InteractionStateModel {
    inlineConfirms?: { btn: { text: string, classses: string, id: string, index: number }, func: (index: number) => void }[];
    nextInput?: (text: string) => void;
}