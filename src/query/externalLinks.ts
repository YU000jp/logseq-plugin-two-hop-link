import { t } from "logseq-l10n"
import { createHopLinksSection } from "./helpers"
import { openTooltipEventFromPageName } from "../tooltip"
import { createTooltipRowShell } from "./ui"

export const externalLinks = (PageBlocksInnerElement: HTMLDivElement, hopLinksElement: HTMLDivElement) => {
    const externalLinks = PageBlocksInnerElement.querySelectorAll("a.external-link") as NodeListOf<HTMLAnchorElement> | null
    if (!(externalLinks && externalLinks.length !== 0)) return

    const externalLinksElement: HTMLDivElement = createHopLinksSection(
        "externalLinks",
        `>> ${t("External Links")}`
    )

    for (const externalLink of externalLinks) {
        const { labelElement, inputElement, popupElement } = createTooltipRowShell()
        const divElementTag: HTMLDivElement = document.createElement("div")
        divElementTag.classList.add("hopLinksTd")

        const anchorElement: HTMLAnchorElement = externalLink.cloneNode(true) as HTMLAnchorElement
        divElementTag.append(anchorElement)
        inputElement.addEventListener("change", openTooltipEventFromPageName(popupElement))

        labelElement.append(divElementTag, inputElement, popupElement)
        externalLinksElement.append(labelElement)
    }

    hopLinksElement.append(externalLinksElement)
}
