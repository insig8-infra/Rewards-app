"use client";

import type { ReactNode } from "react";

export function FilePickerButton({
  accept,
  ariaLabel,
  disabled = false,
  icon,
  label,
  onFile,
}: {
  readonly accept: string;
  readonly ariaLabel: string;
  readonly disabled?: boolean;
  readonly icon?: ReactNode;
  readonly label: string;
  readonly onFile: (file: File | undefined) => void;
}) {
  return (
    <span className={`file-picker-control ${disabled ? "disabled" : ""}`}>
      <span className="file-picker-caption" aria-hidden="true">
        {icon}
        {label}
      </span>
      <input
        accept={accept}
        aria-label={ariaLabel}
        className="file-picker-input"
        disabled={disabled}
        type="file"
        onChange={(event) => {
          onFile(event.currentTarget.files?.[0]);
          event.currentTarget.value = "";
        }}
      />
    </span>
  );
}
