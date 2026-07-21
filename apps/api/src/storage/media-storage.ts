import { GetObjectCommand, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import sharp from "sharp";

const defaultRewardImagesBucket = "reward-images";
const defaultPromotionAssetsBucket = "promotion-assets";
const maxRewardImageBytes = 2 * 1024 * 1024;
const maxPromotionAssetBytes = 2 * 1024 * 1024;
const defaultMediaImageTargetBytes = 20 * 1024;
const defaultMediaImageHardLimitBytes = 32 * 1024;
const defaultMediaImageMaxDimensionPx = 640;
const defaultMediaImageMinDimensionPx = 280;
const localDevMediaPlaceholderBase64 =
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+/p9sAAAAASUVORK5CYII=";

export const localDevMediaPlaceholderUrl = `data:image/png;base64,${localDevMediaPlaceholderBase64}`;

export type MediaStorageMode = "local" | "railway" | "supabase";

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
let railwayS3Client: S3Client | undefined;

export function getMediaStorageMode(): MediaStorageMode {
  const rawMode = process.env.MEDIA_STORAGE_MODE?.trim().toLowerCase();
  if (!rawMode || rawMode === "local") {
    return "local";
  }
  if (rawMode === "railway" || rawMode === "s3") {
    return "railway";
  }
  if (rawMode === "supabase") {
    return "supabase";
  }
  throw new Error("MEDIA_STORAGE_MODE must be one of 'local', 'railway', or 'supabase'.");
}

export function resolveMediaUrlForRead(url: string | null | undefined): string | undefined {
  const normalizedUrl = url?.trim();
  if (!normalizedUrl) {
    return undefined;
  }
  if (getMediaStorageMode() === "local" && (isSupabaseStorageUrl(normalizedUrl) || isRailwayMediaUrl(normalizedUrl))) {
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
    allowedMimeTypes: ["image/png", "image/jpeg", "image/webp"],
    emptyMessage: "Image file is empty.",
    sizeMessage: "Reward image must be 2 MB or smaller.",
    typeMessage: "Reward image must be PNG, JPG, JPEG, or WebP.",
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
    allowedMimeTypes: ["image/png", "image/jpeg", "image/webp", "image/gif"],
    emptyMessage: "Promotion asset is empty.",
    sizeMessage: "Promotion asset must be 2 MB or smaller.",
    typeMessage: "Promotion asset must be PNG, JPG, JPEG, WebP, or GIF.",
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

  if (getMediaStorageMode() === "railway") {
    const compressed = await compressImageForRailwayStorage({
      buffer,
      contentType: input.contentType,
      fileName: input.fileName,
    });
    const storagePath = replaceStoragePathExtension(input.storagePath, compressed.extension);
    const config = getRailwayStorageConfig();
    await getRailwayS3Client(config).send(
      new PutObjectCommand({
        Bucket: config.bucket,
        Key: storagePath,
        Body: compressed.buffer,
        ContentType: compressed.contentType,
        CacheControl: "public, max-age=31536000, immutable",
        Metadata: {
          "volt-original-content-type": input.contentType,
          "volt-original-file-name": sanitizePathSegment(input.fileName, "media"),
          "volt-compressed": "true",
          "volt-target-bytes": String(getMediaImageTargetBytes()),
        },
      }),
    );

    return {
      publicUrl: buildRailwayMediaUrl(storagePath),
      storagePath,
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

export function encodeRailwayMediaKey(storagePath: string): string {
  return Buffer.from(storagePath, "utf8").toString("base64url");
}

export function decodeRailwayMediaKey(encodedKey: string): string {
  const decoded = Buffer.from(encodedKey, "base64url").toString("utf8");
  assertSafeRailwayMediaKey(decoded);
  return decoded;
}

export async function getRailwayMediaObject(encodedKey: string): Promise<{
  readonly buffer: Buffer;
  readonly contentType: string;
  readonly cacheControl: string;
}> {
  const key = decodeRailwayMediaKey(encodedKey);
  const config = getRailwayStorageConfig();
  const response = await getRailwayS3Client(config).send(
    new GetObjectCommand({
      Bucket: config.bucket,
      Key: key,
    }),
  );
  if (!response.Body) {
    throw new Error("Railway media asset is empty.");
  }
  const bytes = await response.Body.transformToByteArray();
  return {
    buffer: Buffer.from(bytes),
    contentType: response.ContentType ?? "application/octet-stream",
    cacheControl: response.CacheControl ?? "public, max-age=86400",
  };
}

export async function compressImageForRailwayStorage(input: {
  readonly buffer: Buffer;
  readonly contentType: string;
  readonly fileName: string;
}): Promise<{
  readonly buffer: Buffer;
  readonly contentType: "image/webp";
  readonly extension: "webp";
}> {
  if (!input.contentType.startsWith("image/")) {
    throw new Error("Media upload must be an image.");
  }

  const targetBytes = getMediaImageTargetBytes();
  const hardLimitBytes = getMediaImageHardLimitBytes();
  const dimensions = getCompressionDimensions();
  const qualitySteps = [78, 70, 62, 54, 46, 38, 30, 24];
  let best: Buffer | undefined;

  for (const maxDimension of dimensions) {
    for (const quality of qualitySteps) {
      const output = await sharp(input.buffer, { animated: input.contentType === "image/gif" })
        .rotate()
        .resize({
          width: maxDimension,
          height: maxDimension,
          fit: "inside",
          withoutEnlargement: true,
        })
        .webp({ quality, effort: 6 })
        .toBuffer();

      if (!best || output.byteLength < best.byteLength) {
        best = output;
      }
      if (output.byteLength <= targetBytes) {
        return {
          buffer: output,
          contentType: "image/webp",
          extension: "webp",
        };
      }
    }
  }

  if (best && best.byteLength <= hardLimitBytes) {
    return {
      buffer: best,
      contentType: "image/webp",
      extension: "webp",
    };
  }

  throw new Error(
    `Image could not be compressed close to ${formatBytes(targetBytes)}. Please upload a simpler or smaller image.`,
  );
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

function getRailwayStorageConfig(): {
  readonly endpoint: string;
  readonly region: string;
  readonly bucket: string;
  readonly accessKeyId: string;
  readonly secretAccessKey: string;
} {
  const endpoint = process.env.RAILWAY_BUCKET_ENDPOINT_URL?.trim();
  const bucket = process.env.RAILWAY_BUCKET_NAME?.trim();
  const accessKeyId = process.env.RAILWAY_BUCKET_ACCESS_KEY_ID?.trim();
  const secretAccessKey = process.env.RAILWAY_BUCKET_SECRET_ACCESS_KEY?.trim();
  const region = process.env.RAILWAY_BUCKET_REGION?.trim() || "us-east-1";
  if (!endpoint || !bucket || !accessKeyId || !secretAccessKey) {
    throw new Error(
      "Railway media storage requires RAILWAY_BUCKET_ENDPOINT_URL, RAILWAY_BUCKET_NAME, RAILWAY_BUCKET_ACCESS_KEY_ID, and RAILWAY_BUCKET_SECRET_ACCESS_KEY when MEDIA_STORAGE_MODE=railway.",
    );
  }
  return {
    endpoint,
    region,
    bucket,
    accessKeyId,
    secretAccessKey,
  };
}

function getRailwayS3Client(config: ReturnType<typeof getRailwayStorageConfig>): S3Client {
  if (!railwayS3Client) {
    railwayS3Client = new S3Client({
      endpoint: config.endpoint,
      region: config.region,
      forcePathStyle: true,
      credentials: {
        accessKeyId: config.accessKeyId,
        secretAccessKey: config.secretAccessKey,
      },
    });
  }
  return railwayS3Client;
}

function buildRailwayMediaUrl(storagePath: string): string {
  const baseUrl = getPublicApiBaseUrl();
  return `${baseUrl}/media/railway/${encodeRailwayMediaKey(storagePath)}`;
}

function getPublicApiBaseUrl(): string {
  const explicitBaseUrl =
    process.env.MEDIA_PUBLIC_BASE_URL?.trim() ||
    process.env.API_PUBLIC_BASE_URL?.trim() ||
    process.env.NEXT_PUBLIC_API_BASE_URL?.trim() ||
    process.env.EXPO_PUBLIC_API_BASE_URL?.trim();
  if (explicitBaseUrl) {
    return ensureApiBaseUrl(explicitBaseUrl);
  }
  const railwayDomain = process.env.RAILWAY_PUBLIC_DOMAIN?.trim();
  if (railwayDomain) {
    return ensureApiBaseUrl(`https://${railwayDomain}`);
  }
  return ensureApiBaseUrl(`http://127.0.0.1:${process.env.PORT?.trim() || "3000"}`);
}

function ensureApiBaseUrl(value: string): string {
  const withoutTrailingSlash = value.replace(/\/+$/g, "");
  return withoutTrailingSlash.endsWith("/api") ? withoutTrailingSlash : `${withoutTrailingSlash}/api`;
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

function replaceStoragePathExtension(storagePath: string, extension: string): string {
  const slashIndex = storagePath.lastIndexOf("/");
  const directory = slashIndex >= 0 ? storagePath.slice(0, slashIndex + 1) : "";
  const name = slashIndex >= 0 ? storagePath.slice(slashIndex + 1) : storagePath;
  const baseName = name.replace(/\.[a-z0-9]+$/i, "") || "media";
  return `${directory}${baseName}.${extension}`;
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

function isRailwayMediaUrl(value: string): boolean {
  return /\/api\/media\/railway\/[A-Za-z0-9_-]+$/i.test(value);
}

function assertSafeRailwayMediaKey(key: string): void {
  if (
    key.includes("\0") ||
    key.includes("..") ||
    key.startsWith("/") ||
    (!key.startsWith("rewards/") && !key.startsWith("promotions/"))
  ) {
    throw new Error("Invalid Railway media key.");
  }
}

function getMediaImageTargetBytes(): number {
  return getPositiveIntegerEnv("MEDIA_IMAGE_TARGET_BYTES", defaultMediaImageTargetBytes);
}

function getMediaImageHardLimitBytes(): number {
  const targetBytes = getMediaImageTargetBytes();
  return Math.max(targetBytes, getPositiveIntegerEnv("MEDIA_IMAGE_HARD_LIMIT_BYTES", defaultMediaImageHardLimitBytes));
}

function getCompressionDimensions(): readonly number[] {
  const maxDimension = getPositiveIntegerEnv("MEDIA_IMAGE_MAX_DIMENSION_PX", defaultMediaImageMaxDimensionPx);
  const minDimension = Math.min(
    maxDimension,
    getPositiveIntegerEnv("MEDIA_IMAGE_MIN_DIMENSION_PX", defaultMediaImageMinDimensionPx),
  );
  const candidates = [maxDimension, Math.round(maxDimension * 0.8), Math.round(maxDimension * 0.65), Math.round(maxDimension * 0.5), minDimension];
  return [...new Set(candidates.map((dimension) => Math.max(minDimension, dimension)))].sort((a, b) => b - a);
}

function getPositiveIntegerEnv(name: string, fallback: number): number {
  const rawValue = process.env[name]?.trim();
  if (!rawValue) {
    return fallback;
  }
  const parsed = Number(rawValue);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return fallback;
  }
  return Math.round(parsed);
}

function formatBytes(bytes: number): string {
  if (bytes % 1024 === 0) {
    return `${bytes / 1024} KB`;
  }
  return `${bytes} bytes`;
}
