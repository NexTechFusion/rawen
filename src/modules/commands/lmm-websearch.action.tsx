import React, { useState } from "react";
import { LmmRequestActionModel } from "../../../shared/models/action.model";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { useAppContext } from "@/state/app.state";
import { Textarea } from "@/components/ui/textarea";
import { DefaultLlmSetting } from "../../../shared/models/settings.model";

interface PanelProps {
    model: LmmRequestActionModel;
    modelChange: (model: LmmRequestActionModel) => void;
}

const LmmWebsearchActionPanel: React.FC<PanelProps> = ({ model, modelChange }) => {
    const { state } = useAppContext()

    const [panelState, setPanelState] = useState<LmmRequestActionModel>(model);

    const updateEndpoint = (endpointId: string) => {
        const newState = { ...panelState, endpointId };
        setPanelState(newState);
        modelChange(newState);
    }

    const updatePromptFormat = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        const newState = { ...panelState, promptFormat: e.target.value };
        setPanelState(newState);
        modelChange(newState);
    }

    return <>
        <div className="mt-2">AI Websearch<span className="text-xs">*</span></div>
        <Select defaultValue={model.endpointId} onValueChange={(e) => updateEndpoint(e)}>
            <SelectTrigger>
                <SelectValue placeholder="Select model" />
            </SelectTrigger>
            <SelectContent>
                <SelectItem key={DefaultLlmSetting.OPENAI} value={DefaultLlmSetting.OPENAI}>OpenAI</SelectItem>
            </SelectContent>
        </Select>

        <div className="mt-4">Pre-Prompt Format <span className="text-xs">(optional)</span></div>
        <Textarea
            name="promptFormat"
            rows={20}
            placeholder="{{INPUT}}"
            defaultValue={panelState.promptFormat}
            onChange={updatePromptFormat}
        />
    </>
}

export default LmmWebsearchActionPanel;


