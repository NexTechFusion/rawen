import React, { useState } from "react";
import {
  DefaultLLMActionModel,
  LmmRequestActionModel,
} from "../../../shared/models/action.model";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DefaultLlmSetting } from "../../../shared/models/settings.model";

interface PanelProps {
  model: DefaultLLMActionModel;
  modelChange: (model: DefaultLLMActionModel) => void;
}

const DefaultLmmActionPanel: React.FC<PanelProps> = ({
  model,
  modelChange,
}) => {
  const [panelState, setPanelState] = useState<LmmRequestActionModel>(model);

  const selectable = [
    DefaultLlmSetting.OLLAMA,
    DefaultLlmSetting.OPENAI,
    DefaultLlmSetting.GOOGLE,
  ];

  const updateEndpoint = (endpointId: string) => {
    const newState = { ...panelState, endpointId };
    setPanelState(newState);
    modelChange(newState);
  };

  return (
    <>
      <div className="mt-2">
        AI Text-Generation<span className="text-xs">*</span>
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
    </>
  );
};

export default DefaultLmmActionPanel;
