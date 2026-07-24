export function normalizeQrScannerData(data: string): string {
  return data.trim();
}

export function shouldAcceptQrScannerData(data: string, lastAcceptedData: string): boolean {
  const normalized = normalizeQrScannerData(data);
  return normalized.length > 0 && normalized !== lastAcceptedData;
}
