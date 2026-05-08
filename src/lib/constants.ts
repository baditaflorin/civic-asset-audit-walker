import type { AssetKind, Condition } from "./schema";

export const PROJECT_NAME = "civic-asset-audit-walker";
export const REPOSITORY_URL = "https://github.com/baditaflorin/civic-asset-audit-walker";
export const PAYPAL_URL = "https://www.paypal.com/paypalme/florinbadita";
export const LIVE_URL = "https://baditaflorin.github.io/civic-asset-audit-walker/";
export const DEFAULT_MAP_CENTER = { lat: 44.4268, lng: 26.1025 };

export const assetKindLabels: Record<AssetKind, string> = {
  streetlight: "Streetlight",
  bench: "Bench",
  trash_bin: "Trash bin",
  bus_stop: "Bus stop",
  crossing: "Crossing",
  pothole: "Pothole",
  sign: "Sign",
  tree: "Tree",
  other: "Other"
};

export const conditionLabels: Record<Condition, string> = {
  good: "Good",
  watch: "Watch",
  needs_repair: "Needs repair",
  unsafe: "Unsafe",
  missing: "Missing"
};

export const conditionWeights: Record<Condition, number> = {
  good: 0,
  watch: 1,
  needs_repair: 2,
  unsafe: 4,
  missing: 3
};

export const conditionTone: Record<Condition, string> = {
  good: "#2f8f5b",
  watch: "#c58618",
  needs_repair: "#d85c27",
  unsafe: "#b42318",
  missing: "#5b5fc7"
};
