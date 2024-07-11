import { Input } from "@/components/ui/input";
import { ActionModel, DynamicActionType } from "../../../shared/models/action.model";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";

interface IProps {
    model: ActionModel;
    modelChange: (model: ActionModel) => void;
}

export const DynamicActionPanel: React.FC<IProps> = ({ model, modelChange }) => {
    const editableFields = (model.type as DynamicActionType).editableFields;

    function InputField({ field }) {
        switch (field.type) {
            case "Text":
                return (
                    <>
                        <label>{field.name}</label>
                        <Input
                            type="text"
                            className="form-control"
                            defaultValue={field.value}
                            onChange={(e) => {
                                field.value = e.target.value;
                                modelChange(model);
                            }}
                        />
                    </>
                );
            case "Number":
                return (
                    <>
                        <label>{field.name}</label>
                        <Input
                            type="number"
                            className="form-control"
                            defaultValue={field.value}
                            onChange={(e) => {
                                field.value = e.target.value;
                                modelChange(model);
                            }}
                        />
                    </>
                );
            case "Checkbox":
                return (
                    <div className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                        <div className="space-y-0.5">
                            <Label>{field.name}</Label>
                            {/* <div className="text-xs">
                            </div> */}
                        </div>
                        <div>
                            <Switch
                                defaultChecked={field.value}
                                onCheckedChange={(e) => {
                                    field.value = e;
                                    modelChange(model);
                                }}
                            />
                        </div>
                    </div>
                );
        }
    }

    return (
        <>
            {editableFields.map((field, index) => (
                <div key={index} className="mt-2 text-left">
                    <InputField field={field} />
                </div>
            ))}
        </>
    );
}