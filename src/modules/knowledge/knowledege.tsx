import { TrainerApi } from "@/api/train.api";
import { Input } from "@/components/ui/input";
import {
  CheckIcon,
  Loader2,
  SendIcon,
  SettingsIcon,
  UploadCloud,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useToast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Label } from "@/components/ui/label";
import { VectorApi } from "@/api/vector.api";
import KnowledgeHistory from "./knowledge-history";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ImageVectorApi } from "@/api/image-vector.api";

function Knowledege() {
  const [dragActive, setDragActive] = useState<boolean>(false);
  const inputRef = useRef<any>(null);
  const [files, setFiles] = useState<File[]>([]);
  const [isTraining, setIsTraining] = useState<boolean>(false);
  const [trainingSucceeded, setTrainingSucceeded] = useState<boolean>(false);
  const [webSettings, setWebSettings] = useState<any>({});
  const [docs, setDocs] = useState<any>({});
  const [images, setImages] = useState<any>({});
  const { toast } = useToast();

  useEffect(() => {
    fetchDocs();
    fetchImages();
  }, [isTraining]);

  useEffect(() => {
    if (files.length > 0) {
      trainFiles();
    }
  }, [files]);

  useEffect(() => {
    if (trainingSucceeded) {
      setTimeout(() => {
        setTrainingSucceeded(false);
      }, 3000);
    }
  }, [trainingSucceeded]);

  function fetchDocs() {
    VectorApi.getStoreInfo().then((allDocs) => {
      setDocs(allDocs);
    });
  }

  function fetchImages() {
    // ImageVectorApi.getStoreInfo({}).then((images) => {
    //   setImages(images);
    // }); TODO
  }

  function uhError(message?: string) {
    toast({
      variant: "destructive",
      title: "Uh oh! Something went wrong.",
      description: message ?? "There was a problem with your request.",
    });
    setTrainingSucceeded(false);
  }

  async function trainFiles() {
    try {
      setTrainingSucceeded(false);
      setIsTraining(true);
      await TrainerApi.trainFiles(files);
      setTrainingSucceeded(true);
    } catch (error) {
      uhError();
    } finally {
      setIsTraining(false);
    }
  }

  const trainInput = async (e: any) => {
    try {
      setTrainingSucceeded(false);
      const inputval = e.target[0].value;
      setIsTraining(true);
      await TrainerApi.trainInput(inputval);
      setTrainingSucceeded(true);
    } catch (error) {
      uhError();
    } finally {
      setIsTraining(false);
    }
  };

  const trainWebsite = async (e: any) => {
    try {
      setTrainingSucceeded(false);
      const url = e.target[0].value;
      setIsTraining(true);
      const maxDepth = webSettings.maxDepth ?? 1;

      //make regex to check if url is a file ending
      const urlIsFileEnding =
        /\.(pdf|doc|docx|xls|xlsx|ppt|pptx|txt|csv|png|jpg|jpeg|webp|wav)$/i.test(
          url.toLowerCase()
        );

      if (urlIsFileEnding) {
        throw new Error(
          "File URLs are not supported. Please enter a valid url."
        );
      }

      if (!url) {
        throw new Error("Please enter a valid url.");
      }

      await TrainerApi.trainWebsite(url, { maxDepth });
      setTrainingSucceeded(true);
    } catch (error) {
      uhError(error.message);
    } finally {
      setIsTraining(false);
    }
  };

  function handleChange(e: any) {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      for (let i = 0; i < e.target.files["length"]; i++) {
        setFiles((prevState: any) => [...prevState, e.target.files[i]]);
      }
    }
  }

  function handleDrop(e: any) {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      for (let i = 0; i < e.dataTransfer.files["length"]; i++) {
        setFiles((prevState: any) => [...prevState, e.dataTransfer.files[i]]);
      }
    }
  }

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

  function openFileExplorer() {
    inputRef.current.value = "";
    inputRef.current.click();
  }

  function preventer(e: any) {
    e.preventDefault();
    e.stopPropagation();
  }

  const onDeleteImage = async (data: { id: string; filePath: string }) => {
    try {
      await ImageVectorApi.deleteById(data.id, undefined, data.filePath);
      fetchImages();
    } catch (error) {
      uhError();
    }
  };

  const onDeleteSource = async (id: any) => {
    try {
      await VectorApi.deleteById(id);
      fetchDocs();
    } catch (error) {
      uhError();
    }
  };

  const onUpdateSource = async (fileData: any) => {
    try {
      await VectorApi.updateFile(fileData);
      fetchDocs();
    } catch (error) {
      uhError();
    }
  };

  function TrainPanel() {
    return (
      <>
        <div
          className={
            `${dragActive ? "bg-accent" : ""}` +
            " flex items-center justify-center h-full w-full just-drag"
          }
          onDragEnter={handleDragEnter}
          onSubmit={(e) => e.preventDefault()}
          onDrop={handleDrop}
          onDragLeave={handleDragLeave}
          onDragOver={handleDragOver}
        >
          <div
            className={`rounded-lg  min-h-[10rem] text-center flex flex-col items-center justify-center`}
          >
            <form onClick={openFileExplorer} className="cursor-pointer">
              <input
                placeholder="fileInput"
                className="hidden"
                ref={inputRef}
                type="file"
                multiple={true}
                onChange={handleChange}
                accept=".xlsx,.xls,.png,.md,.jpg,.jpeg,.doc,.docx,.ppt,.pptx,.txt,.pdf,.txt,.html,.csv"
              />

              <p>
                <UploadCloud className="m-auto mb-2" />
                <b>Click to upload</b> or drag & drop
              </p>
            </form>
            <div className="divider">OR</div>
            <form onSubmit={trainWebsite} className="">
              <Popover>
                <PopoverTrigger asChild>
                  <div className="flex gap-x-2 text-xs cursor-pointer absolute z-10 opacity-40 hover:opacity-90 knowledge-settings">
                    <SettingsIcon className="w-3 h-3" />
                  </div>
                </PopoverTrigger>
                <PopoverContent
                  className="w-80"
                  onCloseAutoFocus={() => {
                    setWebSettings({ ...webSettings });
                  }}
                >
                  <div className="grid gap-4">
                    <div className="space-y-2">
                      <h4 className="font-medium leading-none">
                        Ingest settings
                      </h4>
                    </div>
                    <div className="grid gap-2">
                      <div className="grid grid-cols-3 items-center gap-4">
                        <Label htmlFor="width">Max depth</Label>
                        <Input
                          defaultValue={webSettings.maxDepth ?? 1}
                          onChange={(e) => {
                            webSettings.maxDepth = e.target.value;
                          }}
                          className="col-span-2 h-8"
                        />
                      </div>
                    </div>
                    {/* <div className="grid gap-2">
                                            <div className="grid grid-cols-3 items-center gap-4">
                                                <Label htmlFor="width">Metadata</Label>
                                                <Input defaultValue={webSettings.metadata} onChange={(e) => {
                                                    webSettings.metadata = e.target.value;
                                                }} className="col-span-2 h-8"
                                                />
                                            </div>
                                        </div> */}
                  </div>
                </PopoverContent>
              </Popover>

              <div className="flex relative justify-center items-center w-full">
                <Input
                  onClick={preventer}
                  type="text"
                  placeholder="Website"
                  name="url"
                  className="flex-1 pr-10 inputer"
                />
                <Button
                  type="submit"
                  className="text-muted-foreground ml-2 absolute right-0"
                  variant="ghost"
                >
                  <SendIcon className="w-4 h-4 " />
                </Button>
              </div>
            </form>
            <div className="divider">OR</div>
            <form onSubmit={trainInput}>
              <div className="flex relative justify-center items-center w-full">
                <Input
                  onClick={preventer}
                  type="text"
                  placeholder="Text"
                  className="flex-1 pr-10"
                  name="textval"
                />
                <Button
                  type="submit"
                  className="text-muted-foreground ml-2 absolute right-0"
                  variant="ghost"
                >
                  <SendIcon className="w-4 h-4 " />
                </Button>
              </div>
            </form>
          </div>

          <img
            src="thinking.png"
            className="absolute bottom-0 right-0 opacity-5 w-48 -z-10"
          />
        </div>
      </>
    );
  }

  function LoadingPanel() {
    return (
      <>
        <div className={" flex items-center justify-center h-full w-full"}>
          <div className="slide-in-top flex">
            <h3>Training in progress...</h3>
            <Loader2 className="animate-spin ml-2" />
          </div>
        </div>
      </>
    );
  }

  function TrainingSucceededPanel() {
    return (
      <>
        <div className={" flex items-center justify-center h-full w-full"}>
          <div
            className="slide-in-top  text-green-600 text-center items-center cursor-pointer"
            onClick={() => setTrainingSucceeded(false)}
          >
            <div className="animate-bounce bg-transparent m-auto dark:bg-slate-800 p-2 w-10 h-10 ring-1 ring-slate-900/5 dark:ring-slate-200/20 shadow-lg rounded-full flex items-center justify-center">
              <CheckIcon className="w-4 h-4" />
            </div>
            <h3 className="block">Training succeeded!</h3>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Tabs defaultValue="learn" className="w-full flex-1 flex flex-col">
        <TabsList className="w-full">
          <TabsTrigger value="learn">Learn</TabsTrigger>
          <TabsTrigger value="khw">
            Knowledge ({Object.keys(docs ?? {}).length})
          </TabsTrigger>
        </TabsList>
        <TabsContent value="learn" className="flex-1">
          <div className="h-full">
            {trainingSucceeded && <TrainingSucceededPanel />}
            {!isTraining && !trainingSucceeded && <TrainPanel />}
            {isTraining && <LoadingPanel />}
          </div>
        </TabsContent>
        <TabsContent value="khw" className="flex-1">
          <KnowledgeHistory
            docs={docs}
            images={images}
            onDelete={onDeleteSource}
            onUpdate={onUpdateSource}
            onDeleteImage={onDeleteImage}
          />
        </TabsContent>
      </Tabs>
    </>
  );
}

export default Knowledege;
