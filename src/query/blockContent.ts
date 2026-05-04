import { includeReference } from "../lib"
import {
    applyLightMarkdownTransforms,
    isRenderableBlockContent,
    stripBlockProperties,
} from "./blockTransforms"
import {
    normalizeTemporaryImageMarkers,
    restoreTemporaryImageMarkers,
    stripImageSizeHints,
    resolveImageTag,
    replaceMatchedImages,
} from "./blockImageTransforms"


/**
 * Returns the content of a block after excluding properties and rendering.
 * @param content - The content of the block to be processed.
 * @returns The processed content of the block.
 */
export const blockContent = async (content: string): Promise<string> => {

    //プロパティやレンダリングだけのものは除外する
    if (isRenderableBlockContent(content) === false) return ""

    // リファレンス対応
    const isReference: string | null = await includeReference(content) as string | null
    if (isReference !== null) content = isReference

    // プロパティを削除する
    content = stripBlockProperties(content + "\n").replace(/\n$/, "") // 処理のタイミングに注意 (リファレンスの中にも含まれている場合があるのでここで実行)

    // 内容を置換する
    return await replaceForLogseq(content) as string
}


// Logseq用に置換する
export const replaceForLogseq = async (
    content: string,
    flag?: { isImageOnly: boolean }
): Promise<string> => {

    // assetsにある画像を表示する
    const rep = await replaceImage(content) as { content: string, match: number } // 処理のタイミングに注意
    if (flag && flag.isImageOnly
        && rep.match === 0) return ""

    content = rep.content

    // 専用マークダウンを置換する
    content = applyLightMarkdownTransforms(content)

    // 返却する
    return content
}


// 画像を表示する
export const replaceImage = async (content: string): Promise<{ content: string, match: number }> => {

    if (!content
        || !content.includes("../assets/") //../assets/が含まれている
        || !content.includes("![")
        || !content.includes("](")
    ) return {
        content: content,
        match: 0
    }

    // 「)_」を「）_」に置換する
    content = normalizeTemporaryImageMarkers(content)

    // 「![何らかの文字列もしくは空](何らかの文字列)」のような文字列で、それぞれを取得する
    let match = content.match(/!\[(.+?)?\]\((.+?)\)/g) as RegExpMatchArray | null
    if (match) {
        content = await replaceMatchedImages(content, match)

        // 「{:height 数値, :width 数値}」のような文字列を削除する
        if (content.includes(":height"))
            content = stripImageSizeHints(content)
    }

    // 「）_」を「)_」に置換する
    content = restoreTemporaryImageMarkers(content)

    return {
        content: content,
        match: match?.length || 0
    }
}


