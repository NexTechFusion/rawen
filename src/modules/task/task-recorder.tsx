import { pushTaskExplain, pushTaskMark } from "@/code/code-functions.util";
import { Input } from "@/components/ui/input";
import { CheckCheck, MicIcon, PencilLine, StopCircleIcon } from "lucide-react";
import { useRef, useState } from "react";

export function TaskRecord({ stopTaskRecording }) {
  const [textSubmitted, setTextSubmitted] = useState(false);
  const inputRef = useRef<HTMLInputElement>();

  const stop = () => {
    stopTaskRecording();
  };

  const onSubmit = () => {
    setTextSubmitted(true);

    pushTaskExplain(inputRef.current.value);
    inputRef.current.value = "";

    setTimeout(() => {
      setTextSubmitted(false);
    }, 2000);
  };

  const onMark = async (event) => {
    event.preventDefault();
    pushTaskMark();
  };

  return (
    <>
      <div className="fixed left-0 top-0 w-full justify-center h-full z-40 dragger flex-force bg-background items-center">
        <div className="flex gap-2 items-center justify-center w-full flex-1">
          <div>
            <StopCircleIcon
              onClick={stop}
              className="animate-pulse text-red-500 h-5 mx-2 w-5 ml-4 no-drag cursor-pointer hover:text-primary"
            />
          </div>
          <div className="flex-1 relative">
            {textSubmitted && (
              <div className="absolute top-0 right-0 bg-background text-green-500 w-full h-full flex justify-center items-center">
                <div className="slide-in-top flex justify-center items-center">
                  <CheckCheck className="h-4 w-4 mx-2" />
                  Thank you!
                </div>
              </div>
            )}
            <Input
              ref={inputRef}
              spellCheck={false}
              onKeyDown={(e) => {
                if (e.key == "Enter") {
                  e.preventDefault();
                  e.stopPropagation();
                  onSubmit();
                }
              }}
              className="w-full no-drag text-sm"
              placeholder="Explain sth..."
            />
          </div>
          {/* <div className="flex justify-center items-center">
            <PencilLine
              onClick={(event) => onMark(event)}
              className="h-4 w-4 no-drag mx-2 mr-4 cursor-pointer hover:text-primary"
            />
          </div> */}
        </div>
      </div>
    </>
  );
}
