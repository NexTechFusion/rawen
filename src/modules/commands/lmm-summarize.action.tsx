import React, { useState } from "react";
import { LmmRequestActionModel } from "../../../shared/models/action.model";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAppContext } from "@/state/app.state";
import { Textarea } from "@/components/ui/textarea";
import { DefaultLlmSetting } from "../../../shared/models/settings.model";

interface PanelProps {
  model: LmmRequestActionModel;
  modelChange: (model: LmmRequestActionModel) => void;
}

const LmmSummarzieActionPanel: React.FC<PanelProps> = ({
  model,
  modelChange,
}) => {
  const { state } = useAppContext();
  const selectable = [
    DefaultLlmSetting.OLLAMA,
    DefaultLlmSetting.OPENAI,
    DefaultLlmSetting.GOOGLE,
  ];

  const [panelState, setPanelState] = useState<LmmRequestActionModel>(model);

  const updateEndpoint = (endpointId: string) => {
    const newState = { ...panelState, endpointId };
    setPanelState(newState);
    modelChange(newState);
  };

  const updatePromptFormat = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newState = { ...panelState, promptFormat: e.target.value };
    setPanelState(newState);
    modelChange(newState);
  };

  return (
    <>
      <div className="mt-2">
        AI Summarize
        <span className="text-xs">
          * (Summarizes the given files or prompt)
        </span>
      </div>
      <Select
        defaultValue={model.endpointId}
        onValueChange={(e) => updateEndpoint(e)}
      >
        <SelectTrigger>
          <SelectValue placeholder="Select model" />
        </SelectTrigger>
        <SelectContent>
          {selectable.map((item) => (
            <SelectItem key={item} value={item}>
              {item}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <div className="mt-4">
        Pre-Prompt Format <span className="text-xs">(optional)</span>
      </div>
      <Textarea
        name="promptFormat"
        rows={20}
        placeholder="{{INPUT}}}"
        defaultValue={panelState.promptFormat}
        onChange={updatePromptFormat}
      />
    </>
  );
};

export default LmmSummarzieActionPanel;
