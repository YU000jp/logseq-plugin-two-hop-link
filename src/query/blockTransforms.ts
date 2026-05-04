export const isRenderableBlockContent = (content: string): boolean =>
             !(!content
                          || content.startsWith("title:: ")
                          || content.startsWith("tags:: ")
                          || content.startsWith("alias::")
                          || (content.startsWith("{{") && content.endsWith("}}")))

export const stripBlockProperties = (content: string): string =>
             content.replaceAll(/^(background-color|id|heading|collapsed|string|title|created-at)::.*$/gm, "")

export { applyLightMarkdownTransforms } from "./blockMarkdownTransforms"
