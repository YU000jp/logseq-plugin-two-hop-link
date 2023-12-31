import { IEntityID, PageEntity } from "@logseq/libs/dist/LSPlugin"
import { t } from "logseq-l10n"
import { openTooltipEventFromBlock, openTooltipEventFromPageName } from "../tooltip"
import { excludeJournal } from "../excludePages"
import { blockContent } from "./blockContent"

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

        // 「hls」を「PDF」にする
        // 「/」が含まれる場合は、それのすべて「 / 」に置換する
        divElement.innerText = (pageLink.originalName === "hls" ? "PDF" :
            pageLink.originalName.includes("/") ?
                // 特定の階層を取り除く
                (flag && flag.hierarchies ?
                    pageLink.originalName.replace(flag.hierarchies + "/", "../")
                    : pageLink.originalName
                ).replaceAll(/\//g, " / ")
                : pageLink.originalName) + " " + flag.mark
        //ポップアップ表示あり
        const labelElement: HTMLLabelElement = document.createElement("label")
        //input要素を作成
        const inputElement: HTMLInputElement = document.createElement("input")
        inputElement.type = "checkbox"
        inputElement.dataset.uuid = pageLink.uuid
        inputElement.dataset.name = pageLink.name
        //div ポップアップの内容
        const popupElement: HTMLDivElement = document.createElement("div")
        popupElement.classList.add("hopLinks-popup-content")
        popupElement.title = ""
        inputElement.addEventListener("change", openTooltipEventFromPageName(popupElement))
        labelElement.append(divElement, inputElement, popupElement)
        tokenLinkElement.append(labelElement)

    } else {

        // ページと同じ階層であれば、それを解除する
        const keyWord = (flag && flag.hierarchies ?
            pageLink.replace(flag.hierarchies + "/", "../")
            : pageLink) + " " + flag.mark

        // 「hls」を「PDF」にする
        // 「/」を「 / 」にする
        divElement.innerText = keyWord === "hls" ? "PDF" :
            keyWord.includes("/") ?
                keyWord.replaceAll("/", " / ")
                : keyWord
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

    let displayName = (flag && flag.removeKeyword // isHierarchyTitleがある場合は、キーワードを取り除く
        && flag.isHierarchyTitle === true)
        ? // ページ名とキーワードが完全一致する場合は除く
        page.originalName.replace(flag.removeKeyword, "..") //hierarchyの場合は、一致するキーワードを取り除く
        : page.originalName

    //e525a109-3542-46cf-b316-54cef873db74のような値だったらUUIDなので、ブロックを取得する
    if (page.name.match(/^[0-9a-f]{8}(-[0-9a-f]{4}){3}-[0-9a-f]{12}$/)) {
        const block = await logseq.Editor.getBlock(page.uuid) as { page: PageEntity } | null
        if (block && block.page) {
            displayName = block.page.originalName
            page.uuid = block.page.uuid
            page.name = block.page.name
        } else
            return
    } else
        // 「hls/」から始まる場合は、hls/の代わりに、「File > 」にする
        if (page.name.startsWith("hls/")) displayName = displayName.replace("hls/", `PDF ${t("File")} > `)
        else
            // 「hls__」から始まる場合は、hls__の代わりに、「File > 」にする
            if (page.name.startsWith("hls__")) displayName = displayName.replace("hls__", `PDF ${t("File")} > `)
            else
                // 「/」が含まれる場合は、それのすべて「 / 」に置換する
                if (page.originalName.includes("/")) displayName = displayName.replaceAll(/\//g, " / ")


    const divElementTag: HTMLDivElement = document.createElement("div")
    divElementTag.classList.add("hopLinksTd")
    //ポップアップ表示あり
    const labelElement: HTMLLabelElement = document.createElement("label")
    //input要素を作成
    const inputElement: HTMLInputElement = document.createElement("input")
    inputElement.type = "checkbox"
    inputElement.dataset.uuid = page.uuid
    inputElement.dataset.name = page.originalName
    //div ポップアップの内容
    const popupElement: HTMLDivElement = document.createElement("div")
    popupElement.classList.add("hopLinks-popup-content")
    popupElement.title = ""
    const anchorElement: HTMLAnchorElement = document.createElement("a")
    anchorElement.dataset.uuid = page.uuid
    anchorElement.innerText = (flag && flag.isPageTags ? "#" : "") + displayName //isPageTagsがtrueの場合は、#を付ける
    divElementTag.title = page.originalName
    divElementTag.append(anchorElement)
    inputElement.addEventListener("change", openTooltipEventFromPageName(popupElement))

    labelElement.append(divElementTag, inputElement, popupElement)
    tokenLinkElement.append(labelElement)
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

    //行タイトル(左ヘッダー)
    const blockElement: HTMLDivElement = document.createElement("div")
    blockElement.classList.add("hopLinksTd")
    //ポップアップ表示あり
    const labelElement: HTMLLabelElement = document.createElement("label")
    //input要素を作成
    const inputElement: HTMLInputElement = document.createElement("input")
    inputElement.type = "checkbox"
    inputElement.name = "blocks-popup-" + pageLink.uuid
    //div ポップアップの内容
    const popupElement: HTMLDivElement = document.createElement("div")
    popupElement.classList.add("hopLinks-popup-content")

    const anchorElement: HTMLAnchorElement = document.createElement("a")
    anchorElement.dataset.uuid = block.uuid

    const content = await blockContent(block.content) as string
    if (content === "") return
    anchorElement.innerHTML = content

    blockElement.append(anchorElement)
    blockElement.addEventListener("click", openTooltipEventFromBlock(popupElement))
    labelElement.append(blockElement, inputElement, popupElement)
    tokenLinkElement.append(labelElement)

}
export const removeBlockUuid = (outgoingList: { uuid: string; content: string; page: IEntityID }[]) => {
    const uuidSet = new Set()
    outgoingList.forEach((block) => uuidSet.add(block.uuid))
    outgoingList.filter((block) => uuidSet.has(block.uuid)
        && block.content !== "") // ついでに空のものも除外する
    uuidSet.clear()
}

