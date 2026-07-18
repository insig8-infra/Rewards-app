import assert from "node:assert/strict";
import { test } from "node:test";
import {
  getMediaStorageMode,
  localDevMediaPlaceholderUrl,
  resolveMediaUrlForRead,
  uploadPromotionAssetToStorage,
  uploadRewardImageToStorage,
} from "./supabase-storage.js";

const trackedEnvKeys = ["MEDIA_STORAGE_MODE", "SUPABASE_PROJECT_ID", "SUPABASE_SECRET_KEY"] as const;

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
      fileName: "toolbox.webp",
      contentType: "image/webp",
      dataBase64: Buffer.from("not-empty").toString("base64"),
    }),
    /PNG, JPG, or JPEG/,
  );
});

test("promotion asset storage rejects unsupported promotion MIME types before upload", async () => {
  await assert.rejects(
    uploadPromotionAssetToStorage({
      promotionId: "promotion_1",
      fileName: "banner.webp",
      contentType: "image/webp",
      dataBase64: Buffer.from("not-empty").toString("base64"),
    }),
    /PNG, JPG, JPEG, or GIF/,
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
    assert.equal(resolveMediaUrlForRead("https://assets.example.test/toolbox.jpg"), "https://assets.example.test/toolbox.jpg");
  } finally {
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
