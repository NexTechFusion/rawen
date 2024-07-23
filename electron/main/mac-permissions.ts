import { systemPreferences } from 'electron';

export const waitForAllPermissions = async () => {
    const hasPermissions = systemPreferences.isTrustedAccessibilityClient(false);
    console.log("hasPermissions", hasPermissions);

    if (!hasPermissions) {
        setTimeout(() => systemPreferences.isTrustedAccessibilityClient(true), 1000);
    }
};