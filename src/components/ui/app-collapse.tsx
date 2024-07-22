import { CodeFunctions } from "@/code/code-functions.util";
import { collapseApp } from "@/electron/electron-ipc-handlers";
import { Camera, Maximize, Mic, Minus, Wand } from "lucide-react";
import { useState } from "react";

export function AppCollapse() {
  const [collapsed, setCollapsed] = useState(false);

  const onCollapseApp = () => {
    setCollapsed(!collapsed);
    collapseApp(!collapsed);
  };

  const onCollapseOverall = () => {
    if (!collapsed) return;
    onCollapseApp();
  };

  async function onScreenShot() {
    const buffer = await CodeFunctions.waitUntilMarked();
    onCollapseApp();
  }

  async function onSpeechRecord() {}

  return (
    <>
      <div className={"" + (collapsed ? "collapse-app-active" : "")}>
        {collapsed ? (
          <>
            <div className="flex justify-center items-center p-2 dragger">
              <div className="left-0 w-full z-30 flex bottom-1 px-1 absolute justify-end">
                <Maximize
                  onClick={onCollapseOverall}
                  className="cursor-pointer no-drag h-4 w-4 hover:text-primary bg-background rounded-md flex bg-black"
                />
              </div>
              <img src="./mainlogo.png" className="dragger mr-4" />
            </div>
          </>
        ) : (
          <Minus
            className="w-4 h-4 cursor-pointer mr-2"
            onClick={onCollapseApp}
          />
        )}
      </div>
    </>
  );
}
