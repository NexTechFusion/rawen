import {
  EditIcon,
  ExternalLink,
  EyeIcon,
  KeyIcon,
  Keyboard,
  MouseIcon,
  PlayIcon,
} from "lucide-react";
import { useEffect, useState } from "react";
import { appState, changeState } from "@/state/app.state";
import {
  Table,
  TableBody,
  TableCell,
  TableRow,
} from "../../components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogTrigger,
} from "../../components/ui/dialog";
import { Button } from "../../components/ui/button";
import { DialogClose } from "@radix-ui/react-dialog";
import { TinyPreviewIcon } from "@/modules/interaction/tiny-preview-icon";
import { saveStateElectron, toBase64 } from "@/lib/utils";
import { EventStore, MimicStore } from "./taskflow.model";

export function RecordedTasksList() {
  const [tasksList, setTasksList] = useState<MimicStore[]>([]);
  const [selectedTask, setSelectedTask] = useState<MimicStore | null>(null);

  useEffect(() => {
    const tasks = appState?.taskFlows ?? [];
    setTasksList(tasks);
  }, []);

  useEffect(() => {
    if (selectedTask) {
      console.log("selectedTask", selectedTask);
    }
  }, [selectedTask]);

  const deleteTask = (task: MimicStore) => {
    const newTasks = tasksList.filter((item) => item.id !== task.id);
    setTasksList(newTasks);
    changeState({ ...appState, taskFlows: newTasks });
    saveStateElectron();
  };

  const playTask = (task: MimicStore) => {
    console.log("playTask", task);
  };

  const EventPanel = ({ event }: { event: EventStore }) => {
    let eventText = "";
    let explainationText = event.explain?.replace("undefined", "") ?? undefined;
    let action = explainationText ? (
      <EyeIcon className="w-4 h-4 mr-2" />
    ) : undefined;
    let icon;
    let tinyImage;

    if (event.isMouseClick) {
      eventText = "Browse";
      icon = <MouseIcon className="w-4 h-4 mr-2"></MouseIcon>;
      tinyImage = (
        <TinyPreviewIcon
          src={toBase64(Buffer.from(event.mouse_area_screenshot))}
        />
      );
    }

    if (event.keyboardText) {
      eventText += `Text type: "${event.keyboardText}"`;

      if (event.keyboardTextReason) {
        eventText += ` (${event.keyboardTextReason})`;
      }

      icon = <Keyboard className="w-4 h-4 mr-2"></Keyboard>;
    }

    if (event.isOpenApp) {
      eventText += `Open app: "${event.app_path.split("\\").pop()}"`;
      icon = <ExternalLink className="w-4 h-4 mr-2"></ExternalLink>;
    }

    if (event.isKeyboardEnter) {
      const addition = eventText ? " and " : "";
      eventText += addition + "Key press : Enter";
      icon = <Keyboard className="w-4 h-4 mr-2"></Keyboard>;
    }

    return (
      <>
        {eventText && (
          <li>
            <div className="py-2 text-xs">
              <div className="flex">
                {icon}
                <span dangerouslySetInnerHTML={{ __html: eventText }}></span>
                {tinyImage}
              </div>
            </div>
          </li>
        )}
        {explainationText && (
          <li>
            <div className="flex text-xs py-2">
              {action}
              {explainationText}
            </div>
          </li>
        )}
      </>
    );
  };

  const addNewFlow = () => {
    const newFlow: MimicStore = {
      id: Math.random().toString(),
      description: "New Flow",
      events: [],
    };

    setTasksList([...tasksList, newFlow]);
    changeState({ ...appState, taskFlows: [...tasksList, newFlow] });
    saveStateElectron();
  };

  return (
    <>
      <div className="flex flex-1 flex-col">
        <div className="flex-1">
          <Table className="">
            <TableBody>
              {tasksList.map((item: MimicStore) => (
                <TableRow key={item.id}>
                  <Dialog>
                    <DialogTrigger
                      className="w-full"
                      onClick={(ev) => {
                        setSelectedTask(item);
                      }}
                    >
                      <TableCell className="p-4 w-full text-left">
                        {item.description}
                      </TableCell>
                      <TableCell className="text-right">
                        <PlayIcon
                          onClick={(ev) => {
                            ev.preventDefault();
                            ev.stopPropagation();
                            playTask(item);
                          }}
                          className="w-4 h-4 mr-2 cursor-pointer hover:text-primary no-drag"
                          id={item.id}
                        ></PlayIcon>
                      </TableCell>
                    </DialogTrigger>

                    <DialogContent
                      className="no-drag"
                      style={{ maxHeight: "90vh", overflow: "auto" }}
                    >
                      <div>
                        {selectedTask && (
                          <>
                            <div className="mb-2">
                              {selectedTask.description}
                            </div>
                            <div>
                              <ol className="list-decimal">
                                {selectedTask.events.map((event) => (
                                  <EventPanel key={event.index} event={event} />
                                ))}
                              </ol>
                            </div>
                          </>
                        )}
                      </div>
                      <DialogFooter>
                        <Button
                          type="button"
                          variant="ghost"
                          className="text-red-500"
                          onClick={() => deleteTask(item)}
                        >
                          Delete flow
                        </Button>
                        <DialogClose asChild>
                          <Button type="button" variant="ghost">
                            Close
                          </Button>
                        </DialogClose>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
        <div className="flex border-t py-2 items-center px-2">
          <Button variant="default" onClick={addNewFlow}>
            + New Flow
          </Button>
        </div>
      </div>
    </>
  );
}
