import { collapseApp, ElectronState } from "@/electron/electron-ipc-handlers";
import { Maximize, Minus } from "lucide-react";
import { useState } from "react";

export function AppCollapse() {
  const [collapsed, setCollapsed] = useState(false);

  addUpdateCollapseHandler(() => {
    setCollapsed(ElectronState.isAppCollapsed);
  });

  const onCollapseApp = () => {
    setCollapsed(!collapsed);
    collapseApp(!collapsed);
  };

  const onCollapseOverall = () => {
    if (!collapsed) return;
    onCollapseApp();
  };

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

let collapser: () => void;
export function pushUpdateCollapse() {
  collapser();
}

function addUpdateCollapseHandler(func: () => void) {
  collapser = func;
}
