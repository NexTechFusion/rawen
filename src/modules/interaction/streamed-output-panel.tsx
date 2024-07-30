import { useEffect, useState } from "react";
import {
  addLogsStreamListner,
  addStreamListner,
  removeLogsStreamListner,
  removeStreamListner,
} from "./interaction";
import { InteractionMarkdown } from "./interaction-markdown";
import { addStreamed, replaceStreamed } from "@/lib/interaction-manager";
import { adjustWindowHeightToResult } from "@/lib/utils";
function StreamedOutput({ interaction }) {
  const [streamOutput, setStreamOutput] = useState<string>("");
  const [streamLogOutput, setStreamLogOutput] = useState<string>(
    interaction.logs ?? ""
  );
  useEffect(() => {
    const func = (data: string, replaceText?: string) => {
      const decoded = decodeURI(data);
      
      if (replaceText != null) {
        const decodedReplace = decodeURI(replaceText);
        replaceStreamed(decoded, decodedReplace);
        setStreamOutput((prev) => prev.replace(decoded, decodedReplace));
        return;
      }

      addStreamed(decoded);
      setStreamOutput((prev) => prev + decoded);
      adjustWindowHeightToResult();
    };

    const funcLog = (data: string) => {
      // const decoded = decodeURI(data);
      setStreamLogOutput((prev) => prev + data);
      adjustWindowHeightToResult();
    };

    const streami = addStreamListner(func);
    const logStream = addLogsStreamListner(funcLog);

    return () => {
      removeStreamListner(streami);
      removeLogsStreamListner(logStream);
    };
  }, []);

  function LogPanel({ logs }) {
    return (
      <>
        <div className="rounded-sm p-2 w-full bg-slate-800 text-white opacity-50 text-xs mt-4">
          <p
            className="p-0 m-0 mb-1 flex gap-2 text-sm align-middle items-center text-primary"
            style={{ marginTop: "-0.25rem" }}
          >
            Working...
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary/50 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-primary"></span>
            </span>
          </p>
          <InteractionMarkdown children={logs} />
        </div>
      </>
    );
  }

  function completeCodeBlock(inputString) {
    const backtickCount = (inputString.match(/```/g) || []).length;

    if (backtickCount % 2 !== 0) {
      return inputString + "\n\n```";
    }
    return inputString;
  }

  const res = completeCodeBlock(streamOutput);
  return (
    <>
      <div className="flex items-start gap-2.5 w-full dragger">
        <img className="w-6 h-6 rounded-full birdi" src="head.png" />
        <div className="flex flex-col gap-2.5 w-full leading-1.5 p-4  rounded-e-xl rounded-es-xl dark:bg-gray-700 mr-2 text-sm gradient-border no-drag">
          <InteractionMarkdown children={res} />
          {streamLogOutput != "" && <LogPanel logs={streamLogOutput} />}
        </div>
      </div>
    </>
  );
}

export default StreamedOutput;
