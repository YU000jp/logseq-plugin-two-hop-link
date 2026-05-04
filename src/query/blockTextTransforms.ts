export const replaceCodeBlocks = (content: string) =>
             content.replaceAll("\n", "<br/>")
                          .replaceAll(/``([\s\S]*?)``/g, "<code>$1</code>")

export const replaceStatusMarkers = (content: string) =>
             content.replaceAll(/completed::/g, "<br/>completed::")
                          .replaceAll(/SCHEDULED: /g, "<br/>SCHEDULED: ")
