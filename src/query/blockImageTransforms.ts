export const normalizeTemporaryImageMarkers = (content: string) => content.replaceAll(")_", "）_")

export const restoreTemporaryImageMarkers = (content: string) => content.replaceAll("）_", ")_")

export const normalizeImageAssetUrl = (url: string) => url.replace(/）_/g, ")_")

export const stripImageSizeHints = (content: string) => content.replaceAll(/{:height \d+, :width \d+}/g, "")
