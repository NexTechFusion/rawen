import { Button } from '@/components/ui/button';
import React, { useState, useEffect } from 'react';
import { mapKeycodesToKeysElectron } from '../../../../shared/utils/keymap.util';
import { ShortCutModel } from '../../../../shared/models/shortcut.model';
import { registerKeyPressHandler, registerKeyReleaseHandler, setCanClick } from '@/electron/electron-ipc-handlers';

type ShortcutProps = {
    shortcut: ShortCutModel;
    updateShortcut: (id: string, shortcut: string[]) => void;
};

const Shortcut: React.FC<ShortcutProps> = ({ shortcut: initalShortcut, updateShortcut }) => {
    const [recording, setRecording] = useState<boolean>(false);
    const [shortcut, setShortcutState] = useState<string[]>([]);

    // useEffect(() => {
    //     if (recording) {
    //         const handleKeyDown = (e: any) => {
    //             e.preventDefault();
    //             if (!shortcut.includes(e.keyCode)) {
    //                 setShortcutState([...shortcut, e.keyCode]);
    //             }
    //         };
    //         const handleKeyUp = () => {
    //             setRecording(false);
    //         };
    //         window.addEventListener('keydown', handleKeyDown);
    //         window.addEventListener('keyup', handleKeyUp);

    //         return () => {
    //             window.removeEventListener('keydown', handleKeyDown);
    //             window.removeEventListener('keyup', handleKeyUp);
    //         };
    //     }
    // }, [recording, shortcut]);

    useEffect(() => {
        if (recording) {

            registerKeyPressHandler((data) => {
                if (!shortcut.includes(data)) {
                    setShortcutState([...shortcut, data]);
                }
            });

            registerKeyReleaseHandler(() => {
                setRecording(false);
            });

            return () => {
                // remove listeners from ipcRenderer
            };
        }
    }, [recording, shortcut]);

    useEffect(() => {
        if (!recording && shortcut.length) {
            updateShortcut(
                initalShortcut.id,
                shortcut
            );
            setShortcutState([]);
        }

        setCanClick(!recording);

    }, [recording]);

    const startRecording = () => {
        setShortcutState([]);
        setRecording(true);
    };


    return (
        <Button variant='outline' className='flex' onMouseDown={startRecording}>
            <p>{recording ? (shortcut.length <= 0 ? "- Press keys -" : mapKeycodesToKeysElectron(shortcut).join('+')) : mapKeycodesToKeysElectron(initalShortcut.shortcut).join("+")}</p>
        </Button>
    );
};

export default Shortcut;
