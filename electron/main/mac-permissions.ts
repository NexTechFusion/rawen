import { systemPreferences } from 'electron';

export const waitForAllPermissions = async () => {
    const isTrusted = systemPreferences.isTrustedAccessibilityClient(true);
    console.log("isTrusted", isTrusted);
};