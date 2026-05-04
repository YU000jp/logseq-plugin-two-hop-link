import { openTooltipEventFromBlock } from "../tooltip"
import { createTooltipRowShell } from "./ui"

type BlockLike = {
             uuid: string
             content: string
}

type PageLinkLike = {
             uuid: string
}

export const appendBlockTooltipRow = (
             pageLink: PageLinkLike,
             content: string,
             tokenLinkElement: HTMLDivElement,
             block: BlockLike
) => {
             const blockElement: HTMLDivElement = document.createElement("div")
             blockElement.classList.add("hopLinksTd")
             const { labelElement, inputElement, popupElement } = createTooltipRowShell()
             inputElement.name = "blocks-popup-" + pageLink.uuid

             const anchorElement: HTMLAnchorElement = document.createElement("a")
             anchorElement.dataset.uuid = block.uuid
             anchorElement.innerHTML = content

             blockElement.append(anchorElement)
             blockElement.addEventListener("click", openTooltipEventFromBlock(popupElement))
             labelElement.append(blockElement, inputElement, popupElement)
             tokenLinkElement.append(labelElement)
}
