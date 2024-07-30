import {
  Combine,
  FileIcon,
  GlobeIcon,
  MenuSquare,
  RefreshCw,
  X,
} from "lucide-react";
import { InteractionMarkdown } from "./interaction-markdown";
import { InlineElementConfirmation } from "../../../shared/models/app-state.model";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { InteractionCommand } from "./interaction-command";
import { appState } from "@/state/app.state";
import { useState } from "react";
import { InteractionState } from "@/lib/interaction-state";
import { openDocument } from "@/lib/utils";

// interaction { metadata { sourcetype : export type SourcesType = "File" | "Website", website_url, file_path }}
function InteractionResultPanel({
  interaction,
  isFooterVisible,
  onFollowUp,
  retry,
}) {
  const [logOpen, setLogOpen] = useState<boolean>(
    interaction.logsOpen ?? false
  );

  let content = interaction.content ?? "Executed";
  const canRetry = interaction.commands?.length > 0;
  function DisplayInlineElement(ele: InlineElementConfirmation) {
    return (
      <>
        <Card className="mt-2 p-0">
          <CardContent className="p-4">
            <span dangerouslySetInnerHTML={{ __html: ele.message }}></span>
          </CardContent>
          <CardFooter className="p-2 flex gap-2">
            {ele.buttons.map((btn) => {
              return (
                <button
                  type="button"
                  style={{ flex: 1, display: "block" }}
                  onClick={() => {
                    InteractionState.clickInlineConfirm(btn.id);
                  }}
                  className={"border py-2 rounded-md " + btn.classes}
                >
                  {" "}
                  {btn.text}
                </button>
              );
            })}
          </CardFooter>
        </Card>
      </>
    );
  }
  function LogPanel({ logs }) {
    return (
      <>
        {!logOpen && (
          <MenuSquare
            className="cursor-pointer float-right w-3 h-3 text-muted-foreground/30 opacity-50 hover:opacity-95"
            onClick={() => {
              setLogOpen(true);
              interaction.logsOpen = true;
            }}
          />
        )}
        {logOpen && (
          <div className="rounded-sm p-2 w-full bg-slate-800 text-white opacity-50 text-xs mt-4">
            <X
              className="cursor-pointer float-right w-4 h-4 text-white opacity-50 hover:opacity-95"
              onClick={() => {
                setLogOpen(false);
                interaction.logsOpen = false;
              }}
            />
            <InteractionMarkdown children={logs} />
          </div>
        )}
      </>
    );
  }

  const hasResult =
    interaction.content != "" && interaction.content != undefined;

  function ActionsPanel() {
    const commandsFollowUp = appState?.commands?.filter(
      (cmd) => cmd.asFollowUp
    );
    const hasCommandsFollowUp = commandsFollowUp?.length > 0;
    return (
      <div className="flex-1 flex-row-reverse flex cursor-pointer p-1 w-full text-muted-foreground/50 no-drag mr-4">
        <div className="text-xs flex-1 flex flex-row-reverse gap-4">
          {canRetry && (
            <div
              onClick={() => retry(interaction)}
              className="flex justify-center align-middle items-center gap-1  hover:text-accent-foreground"
            >
              <RefreshCw className="w-3 h-3" />
            </div>
          )}
          {hasCommandsFollowUp && (
            <>
              <InteractionCommand
                triggerContent={
                  <div className="flex justify-center align-middle items-center gap-1 hover:text-accent-foreground">
                    <Combine className="w-3 h-3" />
                  </div>
                }
                commands={commandsFollowUp}
                onSelect={(id) => {
                  onFollowUp(id);
                }}
              />
            </>
          )}
        </div>
      </div>
    );
  }

  function DocumentsPanel() {
    return (
      <>
        <div className="flex-1 flex-row-reverse flex cursor-pointer p-1 w-full text-muted-foreground/50 no-drag mr-4">
          <div className="flex gap-2 ">
            {interaction.sources?.map((source) => {
              const isWebsite = source.metadata?.id.includes("http");
              const isFile = !isWebsite; //lol

              const name = isFile
                ? source.metadata?.id
                : source.metadata?.website_url?.split("/")?.pop();

              return (
                <>
                  <div
                    key={name}
                    className="flex flex-row mr-2 text-xs hover:text-muted-foreground"
                    onClick={() => openDocument(source)}
                  >
                    {isFile && <FileIcon className="mr-1 w-4 h-4" />}
                    {isWebsite && <GlobeIcon className="mr-1 w-4 h-4" />}

                    <div className="truncate text-xs">{name}</div>
                  </div>
                </>
              );
            })}
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <div className="flex items-start gap-2.5 w-full">
        <img className="w-6 h-6 rounded-full birdi" src="head.png" />
        <div className="flex flex-col gap-2.5 w-full leading-1.5 p-4  rounded-e-xl rounded-es-xl dark:bg-gray-800 mr-2 text-sm no-drag">
          <div>
            {interaction.content && <InteractionMarkdown children={content} />}
            {interaction.confirmElements?.map((html, i) => {
              return (
                <DisplayInlineElement
                  key={i}
                  buttons={html.buttons}
                  message={html.message}
                />
              );
            })}
            {interaction.logs && <LogPanel logs={interaction.logs} />}
            {hasResult && <DocumentsPanel />}
          </div>
        </div>
      </div>
      {hasResult && <ActionsPanel />}
    </>
  );
}

export default InteractionResultPanel;
