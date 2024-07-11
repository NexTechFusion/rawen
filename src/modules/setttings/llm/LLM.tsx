import {
  KeyValueSetting,
  KeyValueSettings,
} from "../../../../shared/models/app-state.model";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Edit2Icon, MinusCircle, Trash, X } from "lucide-react";
import { appState } from "@/state/app.state";
import { Badge } from "@/components/ui/badge";

type Llmprops = {
  llm: KeyValueSettings;
  setLlm: (llm: KeyValueSettings) => void;
  updateCommands?: (commands: any) => void;
};

const edits = {};

const Llm: React.FC<Llmprops> = ({ llm, setLlm, updateCommands }) => {
  function SettingsList() {
    function SettingKeyValue({ setting }: { setting: KeyValueSetting }) {
      return Object.keys(setting?.values ?? {}).map((key, index) => {
        const keyname = key;
        const value = setting?.values[key];

        return (
          <>
            <div key={index} className="text-sm flex gap-2 items-center my-2">
              <div className="flex-2">
                <Input
                  className="w-full"
                  disabled={setting.isDefault}
                  defaultValue={keyname}
                  onBlur={(e) => {
                    setLlm({
                      ...llm,
                      settings: llm.settings.map((s) => {
                        if (s.id == setting.id) {
                          s.values[e.target.value] = value;
                        }
                        return s;
                      }),
                    });
                  }}
                />
              </div>
              <div> : </div>
              <div className="flex-1">
                <Input
                  className="w-full flex-1"
                  defaultValue={value}
                  onBlur={(e) => {
                    setLlm({
                      ...llm,
                      settings: llm.settings.map((s) => {
                        if (s.id == setting.id) {
                          s.values[keyname] = e.target.value;
                        }
                        return s;
                      }),
                    });
                  }}
                />
              </div>
              {!setting.isDefault && (
                <div className="px-2">
                  <MinusCircle
                    className="w-3 h-3 cursor-pointer"
                    onClick={() => {
                      setLlm({
                        ...llm,
                        settings: llm.settings.map((s) => {
                          if (s.id == setting.id) {
                            delete s.values[keyname];
                          }
                          return s;
                        }),
                      });
                    }}
                  />
                </div>
              )}
            </div>
          </>
        );
      });
    }

    const onDeleteSetting = (setting: KeyValueSetting) => {
      const confirm = window.confirm(
        "Are you sure you want to delete this setting?"
      );
      if (!confirm) {
        return;
      }

      setLlm({
        ...llm,
        settings: llm.settings.filter((s) => s.id != setting.id),
      });
    };

    const DefaultBtn = ({ settingId }) => {
      const allCommandsWithEndpointId = appState.commands.filter(
        (command) =>
          command.actions.find((o: any) => o.endpointId != null) != null
      );

      const allCommandsBySetting = allCommandsWithEndpointId.every(
        (command) =>
          command.actions.find((o: any) => o.endpointId == settingId) != null
      );

      if (allCommandsBySetting) {
        return <Badge variant="default">Default</Badge>;
      }

      // sets all commands with endpointId to settingId
      const setAllCommaands = () => {
        appState.commands.forEach((command) => {
          command.actions.forEach((action: any) => {
            if (action.endpointId != null) {
              action.endpointId = settingId;
            }
          });
        });

        updateCommands(appState.commands);
      };

      return (
        <Badge
          variant="outline"
          className="hover:bg-primary cursor-pointer"
          onClick={setAllCommaands}
        >
          set default
        </Badge>
      );
    };

    return llm.settings?.map((setting) => {
      const isEdit = edits[setting.id] == true;
      return (
        <>
          <div key={setting.id} className="rounded-lg border p-2 mb-2">
            <div className="flex flex-1 pl-1 items-center pb-1 text-sm">
              <div className="flex-1">
                {!isEdit && (
                  <>
                    <div className="flex items-center gap-1 text-lg">
                      <span className="flex gap-2">
                        <span>{setting.name}</span>
                        <span>{<DefaultBtn settingId={setting.id} />}</span>
                      </span>
                      {!setting.isDefault && (
                        <Edit2Icon
                          className="w-2 h-2 cursor-pointer"
                          onClick={() => {
                            edits[setting.id] = !edits[setting.id];
                            setLlm({ ...llm });
                          }}
                        />
                      )}
                    </div>
                  </>
                )}
                {isEdit && (
                  <>
                    <div className="flex items-center gap-1">
                      <Input
                        className="w-full"
                        defaultValue={setting.name}
                        onBlur={(e) => {
                          setLlm({
                            ...llm,
                            settings: llm.settings.map((s) => {
                              if (s.id == setting.id) {
                                s.name = e.target.value;
                              }
                              return s;
                            }),
                          });

                          edits[setting.id] = !edits[setting.id];
                        }}
                      />
                      {!setting.isDefault && (
                        <X
                          className="w-3 h-3 cursor-pointer mr-2"
                          onClick={() => {
                            edits[setting.id] = !edits[setting.id];
                            setLlm({ ...llm });
                          }}
                        />
                      )}
                    </div>
                  </>
                )}
              </div>
              {!setting.isDefault && (
                <Trash
                  onClick={() => onDeleteSetting(setting)}
                  className="w-3 h-3 cursor-pointer"
                />
              )}
            </div>
            <div>
              <SettingKeyValue setting={setting} />
              <Button
                className="mt-2 btn-xs text-xs"
                variant="ghost"
                onClick={() => {
                  setLlm({
                    ...llm,
                    settings: llm.settings.map((s) => {
                      if (s.id == setting.id) {
                        s.values[
                          "Key" + Object.keys(s.values ?? {}).length + 1
                        ] = "Value";
                      }
                      return s;
                    }),
                  });
                }}
              >
                + Add key-value
              </Button>
            </div>
          </div>
        </>
      );
    });
  }

  const addSetting = () => {
    setLlm({
      ...llm,
      settings: [
        {
          id: Math.random().toString(36).substr(2, 9),
          name: "New setting",
          values: {
            Key: "Value",
          },
        },
        ...(llm.settings ?? []),
      ],
    });
  };

  return (
    <>
      <div className="flex flex-1 flex-col">
        <div className="flex-1 max165h">
          <SettingsList />
        </div>
        <div className="flex border-t py-2">
          <Button variant="default" onClick={addSetting}>
            + Add
          </Button>
        </div>
      </div>
    </>
  );
};

export default Llm;
