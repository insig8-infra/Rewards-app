export const NO_INTERNET_MESSAGE = "No Internet Found - connect to wifi or start mobile data";

export interface NetworkReachabilityState {
  readonly isConnected?: boolean | null;
  readonly isInternetReachable?: boolean | null;
}

export function isOfflineNetworkState(state?: NetworkReachabilityState | null): boolean {
  return state?.isConnected === false || state?.isInternetReachable === false;
}

export function normalizeNetworkError(error: unknown): Error {
  if (isLikelyNetworkFailure(error)) {
    return new Error(NO_INTERNET_MESSAGE);
  }

  return error instanceof Error ? error : new Error("Request failed");
}

export function isLikelyNetworkFailure(error: unknown): boolean {
  if (error instanceof TypeError) {
    return true;
  }

  const message = error instanceof Error ? error.message : String(error ?? "");
  const normalized = message.toLowerCase();

  return (
    normalized.includes("network request failed") ||
    normalized.includes("failed to fetch") ||
    normalized.includes("networkerror") ||
    normalized.includes("load failed") ||
    normalized.includes("internet connection appears to be offline")
  );
}
