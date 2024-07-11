import React, { useState } from "react";
import {
  DefaultActions,
  VectorRequestActionModel,
} from "../../../shared/models/action.model";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAppContext } from "@/state/app.state";
import { Textarea } from "@/components/ui/textarea";

interface PanelProps {
  model: VectorRequestActionModel;
  modelChange: (model: VectorRequestActionModel) => void;
}

const VectorRequestActionPanel: React.FC<PanelProps> = ({
  model,
  modelChange,
}) => {
  const { state } = useAppContext();

  const [panelState, setPanelState] = useState<VectorRequestActionModel>(model);

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
      <div>
        Data-Endpoint <span className="text-xs">*</span>
      </div>
      <Select
        defaultValue={model.endpointId}
        onValueChange={(e) => updateEndpoint(e)}
      >
        <SelectTrigger>
          <SelectValue placeholder="Select a data endpoint" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem defaultChecked value={DefaultActions.Chat}>
            Local
          </SelectItem>
        </SelectContent>
      </Select>

      <div className=" mt-4">
        Pre-Format <span className="text-xs">(optional)</span>
      </div>
      <Textarea
        name="promptFormat"
        rows={4}
        placeholder="{{INPUT}}}"
        defaultValue={panelState.promptFormat}
        onChange={updatePromptFormat}
      />
    </>
  );
};

export default VectorRequestActionPanel;
