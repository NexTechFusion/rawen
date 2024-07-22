import { dialog } from 'electron';

const waitForPermission = async (perm) => {
    const { askForAccessibilityAccess, askForInputMonitoringAccess, getAuthStatus } = require('node-mac-permissions');
    let interval;
    return new Promise((resolve) => {
        interval = setInterval(() => {
            if (getAuthStatus(perm) === 'authorized') {
                resolve(null);
            }
        }, 1000);
    }).then(() => {
        clearInterval(interval);
    });
};

export const waitForAllPermissions = async () => {
    const { askForAccessibilityAccess, askForInputMonitoringAccess, getAuthStatus } = require('node-mac-permissions');
    if (getAuthStatus('accessibility') !== 'authorized') {
        await dialog.showMessageBox({
            type: 'info',
            title: 'Some permissions needed',
            message: 'You will be asked for accessibility access, we need this so we can control the mouse position.'
        });
        askForAccessibilityAccess();
        await waitForPermission('accessibility');
    }

    if (getAuthStatus('input-monitoring') !== 'authorized') {
        await askForInputMonitoringAccess();
        await waitForPermission('input-monitoring');
    }
};