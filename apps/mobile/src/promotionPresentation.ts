const localDevMediaPlaceholderPrefix = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAE";

export function isLocalDevPromotionAsset(assetUrl: string | undefined): boolean {
  return Boolean(assetUrl?.startsWith(localDevMediaPlaceholderPrefix));
}
