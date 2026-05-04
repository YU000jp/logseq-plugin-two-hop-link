import { replaceCodeBlocks, replaceStatusMarkers } from "./blockTextTransforms"

export const replaceInlineMarkup = (content: string) =>
             replaceStatusMarkers(
                          replaceCodeBlocks(
                                       replaceWikiLinks(
                                                    replaceMarkdownLinks(content)
                                       )
                          )
             )

export const replaceMarkdownLinks = (content: string) =>
             content.replaceAll(/\[([^\[\]]*?)\]\(([^\[\]]*?)\)/g, "<b>$1</b>")

export const replaceWikiLinks = (content: string) =>
             content.replaceAll(/\[\[([^\[\]]*?)\]\]/g, "<i>$1</i>")

