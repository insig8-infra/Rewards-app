"use client";

import { ImageUp } from "lucide-react";
import { FilePickerButton } from "./FilePickerButton";

const maxPhotoFileSizeBytes = 2 * 1024 * 1024;
const allowedPhotoContentTypes = new Set(["image/png", "image/jpeg"]);
const profilePhotoMaxDimensionPx = 320;
const profilePhotoInitialQuality = 0.82;
const profilePhotoMinQuality = 0.5;
const profilePhotoTargetDataUrlLength = 70_000;

export function ProfilePhotoUpload({
  label,
  name,
  photoUrl,
  onPhotoChange,
  onError,
}: {
  readonly label: string;
  readonly name: string;
  readonly photoUrl: string;
  readonly onPhotoChange: (photoUrl: string) => void;
  readonly onError: (message: string) => void;
}) {
  function handleFile(file: File | undefined) {
    if (!file) {
      return;
    }

    if (!allowedPhotoContentTypes.has(file.type)) {
      onError("Please upload a PNG, JPG, or JPEG image.");
      return;
    }

    if (file.size > maxPhotoFileSizeBytes) {
      onError("Photo must be 2 MB or smaller.");
      return;
    }

    void normalizeProfilePhoto(file)
      .then(onPhotoChange)
      .catch(() => onError("Photo upload failed."));
  }

  return (
    <div className="field photo-field">
      <span className="field-label">{label}</span>
      <div className="photo-upload">
        <Avatar name={name} photoUrl={photoUrl} size="lg" />
        <div className="photo-upload-copy">
          <strong>{photoUrl ? "Photo selected" : "Upload from device"}</strong>
          <span>JPG or PNG, up to 2 MB</span>
          <div className="toolbar">
            <FilePickerButton
              accept=".png,.jpg,.jpeg,image/png,image/jpeg"
              ariaLabel={`${label} browse photo`}
              icon={<ImageUp size={16} aria-hidden="true" />}
              label="Browse"
              onFile={handleFile}
            />
            {photoUrl ? (
              <button className="button compact" type="button" onClick={() => onPhotoChange("")}>
                Remove
              </button>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}

export function Avatar({
  name,
  photoUrl,
  size = "md",
}: {
  readonly name: string;
  readonly photoUrl?: string | undefined;
  readonly size?: "md" | "lg";
}) {
  const initials = name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join("");

  return (
    <div className={`avatar ${size === "lg" ? "large" : ""}`} aria-hidden="true">
      {photoUrl ? <img alt="" src={photoUrl} /> : <span>{initials || "VR"}</span>}
    </div>
  );
}

async function normalizeProfilePhoto(file: File): Promise<string> {
  const dataUrl = await readFileAsDataUrl(file);
  return resizePhotoDataUrl(dataUrl);
}

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        resolve(reader.result);
        return;
      }
      reject(new Error("Photo upload failed."));
    };
    reader.onerror = () => reject(new Error("Photo upload failed."));
    reader.readAsDataURL(file);
  });
}

function resizePhotoDataUrl(dataUrl: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => {
      const naturalWidth = image.naturalWidth || image.width;
      const naturalHeight = image.naturalHeight || image.height;
      if (!naturalWidth || !naturalHeight) {
        reject(new Error("Photo upload failed."));
        return;
      }

      const scale = Math.min(1, profilePhotoMaxDimensionPx / Math.max(naturalWidth, naturalHeight));
      const width = Math.max(1, Math.round(naturalWidth * scale));
      const height = Math.max(1, Math.round(naturalHeight * scale));
      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const context = canvas.getContext("2d");
      if (!context) {
        reject(new Error("Photo upload failed."));
        return;
      }

      context.fillStyle = "#ffffff";
      context.fillRect(0, 0, width, height);
      context.drawImage(image, 0, 0, width, height);
      resolve(compressCanvasDataUrl(canvas));
    };
    image.onerror = () => reject(new Error("Photo upload failed."));
    image.src = dataUrl;
  });
}

function compressCanvasDataUrl(canvas: HTMLCanvasElement): string {
  let quality = profilePhotoInitialQuality;
  let dataUrl = canvas.toDataURL("image/jpeg", quality);

  while (dataUrl.length > profilePhotoTargetDataUrlLength && quality > profilePhotoMinQuality) {
    quality -= 0.08;
    dataUrl = canvas.toDataURL("image/jpeg", quality);
  }

  return dataUrl;
}
