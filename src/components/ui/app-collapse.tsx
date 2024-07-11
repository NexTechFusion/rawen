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
            <div className="dragger flex justify-center items-center">
              <div className="left-0 w-full z-30 flex top-1 px-1 absolute">
                <div className="flex-1">
                  {/* <Wand
                    className="cursor-pointer no-drag h-4 w-4 hover:text-primary rounded-md"
                    onClick={() => onScreenShot()}
                  /> */}
                </div>
                {/* <Mic
                  onClick={onCollapseOverall}
                  className="cursor-pointer no-drag h-4 w-4 hover:text-primary bg-background rounded-md"
                /> */}
              </div>
              <div className="left-0 w-full z-30 flex bottom-1 px-1 absolute">
                <div className="flex-1">
                  {/* <Camera
                    className="cursor-pointer no-drag h-4 w-4 hover:text-primary bg-background rounded-md"
                    onClick={() => onScreenShot()}
                  /> */}
                </div>
                <Maximize
                  onClick={onCollapseOverall}
                  className="cursor-pointer no-drag h-4 w-4 hover:text-primary bg-background rounded-md"
                />
              </div>
              <img src="./mainlogo.png" className="p-1" />
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
