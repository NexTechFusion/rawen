import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAppContext } from "@/state/app.state";
import React, { useRef, useState } from "react";
import { Label } from "@/components/ui/label";
import { ArrowBigDown, Import, Package, Plus } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTrigger,
} from "@/components/ui/dialog";
import { CommandModel } from "../../../shared/models/command.model";
import {
  ActionModel,
  ActionType,
  DynamicActionTypes,
  JsScripActionModel,
} from "../../../shared/models/action.model";
import VectorRequestActionPanel from "./vector-action";
import LmmRequestActionPanel from "./lmm-action";
import { Textarea } from "@/components/ui/textarea";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import LmmDocsRequestActionPanel from "./lmm-docs-action.";
import { saveStateElectron } from "@/lib/utils";
import { DynamicActionPanel } from "./dynamic-action";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from "@/components/ui/command";
import { Switch } from "@/components/ui/switch";
import { CallJsScriptActionPanel } from "./call-js-script";
import LmmSummarzieActionPanel from "./lmm-summarize.action";
import LmmWebsearchActionPanel from "./lmm-websearch.action";
import DefaultLmmActionPanel from "./default-llm-action";
import { DraggableComponent } from "@/components/ui/app-dragable-container";

function Commands() {
  const { state, dispatch } = useAppContext();
  const updatedCommands = useRef<CommandModel[]>(state.commands ?? []);
  const [commands, setcommands] = useState<CommandModel[]>(
    state.commands ?? []
  );
  const [filtered, setFiltered] = useState<CommandModel[]>(
    state.commands ?? []
  );
  const avatarPickRef = useRef<HTMLInputElement>(null);
  const filterRef = useRef<HTMLInputElement>(null);
  const [open, setOpen] = React.useState(false);

  const saveChanges = () => {
    dispatch({ ...state, commands: updatedCommands.current });
    setFiltered(updatedCommands.current);
    setcommands(updatedCommands.current);
    filter(filterRef.current?.value || "");
    saveStateElectron();
  };

  function filter(txt: string) {
    if (txt === "") {
      setFiltered(commands);
    } else {
      const filtered = commands.filter((s) =>
        s.name.toLowerCase().includes(txt.toLowerCase())
      );
      setFiltered(filtered);
    }
  }

  const addCommand = () => {
    const newItem = [...commands];
    newItem.unshift({
      id: Math.random().toString(36).substr(2, 9),
      name: "New command",
      description: "",
      actions: [],
    });
    setcommands(newItem);
    setFiltered(newItem);
  };

  const updateCommandProperty = (
    value: string | boolean,
    i: number,
    property:
      | "name"
      | "description"
      | "isTool"
      | "asFollowUp"
      | "img"
      | "asShortcut"
      | "asStartup"
  ) => {
    const newItem: any[] = [...commands];
    newItem[i][property] = value;
    updatedCommands.current = newItem;
  };

  const updateAction = (action: ActionModel, i: number) => {
    const newItem = [...commands];
    newItem[i].actions = newItem[i].actions.map((a) =>
      a.id === action.id ? action : a
    );
    updatedCommands.current = newItem;
  };

  const removeAction = (command: CommandModel, i: number) => {
    const copiedCommands = [...commands];
    const copiedCommand = copiedCommands.find((c) => c.id === command.id);
    if (copiedCommand) {
      copiedCommand.actions.splice(i, 1);
    }
    setcommands(copiedCommands);
  };

  const ActionPanel: React.FC<{
    model: ActionModel;
    modelChange: (model: ActionModel) => void;
  }> = React.memo(({ model, modelChange }) => {
    const Content = () => {
      switch (model.type) {
        case "LmmWebsearch":
          return (
            <LmmWebsearchActionPanel model={model} modelChange={modelChange} />
          );
        case "LmmSummarize":
          return (
            <LmmSummarzieActionPanel model={model} modelChange={modelChange} />
          );
        case "LmmRequest":
          return (
            <LmmRequestActionPanel model={model} modelChange={modelChange} />
          );
        case "LmmDocsRequest":
          return (
            <LmmDocsRequestActionPanel
              model={model}
              modelChange={modelChange}
            />
          );
        case "VectorRequest":
          return (
            <VectorRequestActionPanel model={model} modelChange={modelChange} />
          );
        case "DefaultLLM":
          return (
            <DefaultLmmActionPanel model={model} modelChange={modelChange} />
          );
        case "CallJsScript":
          return (
            <CallJsScriptActionPanel
              model={model as JsScripActionModel}
              modelChange={modelChange}
            />
          );
        default:
          return <DynamicActionPanel model={model} modelChange={modelChange} />;
      }
    };

    return <Content />;
  });

  const addActionToCommand = (commandId: string, actionType: ActionType) => {
    const newItem = [...commands];
    const command = newItem.find((c) => c.id === commandId);
    if (command) {
      command.actions.push({
        id: Math.random().toString(36).substr(2, 9),
        type: actionType,
      });
    }
    setcommands(newItem);
    setOpen(false);
  };

  const removeCommand = (commandId: string) => {
    const newItem = [...commands];
    const index = newItem.findIndex((c) => c.id === commandId);
    if (index > -1) {
      newItem.splice(index, 1);
    }
    setcommands(newItem);
    setFiltered(newItem);
    dispatch({ ...state, commands: newItem });
  };

  const notReady = () => {
    alert("Feature not ready yet");
  };

  const TypeToText: React.FC<{ type: ActionType }> = ({ type }) => {
    if (typeof type != "string") {
      return type.name;
    }

    switch (type) {
      case "LmmWebsearch":
        return "LMM websearch";
      case "LmmSummarize":
        return "LMM summarize";
      case "LmmRequest":
        return "LMM request";
      case "LmmDocsRequest":
        return "LMM RAG request";
      case "VectorRequest":
        return "Knowledge request";
      case "CallJsScript":
        return "JS script call";
      case "DefaultLLM":
        return "Set default LLM";
      default:
        return type;
    }
  };

  return (
    <>
      <div className=" flex flex-1 flex-col">
        <DraggableComponent className="container max165h py-2 px-0">
          <div className="grid m-auto grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
            {filtered.map((command, i) => (
              <>
                <div
                  key={command.id}
                  className="rounded-lg border px-2 py-1 flex items-start hover:bg-secondary cursor-pointer shadow"
                >
                  <Dialog>
                    <DialogTrigger className="flex-1 h-full flex">
                      <div
                        className="flex flex-1 text-sm relative text-left items-start h-full"
                        style={{ minHeight: "110px" }}
                      >
                        <div className="flex-1 flex flex-col items-start h-full p-2">
                          <span className="flex-1">
                            {command.name} <br />
                            <span className="text-xs text-muted-foreground/80">
                              {command.description}
                            </span>
                          </span>
                          <div className="mt-2">
                            {
                              <span className="text-xs text-muted-foreground/60 ml-1">
                                {command.actions.length} Action
                                {command.actions.length > 1 && "s"}
                              </span>
                            }
                            {command.isDefault && (
                              <span className="text-xs ml-1 bg-muted px-2 rounded-lg text-muted-foreground/70">
                                Default
                              </span>
                            )}
                            {command.isTool && (
                              <span className="text-xs ml-1 bg-muted px-2 rounded-lg text-muted-foreground/70">
                                Tool
                              </span>
                            )}
                            {command.asFollowUp && (
                              <span className="text-xs ml-1 bg-muted px-2 rounded-lg text-muted-foreground/70">
                                Follow-Up
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </DialogTrigger>
                    <DialogContent
                      className="flex flex-col"
                      style={{ minWidth: "95vw" }}
                    >
                      <DialogHeader className="flex-1">
                        <DialogDescription>
                          <div
                            className="text-left overflow-auto opacity-full p-2"
                            style={{ maxHeight: "85vh" }}
                          >
                            <div className="flex gap-4">
                              <div className="flex-1">
                                <div className="flex items-center">
                                  <div className="flex-1">
                                    <Label className="mb-1" htmlFor="name">
                                      Name
                                    </Label>
                                    <Input
                                      name="name"
                                      defaultValue={command.name}
                                      className="mb-2"
                                      placeholder="Name"
                                      onChange={(e) =>
                                        updateCommandProperty(
                                          e.target.value,
                                          i,
                                          "name"
                                        )
                                      }
                                    />
                                  </div>
                                </div>

                                <Label htmlFor="description">Description</Label>
                                <Textarea
                                  name="description"
                                  defaultValue={command.description}
                                  rows={2}
                                  onChange={(e) =>
                                    updateCommandProperty(
                                      e.target.value,
                                      i,
                                      "description"
                                    )
                                  }
                                />

                                <div className="mt-4">
                                  <div className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                                    <div className="space-y-0.5">
                                      <Label>Tool</Label>
                                      <div className="text-xs">
                                        Will check on prompt if the command will
                                        be executed
                                      </div>
                                    </div>
                                    <div>
                                      <Switch
                                        defaultChecked={command.isTool}
                                        onCheckedChange={() => {
                                          updateCommandProperty(
                                            !command.isTool,
                                            i,
                                            "isTool"
                                          );
                                          setcommands([...commands]);
                                          setFiltered([...commands]);
                                        }}
                                      />
                                    </div>
                                  </div>
                                  <div className="flex flex-row mt-2 items-center justify-between rounded-lg border p-3 shadow-sm">
                                    <div className="space-y-0.5">
                                      <Label>Follow-Up</Label>
                                      <div className="text-xs">
                                        Appears as a follow-up action on a
                                        result
                                      </div>
                                    </div>
                                    <div>
                                      <Switch
                                        defaultChecked={command.asFollowUp}
                                        onCheckedChange={() =>
                                          updateCommandProperty(
                                            !command.asFollowUp,
                                            i,
                                            "asFollowUp"
                                          )
                                        }
                                      />
                                    </div>
                                  </div>
                                </div>
                              </div>

                              <div className="flex-1 rounded-md border overflow-auto border-primary/40">
                                <div className="bg-accent/20 p-2">
                                  {command.actions.map((action, j) => {
                                    return (
                                      <>
                                        <Dialog>
                                          <DialogTrigger className="w-full">
                                            <div className="rounded-md border p-2 flex opacity-90 hover:opacity-95 hover:bg-secondary cursor-pointer w-full">
                                              <div className="opacity-70">
                                                {j + 1}
                                              </div>
                                              <div className="flex-1 justify-center align-middle items-center text-center">
                                                <TypeToText
                                                  type={action.type}
                                                />
                                              </div>
                                            </div>
                                          </DialogTrigger>
                                          <DialogContent
                                            className="flex flex-col"
                                            style={{
                                              minWidth: "60vw",
                                            }}
                                          >
                                            <DialogHeader className="flex-1">
                                              <DialogDescription>
                                                <ActionPanel
                                                  model={action}
                                                  modelChange={(action) =>
                                                    updateAction(action, i)
                                                  }
                                                />

                                                <div className="text-right">
                                                  <Button
                                                    variant="ghost"
                                                    className="text-red-500"
                                                    onClick={(e) => {
                                                      e.preventDefault();
                                                      removeAction(command, j);
                                                    }}
                                                  >
                                                    Remove action
                                                  </Button>
                                                </div>
                                              </DialogDescription>
                                            </DialogHeader>
                                            <DialogFooter
                                              style={{
                                                justifyContent: "center",
                                              }}
                                              className="pt-2"
                                            >
                                              <DialogPrimitive.Close aria-label="Close">
                                                <Button
                                                  onClick={() => {
                                                    setcommands(
                                                      updatedCommands.current
                                                    );
                                                  }}
                                                  variant="ghost"
                                                  className="mr-2"
                                                >
                                                  Ok
                                                </Button>
                                              </DialogPrimitive.Close>
                                            </DialogFooter>
                                          </DialogContent>
                                        </Dialog>
                                        <ArrowBigDown className="w-5 h-5 mx-auto text-muted-foreground opacity-50" />
                                      </>
                                    );
                                  })}

                                  <Dialog open={open}>
                                    <DialogTrigger className="w-full">
                                      <Button
                                        className="btn-xl border-2 border-dotted w-full"
                                        variant="ghost"
                                        onClick={() => setOpen(true)}
                                      >
                                        {" "}
                                        + Add{" "}
                                      </Button>
                                    </DialogTrigger>
                                    <DialogContent className="flex flex-col">
                                      <DialogHeader className="flex-1">
                                        <DialogDescription>
                                          <Command>
                                            <CommandInput
                                              style={{
                                                pointerEvents: "visible",
                                              }}
                                              tabIndex={1}
                                              placeholder="Search action..."
                                            />
                                            <CommandEmpty>
                                              Nothing found.
                                            </CommandEmpty>
                                            <CommandGroup>
                                              {DynamicActionTypes.map(
                                                (actionType) => {
                                                  return (
                                                    <CommandItem
                                                      key={actionType.id}
                                                      onSelect={() =>
                                                        addActionToCommand(
                                                          command.id,
                                                          actionType
                                                        )
                                                      }
                                                    >
                                                      {actionType.name}
                                                    </CommandItem>
                                                  );
                                                }
                                              )}
                                              <CommandItem
                                                key={"Data-Request"}
                                                onSelect={() =>
                                                  addActionToCommand(
                                                    command.id,
                                                    "VectorRequest"
                                                  )
                                                }
                                              >
                                                Data-Request
                                              </CommandItem>
                                              <CommandItem
                                                key={"DefaultLLM"}
                                                onSelect={() =>
                                                  addActionToCommand(
                                                    command.id,
                                                    "DefaultLLM"
                                                  )
                                                }
                                              >
                                                DefaultLLM
                                              </CommandItem>
                                              <CommandItem
                                                key={"LMM-Websearch"}
                                                onSelect={() =>
                                                  addActionToCommand(
                                                    command.id,
                                                    "LmmWebsearch"
                                                  )
                                                }
                                              >
                                                AI Web-Search
                                              </CommandItem>
                                              <CommandItem
                                                key={"LMM-Request"}
                                                onSelect={() =>
                                                  addActionToCommand(
                                                    command.id,
                                                    "LmmRequest"
                                                  )
                                                }
                                              >
                                                AI Text-Generation
                                              </CommandItem>
                                              <CommandItem
                                                key={"LMM-Docs-Request"}
                                                onSelect={() =>
                                                  addActionToCommand(
                                                    command.id,
                                                    "LmmDocsRequest"
                                                  )
                                                }
                                              >
                                                AI Text-Generation (RAG)
                                              </CommandItem>
                                              <CommandItem
                                                key={"LMM-Summarize"}
                                                onSelect={() =>
                                                  addActionToCommand(
                                                    command.id,
                                                    "LmmSummarize"
                                                  )
                                                }
                                              >
                                                AI Summarize
                                              </CommandItem>
                                              <CommandItem
                                                key={"Call-Js-Script"}
                                                onSelect={() =>
                                                  addActionToCommand(
                                                    command.id,
                                                    "CallJsScript"
                                                  )
                                                }
                                              >
                                                Call JS Script
                                              </CommandItem>
                                            </CommandGroup>
                                          </Command>
                                        </DialogDescription>
                                      </DialogHeader>
                                    </DialogContent>
                                  </Dialog>
                                </div>
                              </div>
                            </div>
                          </div>

                          {!command.isDefault && (
                            <div className="text-right block w-full mt-2">
                              <DialogPrimitive.Close
                                aria-label="Close"
                                className=""
                              >
                                <Button
                                  variant="ghost"
                                  className="text-red-500"
                                  onClick={() => {
                                    removeCommand(command.id);
                                  }}
                                >
                                  Delete command
                                </Button>
                              </DialogPrimitive.Close>
                            </div>
                          )}
                        </DialogDescription>
                      </DialogHeader>

                      <DialogFooter
                        style={{ justifyContent: "center" }}
                        className="pt-2"
                      >
                        <DialogPrimitive.Close aria-label="Close">
                          <Button variant="ghost" className="mr-2">
                            Cancel
                          </Button>
                          <Button
                            type="submit"
                            className="w-28"
                            variant="default"
                            onClick={saveChanges}
                          >
                            Save
                          </Button>
                        </DialogPrimitive.Close>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </div>
              </>
            ))}
          </div>
        </DraggableComponent>
        <div className="flex border-t py-2 items-center">
          <Button variant="default" onClick={addCommand}>
            + Add
          </Button>
          <Input
            ref={filterRef}
            className="border-0 mx-2 flex-1"
            placeholder="Search..."
            onChange={(e) => filter(e.target.value)}
          />
        </div>
      </div>
    </>
  );
}

export default Commands;
