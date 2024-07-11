export interface SuccessResponse {
    success: boolean;
}

export function asSuccess(): SuccessResponse {
    return { success: true };
}