import React from "react";
import ReactDOM from "react-dom/client";
import "./index.scss";
import { AppProvider } from "./state/app.state";
import { Routing } from "./modules/routes";
import { HashRouter } from "react-router-dom";
import ElectronMarkHandlerComponent from "./electron/electron.handler.cmp";
import Nav from "./components/ui/nav";
import { Toaster } from "./components/ui/toaster";
import EasySpeech from "./lib/easy-speech";

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <AppProvider>
      <HashRouter>
        <ElectronMarkHandlerComponent />
        <div className="flex flex-col flex-1 h-full">
          <div className="overflow-auto-when-hover w-full h-full content flex flex-col flex-1">
            <Routing />
          </div>
          <Nav />
        </div>
        <Toaster />
      </HashRouter>
    </AppProvider>
  </React.StrictMode>
);

postMessage({ payload: "removeLoading" }, "*");
EasySpeech.detect();
EasySpeech.init({ maxTimeout: 5000, interval: 250 });
