import { PageEntity } from "@logseq/libs/dist/LSPlugin"
import { t } from "logseq-l10n"
import CSSfile from "./style.css?inline"
import { collapsePageAccessory } from "./lib"
import { excludePages } from "./excludePages"
import { typeNamespace } from "./query/pageTitle/namespace"
import { typePageTags } from "./query/outgoing/pageTags"
import { typeHierarchy } from "./query/outgoing/hierarchy"
import { typeRefBlock } from "./query/outgoing/refBlock"
import { typeRefPageName } from "./query/outgoing/refPageName"
import { outgoingLinks, outgoingLinksFromCurrentPage } from "./query/outgoingLinks"
import { externalLinks } from "./query/externalLinks"
import { pageArray } from "./query/type"
import { typeBlock } from "./query/pageTitle/block"


export const loadTwoHopLink = async () => {

    //ページ読み込み時に実行コールバック

    logseq.App.onRouteChanged(async ({ template }) => {
        if (template === '/page/:name'
            && !parent.document.getElementById("hopLinks") as boolean)
            hopLinks()
    })

    //Logseqのバグあり。動作保証が必要
    logseq.App.onPageHeadActionsSlotted(async () => {
        if (!parent.document.getElementById("hopLinks") as boolean)
            hopLinks()
    })

    logseq.provideStyle(CSSfile)

}//end of loadTwoHopLink



let processing: boolean = false
const hopLinks = async (select?: string) => {
    if (processing) return
    setTimeout(() => processing = false, 5000) //3秒後にprocessingをfalseにする 途中で処理を失敗した場合に備える

    //アウトゴーイングリンクを表示する場所
    const pageRelativeInnerElement = parent.document.body.querySelector("div#root>div>main div#main-content-container div.page.relative>div.relative") as HTMLDivElement | null
    if (!pageRelativeInnerElement) return
    const hopLinksElement: HTMLDivElement = document.createElement("div")
    hopLinksElement.id = "hopLinks"
    pageRelativeInnerElement.append(hopLinksElement)
    //PageBlocksInnerElementの中に含まれる<a data-ref>をすべて取得する
    const pageLinks = pageRelativeInnerElement.querySelectorAll(
        "a[data-ref]:not(.page-property-key)" + (logseq.settings!.keywordsIncludeHierarchy === false ? ":not([data-checked])" : "")
    ) as NodeListOf<HTMLAnchorElement> | null
    if (!pageLinks) return
    processing = true

    //ページを開いたときの処理
    collapsePageAccessory()

    const newSet = new Set()
    //outgoingリンクを取得する
    const pageLinksSet: Promise<pageArray>[] = outgoingLinksFromCurrentPage(pageLinks, newSet)
    //ページ名を追加する
    const current = await addCurrentPageHierarchy(newSet, pageLinksSet)
    //newSetを空にする
    newSet.clear()

    // 結果の配列からundefinedを除外
    const outgoingList = (await Promise.all(pageLinksSet)).filter(Boolean)
    pageLinksSet.length = 0 //配列を空にする

    //hopLinksElementに<span>でタイトルメッセージを設置する
    const spanElement: HTMLSpanElement = document.createElement("span")
    spanElement.id = "hopLinksTitle"
    spanElement.innerText = t("2 Hop Links")
    spanElement.title = t("Click to collapse")
    spanElement.style.cursor = "zoom-out"
    //spanElementをクリックしたら消す
    spanElement.addEventListener("click", () => {
        const outgoingLinks = parent.document.getElementById("outgoingLinks") as HTMLDivElement | null
        if (outgoingLinks) {
            outgoingLinks.remove()
            //div.tokenLinkをすべて探し、削除する
            const tokenLinks = parent.document.body.querySelectorAll("div#root>div>main div#main-content-container div.tokenLink") as NodeListOf<HTMLDivElement> | null
            if (tokenLinks)
                for (const tokenLink of tokenLinks)
                    tokenLink.remove()
            //selectElementを削除する
            const selectElement = parent.document.getElementById("hopLinkType") as HTMLSelectElement | null
            if (selectElement) selectElement.remove()
            //updateButtonElementの文字を変更する
            const updateButtonElement = parent.document.getElementById("hopLinksUpdate") as HTMLButtonElement | null
            if (updateButtonElement) {
                updateButtonElement.innerText = t("Collapsed (revert)")
                updateButtonElement.title = t("Click to revert")
            }
        }
    }, { once: true })

    //設定画面を開くボタン
    buttonSettingsUpdate(hopLinksElement, spanElement)


    //outgoingListが空の場合は処理を終了する
    if (outgoingList.length === 0) {

        // ブランクメッセージを表示する
        const pElement: HTMLElement = document.createElement("p")
        pElement.innerText = t("No links found in this page. (If add links, please click the update button.)")
        hopLinksElement.append(pElement)
        return

    } else {

        // outgoingListをソートする
        sortOutgoingList(outgoingList)

        // 設定されたページを除外する
        excludePages(outgoingList)

        // 発信リンクを表示
        if (logseq.settings!.outgoingLinks === true)
            outgoingLinks(outgoingList, hopLinksElement)

        // 外部リンクを表示
        if (logseq.settings!.externalLinks === true)
            externalLinks(pageRelativeInnerElement, hopLinksElement)

        // 2ホップリンクの表示 selectで選択されたタイプ
        await switchSelect(
            select || (logseq.settings!.hopLinkType as string),
            hopLinksElement,
            outgoingList,
            current)

    }//end of if (outgoingList)

    //selectを設置する
    putSelectButton(hopLinksElement)

    processing = false

}//end of hopLinks


//outgoingListをソートする
/**
 * Sorts an array of page links by name in ascending order.
 * @param outgoingList An array of objects containing a UUID and a name property.
 * @returns The sorted array of page links.
 */
const sortOutgoingList = (outgoingList: pageArray[]) =>
    outgoingList.sort((a, b) => {
        if (a?.name === undefined || b?.name === undefined) return 0
        if (a.name > b.name) return 1
        if (a.name < b.name) return -1
        return 0
    })


//現在のページ名とその階層を、リストに追加する
const addCurrentPageHierarchy = async (
    newSet: Set<unknown>,
    outgoingList: Promise<pageArray>[]) => {

    const current = await logseq.Editor.getCurrentPage() as PageEntity | null
    if (current) {

        const addPage = async (name: string) => {
            const page = await logseq.Editor.getPage(name) as PageEntity | null
            if (page) {
                //日誌を除外する
                if (logseq.settings!.excludeJournalFromOutgoingLinks === true
                    && page["journal?"] === true) return

                if (logseq.settings!.excludeDateFromOutgoingLinks === true) {
                    //2024/01のような形式のページを除外する
                    if (page.originalName.match(/^\d{4}\/\d{2}$/) !== null) return
                    //2024のような数値を除外する
                    if (page.originalName.match(/^\d{4}$/) !== null) return
                }

                // 重複を除外する
                if (newSet.has(page.uuid)) return

                newSet.add(page.uuid)

                outgoingList.push(Promise.resolve({
                    uuid: page.uuid,
                    name: page.name,
                    originalName: page.originalName
                }))
            }
        }

        if (logseq.settings!.keywordsIncludeHierarchy === true
            && current.originalName.includes("/") as boolean === true) { //現在のページ名に「/」が含まれている場合

            // current.originalNameがA/B/Cとしたら、A、A/B、A/B/Cを取得する
            let names = current.originalName.split("/")
            names = names.map((_name, i) => names.slice(0, i + 1).join("/"))
            for (const name of names) await addPage(name)

        } else
            // current.originalName 現在のページ名
            await addPage(current.originalName)

    }
    return current
}


//設定と更新ボタンを設置する
const buttonSettingsUpdate = (hopLinksElement: HTMLDivElement, spanElement: HTMLSpanElement) => {

    //hopLinksElementに設定ボタンを設置する
    const settingButtonElement: HTMLButtonElement = document.createElement("button")
    settingButtonElement.id = "hopLinksSetting"
    settingButtonElement.innerText = "⚙"
    settingButtonElement.title = t("Click to open plugin settings")
    settingButtonElement.addEventListener("click", () => logseq.showSettingsUI())

    //hopLinksElementに更新ボタンを設置する
    const updateButtonElement: HTMLButtonElement = document.createElement("button")
    updateButtonElement.id = "hopLinksUpdate"
    updateButtonElement.innerText = "🔂" + t("Update") //手動更新
    updateButtonElement.title = t("Click to update (If add links, please click this button.)")
    updateButtonElement.addEventListener("click", () => {
        //hopLinksElementを削除する
        hopLinksElement.remove()
        hopLinks()
    }, { once: true })
    hopLinksElement.prepend(
        spanElement,
        settingButtonElement,
        updateButtonElement
    )

}

//selectを設置する
const putSelectButton = (hopLinksElement: HTMLDivElement) => {
    const selectElement: HTMLSelectElement = document.createElement("select")
    selectElement.id = "hopLinkType"
    // <option value="deeperHierarchy" title="${t("recursive processing for deeper hierarchy")}">${t("Outgoing links")} > ${t("Hierarchy")} > ${t("deeper")}</option>
    // <option value="page-blocks-image">${t("Page title")} > ${t("Block")} > ${t("Image only")}</option>
    //<option value="pageHierarchy">${t("Page")} ${t("Hierarchy")} : ${t("Sub page")}</option>
    selectElement.innerHTML = `
    <option value="unset">
    ${t("Unset")}
    </option>
    <option value="pageNamespaceNoPageHierarchy">
    ${t("Page title")} << ${t("String Search")}
    </option>
    <option value="pageNamespace">
    ${t("Page title")} << ${t("String Search")} (${t("Include hierarchies of this page")})
    </option>
    <option value="pageBlocks">
    ${t("Page title")} << ${t("Block search")}
    </option>
    <option value="outgoingHierarchy">
    >> ${t("Outgoing links")} > ${t("Sub page")} (${t("Hierarchy")})
    </option>
    <option value="outgoingPageTags">
    >> ${t("Outgoing links")} <> ${t("Page-Tags")}
    </option>
    <option value="refBackLinks">
    >> ${t("Outgoing links")} << ${t("BackLinks")}
    </option>
    <option value="refBlocks">
    >> ${t("Outgoing links")} << ${t("Blocks")}
    </option>
    <option value="refBlocksImage">
    >> ${t("Outgoing links")} << ${t("Blocks")} : ${t("Image only")}
    </option>
    `
    // selectElementの値が変更されたら、hopLinksElementを削除して、再度hopLinksを実行する
    selectElement.addEventListener("change", () => {
        //hopLinksElementを削除する
        hopLinksElement.remove()
        hopLinks(selectElement.value)
        logseq.updateSettings({ hopLinkType: selectElement.value })
    })
    hopLinksElement.append(selectElement)
    setTimeout(async () => {
        //一致するoptionを選択状態にする
        const options = parent.document.getElementById("hopLinkType")?.querySelectorAll("option") as NodeListOf<HTMLOptionElement> | null
        if (!options) return
        for (const option of options)
            if (option.value === logseq.settings!.hopLinkType) {
                option.selected = true
                break
            }
    }, 50)
}


//selectで選択されたタイプ
const switchSelect = async (
    select: string,
    hopLinksElement: HTMLDivElement,
    outgoingList: pageArray[],
    current: PageEntity | null
) => {
    switch (select) {

        case "pageBlocks":
            // ブロックを表示する
            await typeBlock(hopLinksElement, { isImageOnly: false })
            break

        case "pageNamespaceNoPageHierarchy":
            // クエリーでページ名に関連するページを取得する カテゴリ分け
            await typeNamespace(hopLinksElement, { category: true, removePageHierarchy: true })
            break

        case "pageNamespace":
            // クエリーでページ名に関連するページを取得する カテゴリ分け
            await typeNamespace(hopLinksElement, { category: true, removePageHierarchy: false })
            break

        // case "pageBlocksImage":
        //     // ブロックを表示する
        //     typeBlock(hopLinksElement, { isImageOnly: true })
        //     break

        // case "pageHierarchy":
        //     //ページ名から階層を取得する
        //     typePageHierarchy(hopLinksElement)
        //     break

        case "outgoingPageTags":
            //ページタグ
            await typePageTags(outgoingList, hopLinksElement)
            break

        case "outgoingHierarchy":
            //hierarchy
            await typeHierarchy(outgoingList, hopLinksElement, false)
            break

        case "refBackLinks": //Linked References > BackLinks (ページ)
            //block.content
            await typeRefPageName(outgoingList, hopLinksElement, current)
            break

        case "refBlocks": // Linked References > Blocks
            //block.content
            await typeRefBlock(outgoingList, hopLinksElement, current, { isImageOnly: false })
            break

        case "refBlocksImage": // Linked References > Blocks > Image only
            //block.content
            await typeRefBlock(outgoingList, hopLinksElement, current, { isImageOnly: true })
            break

    }
}

