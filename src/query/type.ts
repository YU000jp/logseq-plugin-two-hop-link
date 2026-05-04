import { IEntityID, PageEntity } from "@logseq/libs/dist/LSPlugin"
import { t } from "logseq-l10n"
import { openTooltipEventFromBlock, openTooltipEventFromPageName } from "../tooltip"
import { excludeJournal } from "../excludePages"
import { blockContent } from "./blockContent"
import { normalizeBlockEntities } from "./helpers"
import { createTooltipRowShell } from "./ui"
import { formatTokenLinkText, resolvePageDisplayData } from "./displayName"
import { appendPageTooltipRow } from "./pageRow"
import { appendBlockTooltipRow } from "./blockRow"

export const tokenLinkCreateTh = (
    pageLink: pageArray | string,
    className: string,
    boxTitle: string,
    flag: {
        hierarchies?: string,
        mark: string
    }
): HTMLDivElement => {

    const tokenLinkElement: HTMLDivElement = document.createElement("div")
    tokenLinkElement.classList.add("tokenLink")
    tokenLinkElement.title = boxTitle
    const divElement: HTMLDivElement = document.createElement("div")
    divElement.classList.add("hopLinksTh")
    divElement.classList.add(className)

    if (typeof pageLink !== "string") {

        divElement.innerText = pageLink.originalName === "hls"
            ? "PDF"
            : formatTokenLinkText(pageLink.originalName, flag)
        const { labelElement, inputElement, popupElement } = createTooltipRowShell()
        inputElement.dataset.uuid = pageLink.uuid
        inputElement.dataset.name = pageLink.name
        inputElement.addEventListener("change", openTooltipEventFromPageName(popupElement))
        labelElement.append(divElement, inputElement, popupElement)
        tokenLinkElement.append(labelElement)

    } else {

        divElement.innerText = formatTokenLinkText(pageLink, flag)
        tokenLinkElement.append(divElement)

    }
    return tokenLinkElement
}


export const createTd = async (
    page: PageEntity | pageArray,
    tokenLinkElement: HTMLDivElement,
    flag?: {
        isPageTags?: boolean,
        removeKeyword?: string,
        isHierarchyTitle?: boolean
    }
) => {

    //日誌を除外する
    if (page["journal?"]
        && excludeJournal(
            page["journal?"],
            page.originalName
        ) as boolean === true
        || (flag && flag.removeKeyword // キーワードのページは除く
            && page.originalName === flag.removeKeyword)
    ) return

    const { page: displayPage, displayName } = await resolvePageDisplayData(page, flag)
    appendPageTooltipRow(displayPage, displayName, tokenLinkElement, flag)
}



export type pageArray = {
    name: string
    originalName: string
    uuid: string
}
export const CreateTdBlock = async (
    pageLink: pageArray,
    block: { uuid: string; content: string },
    tokenLinkElement: HTMLDivElement
) => {

    if (!block
        || block.content === "" // 空の場合は除外する
        || block.content === `[[${pageLink.originalName}]]` // [[ページ名]]に一致する場合は除外する
        || block.content === `#${pageLink.originalName}`) //  #ページ名に一致する場合は除外する
        return

    const content = await blockContent(block.content) as string
    if (content === "") return
    appendBlockTooltipRow(pageLink, content, tokenLinkElement, block)

}
export const removeBlockUuid = (outgoingList: { uuid: string; content: string; page: IEntityID }[]) => {
    const normalizedList = normalizeBlockEntities(outgoingList)
    outgoingList.splice(0, outgoingList.length, ...normalizedList)
}

