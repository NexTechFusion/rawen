import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import ShortcutSettings from "./shortcuts/shortcuts.settings.cmp";
import { useAppContext } from "@/state/app.state";
import Llm from "./llm/LLM";
import Commands from "../commands/commands";
import GeneralSettings from "./general/general-settings";

function Settings() {
  const { state, dispatch } = useAppContext();

  return (
    <Tabs defaultValue="general" className="w-full flex-1 flex flex-col">
      <TabsList className="w-full">
        <TabsTrigger value="general">General</TabsTrigger>
        <TabsTrigger value="shortcuts">Shortcuts</TabsTrigger>
        <TabsTrigger value="keyvalue">Keys</TabsTrigger>
        <TabsTrigger value="tasks">Commands</TabsTrigger>
      </TabsList>
      <TabsContent value="general">
        <div className="p-2">
          <GeneralSettings
            viewModel={state?.generalSettings || {}}
            update={(generalSettings) =>
              dispatch({
                ...state,
                generalSettings,
              })
            }
          />
        </div>
      </TabsContent>
      <TabsContent value="shortcuts" className="flex-1 flex m-0">
        <div className="px-2 flex-1 flex-col flex">
          <ShortcutSettings
            viewModel={state?.shortcuts || []}
            update={(shortcuts) =>
              dispatch({
                ...state,
                shortcuts,
              })
            }
          />
        </div>
      </TabsContent>
      <TabsContent value="tasks" className="flex-1 flex m-0">
        <div className="px-2 flex-1 flex-col flex">
          <Commands />
        </div>
      </TabsContent>
      <TabsContent value="keyvalue" className="flex-1 flex m-0">
        <div className="px-2 flex-1 flex-col flex">
          <Llm
            updateCommands={(commands) =>
              dispatch({
                ...state,
                commands,
              })
            }
            setLlm={(llm) =>
              dispatch({
                ...state,
                keyValues: llm,
              })
            }
            llm={state?.keyValues}
          />
        </div>
      </TabsContent>
    </Tabs>
  );
}

export default Settings;
