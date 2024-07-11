import { ipcRenderer } from 'electron'
import type { ProgressInfo } from 'electron-updater'
import { useCallback, useEffect, useState } from 'react'
import Progress from '@/components/update/Progress'
import { Button } from '../ui/button'
import { versionInfo } from '@/electron/electron.handler.cmp'
import { Badge } from '../ui/badge'
import { Dialog, DialogContent, DialogDescription, DialogHeader } from "@/components/ui/dialog";
import { AlertTriangle, BadgeCheck, StopCircle } from 'lucide-react'

const Update = () => {
  const [checking, setChecking] = useState(false)
  const [updateAvailable, setUpdateAvailable] = useState(false)
  const [newVersionInfo, setNewVersionInfo] = useState<VersionInfo>()
  const [updateError, setUpdateError] = useState<ErrorType>()
  const [progressInfo, setProgressInfo] = useState<Partial<ProgressInfo> | undefined>(undefined)
  const [modalOpen, setModalOpen] = useState<boolean>(false)

  const startDownload = () => {
    ipcRenderer.invoke('start-download')
  }

  const checkUpdate = async () => {
    setChecking(true)
    /**
     * @type {import('electron-updater').UpdateCheckResult | null | { message: string, error: Error }}
     */
    const result = await ipcRenderer.invoke('check-update')
    setProgressInfo({ percent: 0 })
    setChecking(false)
    setModalOpen(true)
    if (result?.error) {
      setUpdateAvailable(false)
      setUpdateError(result?.error)
    }
  }

  const onUpdateCanAvailable = useCallback((_event: Electron.IpcRendererEvent, arg1: VersionInfo) => {
    setNewVersionInfo(arg1)
    setUpdateError(undefined)

    if (arg1.update) {
      setUpdateAvailable(true)
      startDownload();
    } else {
      setUpdateAvailable(false)
    }
  }, [])

  const onUpdateError = useCallback((_event: Electron.IpcRendererEvent, arg1: ErrorType) => {
    setUpdateAvailable(false)
    setUpdateError(arg1)
  }, [])

  const onDownloadProgress = useCallback((_event: Electron.IpcRendererEvent, arg1: ProgressInfo) => {
    setProgressInfo(arg1)
  }, [])

  const onUpdateDownloaded = useCallback((_event: Electron.IpcRendererEvent, ...args: any[]) => {
    setProgressInfo({ percent: 100 })
    ipcRenderer.invoke('quit-and-install')
  }, [])


  useEffect(() => {
    // Get version information and whether to update
    ipcRenderer.on('update-can-available', onUpdateCanAvailable)
    ipcRenderer.on('update-error', onUpdateError)
    ipcRenderer.on('download-progress', onDownloadProgress)
    ipcRenderer.on('update-downloaded', onUpdateDownloaded)
    ipcRenderer.on("server-running", (_event, _data) => {
      console.log("server-running", _data)
    });

    ipcRenderer.on("server-log-entry", (_event, data) => {
      console.log("server-log-entry", data)
    });


    return () => {
      ipcRenderer.off('update-can-available', onUpdateCanAvailable)
      ipcRenderer.off('update-error', onUpdateError)
      ipcRenderer.off('download-progress', onDownloadProgress)
      ipcRenderer.off('update-downloaded', onUpdateDownloaded)
    }
  }, [])

  return (
    <>
      <Dialog
        open={modalOpen}
        onOpenChange={() => setModalOpen(false)}
      >
        <DialogHeader className="flex-1">
          <DialogContent>
            {updateError
              ? (
                <div className='update-error'>
                  <p className='flex gap-2'><AlertTriangle className='w-5 h-5' />  Error checking the latest version.</p>
                  <p className='text-xs'>{updateError.message}</p>
                </div>
              ) : updateAvailable
                ? (
                  <div className='can-available text-center'>
                    {progressInfo && <div className='update-progress m-auto'>
                      <div className='progress-title text-xs text-center ml-2'>Downloading newest version <Badge variant='secondary' >{newVersionInfo?.newVersion}</Badge> </div>
                      <div className='progress-bar'>
                        <Progress percent={progressInfo?.percent} ></Progress>
                      </div>
                    </div>}
                  </div>
                )
                : (
                  <div className='can-not-available flex gap-2'> <BadgeCheck className='w-5 h-5' /> You have the latest version </div>
                )}
          </DialogContent>
        </DialogHeader>
      </Dialog>
      <div className="rounded-lg border p-2 mb-2 flex justify-center align-middle items-center">
        <div className="text-l flex-1">Version</div>
        <Badge variant='default' className='mr-2'>{versionInfo?.version}</Badge>
        <Button size='sm' variant='ghost' disabled={checking} onClick={checkUpdate}>
          {checking ? 'Checking...' : 'Check update'}
        </Button>
      </div>

    </>
  )
}

export default Update
