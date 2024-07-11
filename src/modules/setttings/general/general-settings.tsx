import { GeneralSettingsModel } from "../../../../shared/models/app-state.model";
import React, { useEffect } from "react";
import Update from "@/components/update";

type GeneralSettingsProps = {
    viewModel: GeneralSettingsModel;
    update: (generalSettings: GeneralSettingsModel) => void;
};

const GeneralSettings: React.FC<GeneralSettingsProps> = ({ update, viewModel }) => {
    return (
        <>
            <div className="flex flex-col">
                <div>
                    <Update />
                </div>
            </div>
        </>
    )
}

export default GeneralSettings
