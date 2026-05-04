export const normalizeTemporaryImageMarkers = (content: string) => content.replaceAll(")_", "）_")

export const restoreTemporaryImageMarkers = (content: string) => content.replaceAll("）_", ")_")

export const normalizeImageAssetUrl = (url: string) => url.replace(/）_/g, ")_")

export const stripImageSizeHints = (content: string) => content.replaceAll(/{:height \d+, :width \d+}/g, "")

export const resolveImageTag = async (matchText: string): Promise<string | null> => {
             const url = matchText.match(/!\[(.+?)?\]\((.+?)\)/)?.[2] as string | null
             if (!url || url.includes(".pdf")) return null

             const imgExists = await logseq.Assets.makeUrl(normalizeImageAssetUrl(url)) as string | null
             return imgExists ? `<img src="${imgExists}" />` : null
}

export const replaceMatchedImages = async (
             content: string,
             matches: RegExpMatchArray
): Promise<string> => {
             for (const matchText of matches) {
                          const imgTag = await resolveImageTag(matchText)
                          if (imgTag) content = content.replaceAll(matchText, imgTag)
             }

             return content
}
