import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

import { Command, CommandGroup, CommandItem } from "@/components/ui/command";
import {
  addResultChangedListener,
  appState,
  useAppContext,
} from "@/state/app.state";
import {
  Camera,
  EllipsisVerticalIcon,
  FileIcon,
  Loader2,
  StopCircle,
  UploadIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { MessageCircle } from "lucide-react";
import {
  getCommandFromPrompt,
  getConvoId,
  setHasFiles,
  randomUUID,
  adjustWindowHeightToResult,
  toBase64,
} from "@/lib/utils";
import { TrainerApi } from "@/api/train.api";
import { useToast } from "@/components/ui/use-toast";
import {
  DocumentData,
  LlmResultModel,
} from "../../../shared/models/app-state.model";
import { execCommands } from "@/lib/command-execute";
import {
  addInteractionPrompt,
  addRetry,
  assignStreamedToLastInteraction,
} from "@/lib/interaction-manager";
import InteractionResultPanel from "./interaction-result-panel";
import StreamedOutput from "./streamed-output-panel";
import { LlmApi } from "@/api/llm.api";
import { InteractionState } from "@/lib/interaction-state";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { addFocusHandler } from "@/electron/electron-ipc-handlers";
import { CodeFunctions } from "@/code/client-code-functions";
import { Textarea } from "@/components/ui/textarea";
import { DialogClose } from "@radix-ui/react-dialog";
import { TaskRecord } from "../task/task-recorder";

export const preState = {
  files: [],
};

let allDocs = [];
let allFiles: any = [];

function Interaction() {
  const [searchParams] = useSearchParams();
  const { toast } = useToast();

  const { state } = useAppContext();
  const [isLoading, setIsLoading] = useState(false);
  const promptRef = useRef(null);
  const [results, setResults] = useState<LlmResultModel[]>([]);
  const previousConvoId = useRef<string>(null);
  const [dragActive, setDragActive] = useState<boolean>(false);
  const [fileList, setFiles] = useState<Array<File>>(preState.files);
  const [foreRefresh, setForeRefresh] = useState<string>("");
  const [streaming, setStreaming] = useState<boolean>(false);
  const [docs, setDocs] = useState<DocumentData[]>([]);
  const [isOpenBigInputDialog, setIsOpenBigInputDialog] = useState(false);
  const [isRecordTracking, setIsTrackRecording] = useState<boolean>(false);
  const [isOptionListOpen, setIsOptionListOpen] = useState<boolean>(false);
  const [selectedInputOption, setSelectedInputOption] = useState<
    "screenshot" | "upload"
  >("upload");
  const selectableCommands = state?.commands?.filter((t) => t.isTool) ?? [];

  useEffect(() => {
    allDocs = docs;
  }, [docs]);

  useEffect(() => {
    allFiles = fileList;
  }, [fileList]);

  useEffect(() => {
    const convoId = searchParams.get("convoId");

    const llmResult =
      state?.llmResults?.find((r) => r.convoId === convoId)?.results ?? [];
    if (convoId !== previousConvoId.current && llmResult.length === 0) {
      setResults([]);
      previousConvoId.current = convoId;
      preState.files = [];
      setFiles([]);
      focusInput(50);
      return;
    }
  }, [searchParams]);

  function openBigInputDialog(e: any) {
    const text = e.clipboardData.getData("text");
    if (text.length > 300) {
      setIsOpenBigInputDialog(true);
    }
  }

  function focusInput(wait = 50) {
    setTimeout(() => {
      promptRef.current.focus();
      setForeRefresh(randomUUID());
    }, wait);
  }

  function stopStreaming() {
    assignStreamedToLastInteraction(getConvoId());
    LlmApi.abortLLM();
  }

  const retry = async (interaction: LlmResultModel) => {
    const existingIds = appState?.commands?.map((t) => t.id);
    const commands = interaction.commands.filter((o) =>
      existingIds.includes(o)
    );
    if (commands.length > 0) {
      addRetry(getConvoId(), interaction.header, commands);
      const commandModels = commands.map((t) =>
        appState.commands.find((t2) => t2.id == t)
      );
      await execCommands(interaction.header, commandModels, true);
    } else {
      alert("Retry failed, commands not found");
    }
  };

  const followUp = async (id: string) => {
    const task = state?.commands?.find((t) => t.id === id);
    if (task) {
      try {
        setIsLoading(true);
        const lastResult = results[0];
        addInteractionPrompt(getConvoId(), lastResult.content, [task.id]);
        await execCommands(lastResult.content, [task], true);
      } catch (ex) {
        console.error(ex);
      } finally {
        setIsLoading(false);
        focusInput();
      }
    }
  };

  function InteractionPane({
    interaction,
    isFirst,
  }: {
    interaction: LlmResultModel;
    isFirst: boolean;
  }) {
    const hasPrompt =
      interaction.header != "" && interaction.header != undefined;

    return (
      <>
        {hasPrompt && (
          <>
            <Dialog>
              <DialogTrigger className="w-full">
                <div className="p-2 flex text-sm font-medium leading-none truncate w-full cursor-pointer text-ellipsis">
                  <div
                    className="text-left text-xs/4 flex flex-1 gap-2 pr-1"
                    style={{ maxWidth: "calc(100vw - 20px)" }}
                  >
                    <MessageCircle
                      className="h-3 w-3"
                      style={{ paddingTop: "0.2rem" }}
                    />

                    <span className="flex-1 text-ellipsis overflow-hidden break-words text-muted-foreground">
                      {interaction.header}
                    </span>
                  </div>
                </div>
              </DialogTrigger>

              <DialogContent style={{ maxHeight: "95vh", overflow: "auto" }}>
                <div className="text-xs">{interaction.header}</div>
              </DialogContent>
            </Dialog>
          </>
        )}

        {interaction.content != undefined && (!isFirst || !streaming) && (
          <InteractionResultPanel
            onFollowUp={followUp}
            retry={retry}
            interaction={interaction}
            isFooterVisible={isFirst}
          />
        )}
        {isFirst && interaction.content == undefined && (
          <StreamedOutput interaction={interaction} />
        )}
      </>
    );
  }

  function inputOptionPush() {
    if (selectedInputOption == "screenshot") {
      onScreenshot();
    } else {
      onUpload();
    }
  }

  function onUpload() {
    const input = document.createElement("input");
    input.type = "file";
    input.onchange = (e: any) => {
      const fileList: FileList = e.target.files;
      const files = Array.from(fileList);
      parseFiles(files);
    };
    input.click();
  }

  async function onScreenshot() {
    try {
      const res = await CodeFunctions.waitUntilMarked();
      const imgageData = await CodeFunctions.extractTextFromImage(
        res.fileBuffer
      );
      CodeFunctions.addResult(
        `<img class="w-full pointer-events-none" src="${toBase64(
          res.fileBuffer
        )}" /> Extracted text : <br> ${imgageData.text}`
      );
    } catch (ex) {
      console.error(ex);
      toast({
        title: "Error while processing screenshot",
        description: ex.message,
      });
    } finally {
      focusInput();
    }
  }

  async function onSubmit() {
    executeSubmit(promptRef.current.value);
  }

  function executeSubmit(prompt: string) {
    promptRef.current.value = "";

    if (prompt == null || prompt?.trim() == "") {
      return;
    }

    if (InteractionState.getState().nextInput != null) {
      InteractionState.getState().nextInput(prompt);
      InteractionState.waitForNextInput(null);
      focusInput();
      return;
    }

    setIsLoading(true);
    execFunction(prompt);
  }

  function selectInputOption(option: "screenshot" | "upload") {
    setSelectedInputOption(option);
    setIsOptionListOpen(false);
  }

  async function execFunction(prompt: string) {
    try {
      const commandData = getCommandFromPrompt(prompt, selectableCommands);
      await execCommands(
        commandData.prompt,
        commandData.command ? [commandData.command] : [],
        getConvoId(),
        false,
        docs
      );
    } catch (ex) {
      console.error(ex);
    } finally {
      setIsLoading(false);
      focusInput();
    }
  }

  useEffect(() => {
    setHasFiles(fileList.length > 0);
  }, [fileList]);

  useEffect(() => {
    addInteractionChaneListener((interactState) => {
      if (interactState.prompt) {
        promptRef.current.value = interactState.prompt;
        setTimeout(() => {
          promptRef.current.focus();
        });
      }

      if (interactState.isTrackRecording != null) {
        setIsTrackRecording(interactState.isTrackRecording);
      }

      if (interactState.focus) {
        console.log("focus");
        focusInput();
      }

      if (interactState.files) {
        const newFiles = [...allFiles, ...interactState.files];
        setFiles(newFiles);
      }

      if (interactState.docs) {
        const newDocs = [...allDocs, ...interactState.docs];
        setDocs(newDocs);
      }
    });

    submitPromptListener((prompt) => {
      executeSubmit(prompt);
    });

    addResultChangedListener((newResults) => {
      setResults([...newResults]);

      setTimeout(() => {
        adjustWindowHeightToResult();
      }, 100);

      const firstItem = newResults[0];
      if (firstItem) {
        setStreaming(firstItem.content == undefined);
      }

      const latestResult = newResults[0];
      if (latestResult) {
        setIsLoading(latestResult.content == undefined);
      }
    });

    addInteractionForceRefreshListener(() => {
      setForeRefresh(randomUUID());
    });

    addFocusHandler(() => {
      focusInput();
    });
  }, []);

  function handleDragLeave(e: any) {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
  }

  function handleDragOver(e: any) {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(true);
  }

  function handleDragEnter(e: any) {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(true);
  }

  async function handleDrop(e: any) {
    setIsLoading(true);
    try {
      e.preventDefault();
      e.stopPropagation();
      setDragActive(false);
      const files = [];
      if (e.dataTransfer.files && e.dataTransfer.files[0]) {
        for (let i = 0; i < e.dataTransfer.files["length"]; i++) {
          const file = e.dataTransfer.files[i];
          files.push(file);
        }
      }

      await parseFiles(files);
    } catch (ex) {
      console.error(ex);
      toast({
        title: "Unknown error while parsing files",
        description: ex.message,
      });
    } finally {
      focusInput();
      setIsLoading(false);
    }
  }

  const parseFiles = async (files) => {
    try {
      setIsLoading(true);
      const resDocs = await TrainerApi.parseFiles(files, {});

      const newFiles = [...fileList, ...files];
      setFiles(newFiles);
      setDocs([...docs, ...resDocs]);
    } catch (ex) {
      console.error(ex);
      toast({
        title: "Error while parsing files",
        description: ex.message,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const openFile = async (file: File) => {
    if (file.path == "") {
      const related = docs.filter((o) => o.metadata.id == file.name);
      const content = related.map((o) => o.pageContent).join("\n");
      const blob = new Blob([content], { type: file.type });
      const url = URL.createObjectURL(blob);

      window.open(url, "_blank");
    } else {
      window.open(file.path, "_blank");
    }
  };

  function FileList({ files }: any) {
    if (files.length === 0) {
      return null;
    }

    return (
      <>
        <div className="flex p-2 bg-muted/60 text-muted-foreground w-full">
          {files.map((file: any) => (
            <div
              key={file.name}
              className="flex flex-row mr-2 cursor-pointer"
              onClick={() => openFile(file)}
            >
              <FileIcon className="mr-1 w-4 h-4" />
              <div className="truncate text-xs">{file?.name ?? "Image"}</div>
            </div>
          ))}
        </div>
      </>
    );
  }

  function EmptyResultsPanel() {
    if (results.length > 0) return null;

    return (
      <>
        <div className="flex flex-col items-center justify-center h-full dragger text-muted-foreground text-sm">
          <div className="text-left">
            <h3 className="opacity-30">Ask me anything...</h3>
            <img
              src="./mainlogo.png"
              className="w-52 opacity-5 absolute bottom-2 right-2 -z-10"
            />
          </div>
        </div>
      </>
    );
  }

  const resultsMemo = useMemo(() => {
    return results.map((res, i) => (
      <div key={i} className="convo">
        <InteractionPane interaction={res} isFirst={0 == i} />
      </div>
    ));
  }, [results, streaming, foreRefresh]);

  return (
    <>
      {isOpenBigInputDialog && (
        <Dialog
          defaultOpen={true}
          onOpenChange={() => {
            setIsOpenBigInputDialog(false);
            focusInput();
          }}
        >
          <DialogContent>
            <div className="mt-4" aria-rowspan={10}>
              <Textarea
                rows={15}
                defaultValue={promptRef.current.value}
                onBlur={(e) => (promptRef.current.value = e.target.value)}
              />
            </div>
            <DialogFooter>
              <DialogClose asChild>
                <Button type="button" variant="ghost">
                  Close
                </Button>
              </DialogClose>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
      {isRecordTracking && (
        <TaskRecord
          stopTaskRecording={() => {
            CodeFunctions.stopTaskRecording();
          }}
        />
      )}
      <div
        className={`${
          dragActive ? "bg-accent" : ""
        } flex-1 flex flex-col max-h-full`}
        onDragEnter={handleDragEnter}
        onDrop={handleDrop}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
      >
        <div className="flex flex-1 flex-col max-h-full">
          <div>
            <div className="flex flex-row mt-1 relative gradient-focus">
              <div className="flex w-full">
                <Input
                  className="border-0 shadow-sm border-r-0 px-2 interact-input outline-none pt-2 text-sm"
                  id="input-container"
                  placeholder="Enter your text..."
                  style={{ maxHeight: "250px", overflow: "auto" }}
                  ref={promptRef}
                  onPaste={openBigInputDialog}
                  onDoubleClick={() => setIsOpenBigInputDialog(true)}
                  spellCheck={false}
                  onKeyDown={(e) => {
                    if (e.key == "Enter") {
                      e.preventDefault();
                      e.stopPropagation();
                      onSubmit();
                    }
                  }}
                  autoFocus
                  disabled={isLoading}
                />
                {streaming && (
                  <Button
                    onClick={stopStreaming}
                    variant="outline"
                    className="text-muted-foreground opacity-75"
                  >
                    {" "}
                    <StopCircle className="w-3 h-3 mr-2 opacity-100" /> Stop{" "}
                  </Button>
                )}
                <Button
                  disabled={isLoading}
                  variant="ghost"
                  className="text-muted-foreground opacity-75 px-2"
                  onClick={() => inputOptionPush()}
                >
                  {isLoading || streaming ? (
                    <Loader2 className="animate-spin" />
                  ) : (
                    <div className="flex">
                      {selectedInputOption === "screenshot" ? (
                        <Camera className="w-4 h-4" />
                      ) : (
                        <UploadIcon className="w-4 h-4" />
                      )}
                    </div>
                  )}
                </Button>
                <Popover
                  open={isOptionListOpen}
                  onOpenChange={() => {
                    setIsOptionListOpen(!isOptionListOpen);
                  }}
                >
                  <PopoverTrigger asChild>
                    <Button variant="ghost" className="px-0">
                      <EllipsisVerticalIcon className="h-4" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="text-xs p-1 w-32">
                    <Command>
                      <CommandGroup>
                        <CommandItem
                          onSelect={() => selectInputOption("screenshot")}
                        >
                          <Camera className="h-3 w-3 mr-1" /> Screenshot
                        </CommandItem>
                        <CommandItem
                          onSelect={() => selectInputOption("upload")}
                        >
                          <UploadIcon className="h-3 w-3 mr-1" /> Upload
                        </CommandItem>
                      </CommandGroup>
                    </Command>
                  </PopoverContent>
                </Popover>
              </div>
            </div>

            <FileList files={fileList} />
          </div>
          <div
            className="p-2 flex-1 overflow-auto h-full max-h-full dragger"
            id="result-container"
          >
            {!isLoading && <EmptyResultsPanel />}
            {resultsMemo}
          </div>
        </div>
      </div>
    </>
  );
}

export default Interaction;

export interface InteractionChangeState {
  prompt?: string;
  result?: string;
  files?: File[];
  docs?: DocumentData[];
  isTrackRecording?: boolean;
  focus?: boolean;
}

let forceInteractionRefreshr: () => void;
export function forceInteractionRefresh() {
  forceInteractionRefreshr();
}
function addInteractionForceRefreshListener(func: () => void) {
  forceInteractionRefreshr = func;
}

export let interactionStateChange: (any: InteractionChangeState) => void;
export function addInteractionChaneListener(
  func: (any: InteractionChangeState) => void
) {
  interactionStateChange = func;
}

export let submitPromptFn: (any: string) => void;
export function submitPromptListener(func: (any: string) => void) {
  submitPromptFn = func;
}
//stream
let streamOutputs: any[] = [];

export function pushStreamOutput(data: string, replaceText?: string) {
  if (streamOutputs.length > 0) {
    streamOutputs.forEach((func) => {
      func(data, replaceText);
    });
  }
}

export function addStreamListner(
  func: (any: string, replaceText: string) => void
) {
  streamOutputs.push(func);
  return func;
}

export function removeStreamListner(func: any) {
  streamOutputs = streamOutputs.filter((t) => t != func);
}

//Logs
let streamLogsOutputs: any[] = [];
export function pushLogsStreamOutput(data: string) {
  if (streamLogsOutputs.length > 0) {
    streamLogsOutputs.forEach((func) => {
      func(data);
    });
  }
}

export function addLogsStreamListner(func: (any: string) => void) {
  streamLogsOutputs.push(func);
  return func;
}

export function removeLogsStreamListner(func: any) {
  streamLogsOutputs = streamLogsOutputs.filter((t) => t != func);
}
