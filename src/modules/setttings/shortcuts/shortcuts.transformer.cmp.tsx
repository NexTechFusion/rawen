import React, { useState, useEffect } from "react";
import { TrashIcon, X } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAppContext } from "@/state/app.state";
import { ShortCutModel } from "../../../../shared/models/shortcut.model";
import { Button } from "@/components/ui/button";

type ComponentProps = {
  shortcut: ShortCutModel;
  update: (id: string, commands: string[]) => void;
  isStartup: boolean;
};

const ShortCutCommand: React.FC<ComponentProps> = ({
  shortcut,
  update,
  isStartup,
}) => {
  const [commands, setcommands] = useState<string[]>(shortcut.cmdIds ?? []);
  const { state } = useAppContext();

  useEffect(() => {
    update(shortcut.id, commands);
  }, [commands]);

  const removeTask = (taskId: string) => {
    const newcommands = commands.filter((t) => t !== taskId);
    setcommands(newcommands);
  };

  const assignTask = (taskId: string) => {
    const updatecommands = [...commands, taskId];
    setcommands(updatecommands);
  };

  function ListItems() {
    return commands.map((taskId) => {
      const taskData = state?.commands.find((t) => t.id === taskId);
      return (
        <div key={taskId} className="rounded-lg border p-2 mb-2 flex">
          <span className="flex-1">{taskData?.name ?? "INVALID"}</span>
          <TrashIcon
            className="w-3 h-3 mt-1 opacity-50 cursor-pointer"
            onClick={() => removeTask(taskId)}
          />
        </div>
      );
    });
  }

  return (
    <>
      <ListItems />
      <DropdownMenu>
        <DropdownMenuTrigger className="w-full mt-4">
          <Button
            className="btn-xl border-2 border-dotted w-full"
            variant="ghost"
          >
            {" "}
            + Add{" "}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-56">
          <div className="overflow-auto" style={{ maxHeight: "40vh" }}>
            {state?.commands?.map((task) => (
              <>
                <DropdownMenuItem
                  key={task.id}
                  onClick={() => assignTask(task.id)}
                >
                  {task.name}
                </DropdownMenuItem>
              </>
            ))}
          </div>
        </DropdownMenuContent>
      </DropdownMenu>
    </>
  );
};

export default ShortCutCommand;
