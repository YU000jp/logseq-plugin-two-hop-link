import { replaceInlineMarkup } from "./blockInlineTransforms"
import { replaceCodeBlocks, replaceStatusMarkers } from "./blockTextTransforms"

export const applyLightMarkdownTransforms = (content: string): string =>
             replaceStatusMarkers(
                          replaceCodeBlocks(
                                       replaceInlineMarkup(
                                                    replaceTaskMarkers(
                                                                 replaceHeadingMarkers(
                                                                              replaceLogbookSection(content)
                                                                 )
                                                    )
                                       )
                          )
             )

export const replaceLogbookSection = (content: string) =>
             content.includes(":LOGBOOK:")
                          ? content.replace(/:LOGBOOK:([\s\S]*?)END:/g, "")
                          : content

export const replaceTaskMarkers = (content: string) =>
             content.replaceAll(/^(#*)\s?DONE/gm, "$1✔️")
                          .replaceAll(/^(#*)\s?TODO/gm, "$1◽")
                          .replaceAll(/^(#*)\s?CANCEL(?:ED|LED)/gm, "$1❌")
                          .replaceAll(/^(#*)\s?DOING/gm, "$1🟡")
                          .replaceAll(/^(#*)\s?WAITING/gm, "$1🟠")
                          .replaceAll(/^(#*)\s?LATER/gm, "$1🔵")
                          .replaceAll(/^(#*)\s?NOW/gm, "$1🟢")

export const replaceHeadingMarkers = (content: string) =>
             content.replaceAll(/^# (.+?)$/gm, "<h1>$1</h1>")
                          .replaceAll(/^## (.+?)$/gm, "<h2>$1</h2>")
                          .replaceAll(/^### (.+?)$/gm, "<h3>$1</h3>")
                          .replaceAll(/^#### (.+?)$/gm, "<h4>$1</h4>")
                          .replaceAll(/^##### (.+?)$/gm, "<h5>$1</h5>")
                          .replaceAll(/^###### (.+?)$/gm, "<h6>$1</h6>")
