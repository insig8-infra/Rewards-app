import assert from "node:assert/strict";
import { StreamableFile } from "@nestjs/common";
import { S3Client } from "@aws-sdk/client-s3";
import type { FastifyReply } from "fastify";
import sharp from "sharp";
import { test } from "node:test";
import {
  compressImageForRailwayStorage,
  getMediaStorageMode,
  getRailwayMediaObject,
  localDevMediaPlaceholderUrl,
  resolveMediaUrlForRead,
  uploadPromotionAssetToStorage,
  uploadRewardImageToStorage,
} from "./media-storage.js";
import { MediaController } from "./media.controller.js";

const trackedEnvKeys = [
  "MEDIA_STORAGE_MODE",
  "MEDIA_IMAGE_HARD_LIMIT_BYTES",
  "MEDIA_IMAGE_MAX_DIMENSION_PX",
  "MEDIA_IMAGE_MIN_DIMENSION_PX",
  "MEDIA_IMAGE_TARGET_BYTES",
  "MEDIA_PUBLIC_BASE_URL",
  "API_PUBLIC_BASE_URL",
  "NEXT_PUBLIC_API_BASE_URL",
  "EXPO_PUBLIC_API_BASE_URL",
  "PORT",
  "RAILWAY_BUCKET_ACCESS_KEY_ID",
  "RAILWAY_BUCKET_ENDPOINT_URL",
  "RAILWAY_BUCKET_NAME",
  "RAILWAY_BUCKET_REGION",
  "RAILWAY_BUCKET_SECRET_ACCESS_KEY",
  "SUPABASE_PROJECT_ID",
  "SUPABASE_SECRET_KEY",
] as const;

function captureStorageEnv(): Record<(typeof trackedEnvKeys)[number], string | undefined> {
  return Object.fromEntries(trackedEnvKeys.map((key) => [key, process.env[key]])) as Record<
    (typeof trackedEnvKeys)[number],
    string | undefined
  >;
}

function restoreStorageEnv(snapshot: Record<(typeof trackedEnvKeys)[number], string | undefined>): void {
  for (const key of trackedEnvKeys) {
    const value = snapshot[key];
    if (value === undefined) {
      delete process.env[key];
    } else {
      process.env[key] = value;
    }
  }
}

async function createSamplePngBase64(width = 640, height = 420): Promise<string> {
  const pixels = Buffer.alloc(width * height * 3);
  for (let index = 0; index < width * height; index += 1) {
    const x = index % width;
    const y = Math.floor(index / width);
    pixels[index * 3] = (x * 3 + y) % 256;
    pixels[index * 3 + 1] = (x + y * 2) % 256;
    pixels[index * 3 + 2] = (x * 2 + y * 3) % 256;
  }
  const png = await sharp(pixels, { raw: { width, height, channels: 3 } }).png().toBuffer();
  return png.toString("base64");
}

function setRailwayStorageEnv(): void {
  process.env.MEDIA_STORAGE_MODE = "railway";
  process.env.API_PUBLIC_BASE_URL = "https://volt-api.example.test/api";
  process.env.RAILWAY_BUCKET_ENDPOINT_URL = "https://bucket.railway.example.test";
  process.env.RAILWAY_BUCKET_NAME = "volt-media";
  process.env.RAILWAY_BUCKET_ACCESS_KEY_ID = "test-access-key";
  process.env.RAILWAY_BUCKET_SECRET_ACCESS_KEY = "test-secret-key";
  process.env.MEDIA_IMAGE_TARGET_BYTES = "20480";
  process.env.MEDIA_IMAGE_HARD_LIMIT_BYTES = "32768";
}

function stubS3Send(handler: (command: unknown) => Promise<unknown>): () => void {
  const prototype = S3Client.prototype as unknown as {
    send: (command: unknown) => Promise<unknown>;
  };
  const originalSend = prototype.send;
  prototype.send = handler;
  return () => {
    prototype.send = originalSend;
  };
}

test("reward image storage rejects files larger than 2 MB before upload", async () => {
  const oversizedImage = Buffer.alloc(2 * 1024 * 1024 + 1).toString("base64");

  await assert.rejects(
    uploadRewardImageToStorage({
      rewardId: "reward_1",
      fileName: "toolbox.jpg",
      contentType: "image/jpeg",
      dataBase64: oversizedImage,
    }),
    /2 MB or smaller/,
  );
});

test("reward image storage rejects unsupported reward image MIME types before upload", async () => {
  await assert.rejects(
    uploadRewardImageToStorage({
      rewardId: "reward_1",
      fileName: "toolbox.bmp",
      contentType: "image/bmp",
      dataBase64: Buffer.from("not-empty").toString("base64"),
    }),
    /PNG, JPG, JPEG, or WebP/,
  );
});

test("promotion asset storage rejects unsupported promotion MIME types before upload", async () => {
  await assert.rejects(
    uploadPromotionAssetToStorage({
      promotionId: "promotion_1",
      fileName: "banner.svg",
      contentType: "image/svg+xml",
      dataBase64: Buffer.from("not-empty").toString("base64"),
    }),
    /PNG, JPG, JPEG, WebP, or GIF/,
  );
});

test("promotion asset storage rejects files larger than 2 MB before upload", async () => {
  const oversizedImage = Buffer.alloc(2 * 1024 * 1024 + 1).toString("base64");

  await assert.rejects(
    uploadPromotionAssetToStorage({
      promotionId: "promotion_1",
      fileName: "banner.gif",
      contentType: "image/gif",
      dataBase64: oversizedImage,
    }),
    /2 MB or smaller/,
  );
});

test("media storage mode defaults to local even when Supabase credentials are present", () => {
  const env = captureStorageEnv();
  delete process.env.MEDIA_STORAGE_MODE;
  process.env.SUPABASE_PROJECT_ID = "dev-project";
  process.env.SUPABASE_SECRET_KEY = "dev-secret";

  try {
    assert.equal(getMediaStorageMode(), "local");
  } finally {
    restoreStorageEnv(env);
  }
});

test("local media mode returns one placeholder image without calling Supabase Storage", async () => {
  const env = captureStorageEnv();
  const originalFetch = globalThis.fetch;
  process.env.MEDIA_STORAGE_MODE = "local";
  process.env.SUPABASE_PROJECT_ID = "dev-project";
  process.env.SUPABASE_SECRET_KEY = "dev-secret";
  globalThis.fetch = (async () => {
    throw new Error("Supabase Storage should not be called in local media mode.");
  }) as typeof fetch;

  try {
    const uploaded = await uploadRewardImageToStorage({
      rewardId: "reward_1",
      fileName: "toolbox.jpg",
      contentType: "image/jpeg",
      dataBase64: Buffer.from("not-empty").toString("base64"),
    });

    assert.equal(uploaded.imageUrl, localDevMediaPlaceholderUrl);
    assert.match(uploaded.storagePath, /^local-dev\/rewards\/reward_1\//);
  } finally {
    globalThis.fetch = originalFetch;
    restoreStorageEnv(env);
  }
});

test("local media mode masks existing Supabase Storage URLs in read models", () => {
  const env = captureStorageEnv();
  process.env.MEDIA_STORAGE_MODE = "local";

  try {
    assert.equal(
      resolveMediaUrlForRead("https://example-ref.supabase.co/storage/v1/object/public/reward-images/toolbox.jpg"),
      localDevMediaPlaceholderUrl,
    );
    assert.equal(resolveMediaUrlForRead("https://volt-api.example.test/api/media/railway/cmV3YXJkcy9hLndlYnA"), localDevMediaPlaceholderUrl);
    assert.equal(resolveMediaUrlForRead("https://assets.example.test/toolbox.jpg"), "https://assets.example.test/toolbox.jpg");
  } finally {
    restoreStorageEnv(env);
  }
});

test("railway media mode requires bucket credentials", async () => {
  const env = captureStorageEnv();
  process.env.MEDIA_STORAGE_MODE = "railway";
  delete process.env.RAILWAY_BUCKET_ENDPOINT_URL;
  delete process.env.RAILWAY_BUCKET_NAME;
  delete process.env.RAILWAY_BUCKET_ACCESS_KEY_ID;
  delete process.env.RAILWAY_BUCKET_SECRET_ACCESS_KEY;

  try {
    await assert.rejects(
      uploadRewardImageToStorage({
        rewardId: "reward_1",
        fileName: "toolbox.jpg",
        contentType: "image/jpeg",
        dataBase64: await createSamplePngBase64(),
      }),
      /Railway media storage requires RAILWAY_BUCKET_ENDPOINT_URL/,
    );
  } finally {
    restoreStorageEnv(env);
  }
});

test("railway reward image upload compresses input and stores a stable API media URL", async () => {
  const env = captureStorageEnv();
  const capturedInputs: Record<string, unknown>[] = [];
  const restoreSend = stubS3Send(async (command: unknown) => {
    const input = (command as { readonly input?: Record<string, unknown> }).input;
    assert.ok(input);
    capturedInputs.push(input);
    return {};
  });

  try {
    setRailwayStorageEnv();
    const uploaded = await uploadRewardImageToStorage({
      rewardId: "reward_1",
      fileName: "toolbox.png",
      contentType: "image/png",
      dataBase64: await createSamplePngBase64(),
    });

    assert.equal(capturedInputs.length, 1);
    const input = capturedInputs[0];
    assert.ok(input);
    assert.equal(input.Bucket, "volt-media");
    assert.match(String(input.Key), /^rewards\/reward_1\/\d+-toolbox\.webp$/);
    assert.equal(input.ContentType, "image/webp");
    assert.equal(input.CacheControl, "public, max-age=31536000, immutable");
    assert.ok(Buffer.isBuffer(input.Body));
    assert.ok((input.Body as Buffer).byteLength <= 32 * 1024);
    assert.match(uploaded.imageUrl, /^https:\/\/volt-api\.example\.test\/api\/media\/railway\/[A-Za-z0-9_-]+$/);
    assert.match(uploaded.storagePath, /^rewards\/reward_1\/\d+-toolbox\.webp$/);
  } finally {
    restoreSend();
    restoreStorageEnv(env);
  }
});

test("railway compression targets about 20 KB for realistic static images", async () => {
  const env = captureStorageEnv();
  process.env.MEDIA_IMAGE_TARGET_BYTES = "20480";
  process.env.MEDIA_IMAGE_HARD_LIMIT_BYTES = "32768";

  try {
    const compressed = await compressImageForRailwayStorage({
      buffer: Buffer.from(await createSamplePngBase64(), "base64"),
      contentType: "image/png",
      fileName: "banner.png",
    });

    assert.equal(compressed.contentType, "image/webp");
    assert.equal(compressed.extension, "webp");
    assert.ok(compressed.buffer.byteLength <= 32 * 1024);
  } finally {
    restoreStorageEnv(env);
  }
});

test("railway media object read consumes bucket bytes", async () => {
  const env = captureStorageEnv();
  const restoreSend = stubS3Send(async (command: unknown) => {
    const input = (command as { readonly input?: Record<string, unknown> }).input;
    assert.equal(input?.Bucket, "volt-media");
    assert.equal(input?.Key, "rewards/reward_1/toolbox.webp");
    return {
      Body: {
        transformToByteArray: async () => new Uint8Array([1, 2, 3]),
      },
      ContentType: "image/webp",
      CacheControl: "public, max-age=31536000, immutable",
    };
  });

  try {
    setRailwayStorageEnv();
    const encodedKey = Buffer.from("rewards/reward_1/toolbox.webp", "utf8").toString("base64url");
    const media = await getRailwayMediaObject(encodedKey);

    assert.deepEqual([...media.buffer], [1, 2, 3]);
    assert.equal(media.contentType, "image/webp");
    assert.equal(media.cacheControl, "public, max-age=31536000, immutable");
  } finally {
    restoreSend();
    restoreStorageEnv(env);
  }
});

test("media controller streams railway media with response headers", async () => {
  const env = captureStorageEnv();
  const restoreSend = stubS3Send(async () => ({
    Body: {
      transformToByteArray: async () => new Uint8Array([4, 5, 6]),
    },
    ContentType: "image/webp",
    CacheControl: "public, max-age=31536000, immutable",
  }));
  const headers = new Map<string, string>();
  const reply = {
    header(name: string, value: string) {
      headers.set(name, value);
      return this;
    },
  } as FastifyReply;

  try {
    setRailwayStorageEnv();
    const controller = new MediaController();
    const encodedKey = Buffer.from("promotions/promo_1/banner.webp", "utf8").toString("base64url");
    const result = await controller.getRailwayMedia(encodedKey, reply);

    assert.ok(result instanceof StreamableFile);
    assert.equal(headers.get("Content-Type"), "image/webp");
    assert.equal(headers.get("Cache-Control"), "public, max-age=31536000, immutable");
  } finally {
    restoreSend();
    restoreStorageEnv(env);
  }
});

test("supabase media mode requires storage credentials", async () => {
  const env = captureStorageEnv();
  process.env.MEDIA_STORAGE_MODE = "supabase";
  delete process.env.SUPABASE_PROJECT_ID;
  delete process.env.SUPABASE_SECRET_KEY;

  try {
    await assert.rejects(
      uploadRewardImageToStorage({
        rewardId: "reward_1",
        fileName: "toolbox.jpg",
        contentType: "image/jpeg",
        dataBase64: Buffer.from("not-empty").toString("base64"),
      }),
      /requires SUPABASE_PROJECT_ID and SUPABASE_SECRET_KEY/,
    );
  } finally {
    restoreStorageEnv(env);
  }
});
