import { Input } from "@/components/ui/input";
import { JsScripActionModel } from "../../../shared/models/action.model";
import { Badge } from "@/components/ui/badge";
import { useRef, useState } from "react";
import fs from "fs";
import { getPublicPath } from "../../../shared/utils/resources";
import { join } from "path";

interface IProps {
  model: JsScripActionModel;
  modelChange: (model: JsScripActionModel) => void;
}

export const CallJsScriptActionPanel: React.FC<IProps> = ({
  model,
  modelChange,
}) => {
  const pickRef = useRef<HTMLInputElement>(null);
  const [path, setPath] = useState<string>(model?.name);

  function changed(e) {
    const file = e.target.files[0];

    //copy the file to the public folder
    const currentDir = process.cwd();
    const fullPath = join(currentDir, getPublicPath(), "scripts", file.name);
    fs.copyFileSync(file.path, fullPath);
    modelChange({ ...model, name: file.name });
    setPath(file.name);
  }

  return (
    <>
      <label>Js-File</label>
      <br />
      <Input
        className="hidden"
        ref={pickRef}
        accept=".js"
        type="file"
        onChange={(e) => changed(e)}
      />
      <Badge
        onClick={() => {
          pickRef.current.click();
        }}
        className="mt-2 mb-4 cursor-pointer text-md w-full justify-center"
        variant="outline"
      >
        {path ?? "Pick a file (Will be copied to script folder)"}
      </Badge>
    </>
  );
};
