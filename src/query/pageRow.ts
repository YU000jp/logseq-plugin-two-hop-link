import { openTooltipEventFromPageName } from "../tooltip"
import { createTooltipRowShell } from "./ui"

type PageLike = {
             uuid: string
             name: string
             originalName: string
}

export const appendPageTooltipRow = (
             page: PageLike,
             displayName: string,
             tokenLinkElement: HTMLDivElement,
             flag?: { isPageTags?: boolean }
) => {
             const divElementTag: HTMLDivElement = document.createElement("div")
             divElementTag.classList.add("hopLinksTd")
             const { labelElement, inputElement, popupElement } = createTooltipRowShell()
             inputElement.dataset.uuid = page.uuid
             inputElement.dataset.name = page.originalName
             const anchorElement: HTMLAnchorElement = document.createElement("a")
             anchorElement.dataset.uuid = page.uuid
             anchorElement.innerText = (flag && flag.isPageTags ? "#" : "") + displayName
             divElementTag.title = page.originalName
             divElementTag.append(anchorElement)
             inputElement.addEventListener("change", openTooltipEventFromPageName(popupElement))

             labelElement.append(divElementTag, inputElement, popupElement)
             tokenLinkElement.append(labelElement)
}
