import { useRef, useState } from "react";
import Shortcut from "./shortcuts.action.cmp";
import ShortCutCommand from "./shortcuts.transformer.cmp";
import { Button } from "@/components/ui/button";
import { randomUUID, saveStateElectron } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { Settings } from "lucide-react";
import { Input } from "@/components/ui/input";
import { ShortCutModel } from "../../../../shared/models/shortcut.model";
import { useToast } from "@/components/ui/use-toast";
import { DraggableComponent } from "@/components/ui/app-dragable-container";

type ShortcutSettingsProps = {
  viewModel: ShortCutModel[];
  update: (shortcuts: ShortCutModel[]) => void;
};

const ShortcutSettings: React.FC<ShortcutSettingsProps> = ({
  viewModel,
  update,
}) => {
  const updatedShortcuts = useRef<ShortCutModel[]>(viewModel ?? []);
  const [shortcuts, setShortcuts] = useState<ShortCutModel[]>(viewModel);
  const [filtered, setFiltered] = useState<ShortCutModel[]>(viewModel);
  const { toast } = useToast();

  const saveShortcut = () => {
    update(updatedShortcuts.current);
    setFiltered(updatedShortcuts.current);
    saveStateElectron();
  };

  const updateShortCut = (id: string, shortcut: string[]) => {
    const toUpdate = shortcuts.map((s) => {
      if (s.id === id) {
        return {
          ...s,
          shortcut,
        };
      }

      return s;
    });

    updatedShortcuts.current = toUpdate;
    setShortcuts(updatedShortcuts.current);
    setFiltered(updatedShortcuts.current);
    update(updatedShortcuts.current);
  };

  const updateCommands = (id: string, taskids: string[]) => {
    const newShortcuts = [...shortcuts];
    const shortcut = newShortcuts.find((s) => s.id === id);
    if (!shortcut) {
      return;
    }

    shortcut.cmdIds = taskids;
    updatedShortcuts.current = newShortcuts;
  };

  const addShortcut = () => {
    const newShortcut: ShortCutModel = {
      id: randomUUID(),
      name: "New Shortcut",
      shortcut: [],
      cmdIds: [],
    };

    updatedShortcuts.current = [newShortcut, ...shortcuts];
    setShortcuts(updatedShortcuts.current);
    setFiltered(updatedShortcuts.current);
  };

  const updateShortcutName = (id: string, name: string) => {
    const newShortcuts = [...shortcuts];
    const shortcut = newShortcuts.find((s) => s.id === id);
    if (!shortcut) {
      return;
    }

    shortcut.name = name;
    updatedShortcuts.current = newShortcuts;
  };

  function filter(txt: string) {
    if (txt === "") {
      setFiltered(shortcuts);
    } else {
      const filtered = shortcuts.filter((s) =>
        s.name.toLowerCase().includes(txt.toLowerCase())
      );
      setFiltered(filtered);
    }
  }

  return (
    <div className="flex flex-1 flex-col mt-1">
      <DraggableComponent className="flex-1 max165h">
        {filtered.map((shortcut) => (
          <div key={shortcut.id} className="rounded-lg border p-1 mb-2 text-sm">
            <div className="flex flex-1">
              <div className="flex flex-1 pl-1 items-center text-base">
                {shortcut.name}
              </div>
              <div className="pb-1 pr-2">
                <Shortcut shortcut={shortcut} updateShortcut={updateShortCut} />
              </div>
              <div className="flex items-center">
                <Dialog>
                  <DialogTrigger>
                    <Button variant="outline">
                      <Settings className="w-3 h-3" />
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogDescription>
                        <div className="text-left">
                          <div className="mb-2">
                            <div>Name</div>
                            <Input
                              defaultValue={shortcut.name}
                              onBlur={(e) =>
                                updateShortcutName(shortcut.id, e.target.value)
                              }
                            />
                          </div>
                          <div className="mb-2 pt-2">
                            <div className="font-medium text-lg text-primary">
                              Commands
                            </div>
                            <hr />
                            <div className="bg-accent/10 p-2">
                              <ShortCutCommand
                                shortcut={shortcut}
                                update={updateCommands}
                                isStartup={false}
                              />
                            </div>
                          </div>
                          <div className="text-right mt-2">
                            <Button
                              variant="ghost"
                              className="text-red-500"
                              onClick={() => {
                                const updatedShortcuts = shortcuts.filter(
                                  (s) => s.id !== shortcut.id
                                );
                                setShortcuts(updatedShortcuts);
                                setFiltered(updatedShortcuts);
                                update(updatedShortcuts);
                              }}
                            >
                              Delete shortcut
                            </Button>
                          </div>
                        </div>
                      </DialogDescription>
                    </DialogHeader>

                    <DialogFooter
                      style={{ justifyContent: "center" }}
                      className="pt-2"
                    >
                      <DialogPrimitive.Close aria-label="Close">
                        <Button variant="ghost">Cancel</Button>
                        <Button
                          type="submit"
                          className="w-28"
                          variant="default"
                          onClick={saveShortcut}
                        >
                          Save
                        </Button>
                      </DialogPrimitive.Close>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
            </div>
          </div>
        ))}
      </DraggableComponent>
      <div className="flex border-t py-2">
        <Button variant="default" onClick={addShortcut}>
          + Add
        </Button>
        <Input
          name="prompt"
          className="border-0 mx-2 flex-1"
          placeholder="Search..."
          onChange={(e) => filter(e.target.value)}
        />
      </div>
    </div>
  );
};

export default ShortcutSettings;
