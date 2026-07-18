const defaultRewardImagesBucket = "reward-images";
const defaultPromotionAssetsBucket = "promotion-assets";
const maxRewardImageBytes = 2 * 1024 * 1024;
const maxPromotionAssetBytes = 2 * 1024 * 1024;
const localDevMediaPlaceholderBase64 =
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+/p9sAAAAASUVORK5CYII=";

export const localDevMediaPlaceholderUrl = `data:image/png;base64,${localDevMediaPlaceholderBase64}`;

export type MediaStorageMode = "local" | "supabase";

export interface RewardImageUploadInput {
  readonly rewardId: string;
  readonly fileName: string;
  readonly contentType: string;
  readonly dataBase64: string;
}

export interface RewardImageUploadResult {
  readonly imageUrl: string;
  readonly storagePath: string;
}

export interface PromotionAssetUploadInput {
  readonly promotionId: string;
  readonly fileName: string;
  readonly contentType: string;
  readonly dataBase64: string;
}

export interface PromotionAssetUploadResult {
  readonly assetUrl: string;
  readonly storagePath: string;
}

const readyBuckets = new Set<string>();

export function getMediaStorageMode(): MediaStorageMode {
  const rawMode = process.env.MEDIA_STORAGE_MODE?.trim().toLowerCase();
  if (!rawMode || rawMode === "local") {
    return "local";
  }
  if (rawMode === "supabase") {
    return "supabase";
  }
  throw new Error("MEDIA_STORAGE_MODE must be either 'local' or 'supabase'.");
}

export function resolveMediaUrlForRead(url: string | null | undefined): string | undefined {
  const normalizedUrl = url?.trim();
  if (!normalizedUrl) {
    return undefined;
  }
  if (getMediaStorageMode() === "local" && isSupabaseStorageUrl(normalizedUrl)) {
    return localDevMediaPlaceholderUrl;
  }
  return normalizedUrl;
}

export async function uploadRewardImageToStorage(input: RewardImageUploadInput): Promise<RewardImageUploadResult> {
  const uploaded = await uploadMediaAssetToStorage({
    dataBase64: input.dataBase64,
    bucket: process.env.SUPABASE_REWARD_IMAGES_BUCKET?.trim() || defaultRewardImagesBucket,
    contentType: input.contentType,
    fileName: input.fileName,
    maxBytes: maxRewardImageBytes,
    allowedMimeTypes: ["image/png", "image/jpeg"],
    emptyMessage: "Image file is empty.",
    sizeMessage: "Reward image must be 2 MB or smaller.",
    typeMessage: "Reward image must be PNG, JPG, or JPEG.",
    storagePath: `rewards/${sanitizePathSegment(input.rewardId, "reward-image")}/${Date.now()}-${sanitizePathSegment(input.fileName, "reward-image")}`,
  });

  return {
    imageUrl: uploaded.publicUrl,
    storagePath: uploaded.storagePath,
  };
}

export async function uploadPromotionAssetToStorage(
  input: PromotionAssetUploadInput,
): Promise<PromotionAssetUploadResult> {
  const uploaded = await uploadMediaAssetToStorage({
    dataBase64: input.dataBase64,
    bucket: process.env.SUPABASE_PROMOTION_IMAGES_BUCKET?.trim() || defaultPromotionAssetsBucket,
    contentType: input.contentType,
    fileName: input.fileName,
    maxBytes: maxPromotionAssetBytes,
    allowedMimeTypes: ["image/png", "image/jpeg", "image/gif"],
    emptyMessage: "Promotion asset is empty.",
    sizeMessage: "Promotion asset must be 2 MB or smaller.",
    typeMessage: "Promotion asset must be PNG, JPG, JPEG, or GIF.",
    storagePath: `promotions/${sanitizePathSegment(input.promotionId, "promotion-asset")}/${Date.now()}-${sanitizePathSegment(input.fileName, "promotion-asset")}`,
  });

  return {
    assetUrl: uploaded.publicUrl,
    storagePath: uploaded.storagePath,
  };
}

async function uploadMediaAssetToStorage(input: {
  readonly dataBase64: string;
  readonly bucket: string;
  readonly contentType: string;
  readonly fileName: string;
  readonly maxBytes: number;
  readonly allowedMimeTypes: readonly string[];
  readonly emptyMessage: string;
  readonly sizeMessage: string;
  readonly typeMessage: string;
  readonly storagePath: string;
}): Promise<{
  readonly publicUrl: string;
  readonly storagePath: string;
}> {
  const buffer = Buffer.from(input.dataBase64, "base64");
  if (buffer.byteLength === 0) {
    throw new Error(input.emptyMessage);
  }
  if (buffer.byteLength > input.maxBytes) {
    throw new Error(input.sizeMessage);
  }
  if (!input.allowedMimeTypes.includes(input.contentType)) {
    throw new Error(input.typeMessage);
  }

  if (getMediaStorageMode() === "local") {
    return {
      publicUrl: localDevMediaPlaceholderUrl,
      storagePath: `local-dev/${input.storagePath}`,
    };
  }

  const config = getSupabaseStorageConfig(input.bucket);
  await ensureStorageBucket({
    ...config,
    fileSizeLimit: input.maxBytes,
    allowedMimeTypes: input.allowedMimeTypes,
  });

  const uploadResponse = await fetch(
    `${config.storageBaseUrl}/object/${config.bucket}/${encodeObjectPath(input.storagePath)}`,
    {
      method: "POST",
      headers: {
        apikey: config.secretKey,
        authorization: `Bearer ${config.secretKey}`,
        "cache-control": "3600",
        "content-type": input.contentType,
        "x-upsert": "false",
      },
      body: buffer,
    },
  );

  if (!uploadResponse.ok) {
    const detail = await uploadResponse.text().catch(() => "");
    throw new Error(`Supabase Storage upload failed (${uploadResponse.status}).${detail ? ` ${detail}` : ""}`);
  }

  return {
    publicUrl: `${config.storageBaseUrl}/object/public/${config.bucket}/${encodeObjectPath(input.storagePath)}`,
    storagePath: input.storagePath,
  };
}

function getSupabaseStorageConfig(bucket: string): {
  readonly storageBaseUrl: string;
  readonly secretKey: string;
  readonly bucket: string;
} {
  const projectId = process.env.SUPABASE_PROJECT_ID?.trim();
  const secretKey = process.env.SUPABASE_SECRET_KEY?.trim();
  if (!projectId || !secretKey) {
    throw new Error(
      "Supabase media storage requires SUPABASE_PROJECT_ID and SUPABASE_SECRET_KEY when MEDIA_STORAGE_MODE=supabase.",
    );
  }
  return {
    storageBaseUrl: `https://${projectId}.supabase.co/storage/v1`,
    secretKey,
    bucket,
  };
}

async function ensureStorageBucket(config: {
  readonly storageBaseUrl: string;
  readonly secretKey: string;
  readonly bucket: string;
  readonly fileSizeLimit: number;
  readonly allowedMimeTypes: readonly string[];
}): Promise<void> {
  if (readyBuckets.has(config.bucket)) {
    return;
  }

  const createResponse = await fetch(`${config.storageBaseUrl}/bucket`, {
    method: "POST",
    headers: {
      apikey: config.secretKey,
      authorization: `Bearer ${config.secretKey}`,
      "content-type": "application/json",
    },
    body: JSON.stringify({
      id: config.bucket,
      name: config.bucket,
      public: true,
      file_size_limit: config.fileSizeLimit,
      allowed_mime_types: config.allowedMimeTypes,
    }),
  });

  if (!createResponse.ok && createResponse.status !== 409 && createResponse.status !== 400) {
    const detail = await createResponse.text().catch(() => "");
    throw new Error(`Supabase Storage bucket setup failed (${createResponse.status}).${detail ? ` ${detail}` : ""}`);
  }

  readyBuckets.add(config.bucket);
}

function sanitizePathSegment(value: string, fallback: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9._-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80) || fallback;
}

function encodeObjectPath(path: string): string {
  return path.split("/").map(encodeURIComponent).join("/");
}

function isSupabaseStorageUrl(value: string): boolean {
  const projectId = process.env.SUPABASE_PROJECT_ID?.trim();
  if (projectId && value.startsWith(`https://${projectId}.supabase.co/storage/v1/`)) {
    return true;
  }
  return /^https:\/\/[a-z0-9-]+\.supabase\.co\/storage\/v1\//i.test(value);
}
