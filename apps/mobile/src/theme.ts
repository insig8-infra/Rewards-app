export const theme = {
  colors: {
    background: "#F4F7F7",
    surface: "#FFFFFF",
    surfaceMuted: "#EAF3F5",
    surfaceRaised: "#F9FCFC",
    primary: "#00535B",
    primaryDark: "#003D43",
    primarySoft: "#DFF1F3",
    secondary: "#F49A32",
    secondaryDark: "#8F4E00",
    accent: "#713D10",
    warning: "#D88A00",
    danger: "#BA1A1A",
    success: "#007C68",
    ink: "#1B1C1C",
    muted: "#526567",
    line: "#D8E2E4",
    lineStrong: "#B7C6C8",
    chip: "#E8F3F4",
    bronze: "#9A5B22",
    rewardAction: "#A65F00",
    rewardActionDark: "#884800",
    pageBorder: "#6857F5",
    successSoft: "#E5F3EC",
    dangerSoft: "#FDECEC",
    warningSoft: "#FFF0DF",
  },
  spacing: {
    xs: 4,
    sm: 8,
    md: 12,
    lg: 16,
    xl: 24,
    xxl: 32,
  },
  radius: {
    xs: 4,
    sm: 6,
    md: 8,
    lg: 10,
    xl: 14,
    pill: 999,
  },
  typography: {
    title: 28,
    screenTitle: 26,
    heading: 20,
    sectionHeading: 18,
    cardTitle: 16,
    body: 15,
    helper: 13,
    small: 13,
    caption: 12,
    metadata: 11,
  },
  touch: {
    compact: 44,
    control: 48,
    primary: 52,
    bottomTab: 76,
  },
  motion: {
    pressMs: 120,
    sheetMs: 220,
    successMs: 420,
  },
  layout: {
    minPhoneProofWidth: 360,
    maxPhonePreviewWidth: 480,
    screenGutter: 16,
    rewardRailTileWidth: 214,
  },
  shadow: {
    boxShadow: "0px 5px 12px rgba(0, 61, 67, 0.08)",
    elevation: 2,
  },
} as const;

export type StatusTone = "success" | "danger" | "warning" | "muted";

export function statusTone(result: string): StatusTone {
  if (result === "SUCCESS") {
    return "success";
  }
  if (result === "RESERVED") {
    return "warning";
  }
  if (result === "INVALID" || result === "PERMISSION_DENIED") {
    return "danger";
  }
  if (result === "EXPIRED" || result === "REPLACED" || result === "ALREADY_CLAIMED" || result === "CART_CAP_REACHED") {
    return "warning";
  }
  return "muted";
}
