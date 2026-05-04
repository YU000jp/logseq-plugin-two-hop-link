import { BlockEntity, PageEntity } from "@logseq/libs/dist/LSPlugin"
import { checkAlias, excludePagesFromPageList } from "../../excludePages"
import { createTd, pageArray, tokenLinkCreateTh } from "../type"
import { renderBatchSection } from "../batch"

//typeBlocks
export const typeRefPageName = async (outgoingList: pageArray[], hopLinksElement: HTMLDivElement, current: PageEntity | null) => {

    //aliasプロパティを取得し、outgoingListから除外する
    if (current) checkAlias(current, outgoingList)

    for (const pageLink of outgoingList) {
        if (!pageLink) continue
        //現在のページ名に一致する場合は除外する
        if (logseq.settings!.excludeCurrentPage === true
            && current
            && pageLink.name === current.originalName) continue
        //pageLinkRefのページを取得する
        const page = await logseq.Editor.getPageLinkedReferences(pageLink.uuid) as [page: PageEntity, blocks: BlockEntity[]][] | null
        if (!page) continue
        //ページ名を取得し、リストにする
        const pageList = page.map((page) => page[0]?.originalName)
        if (!pageList
            || pageList.length === 0) continue

        //excludePagesの配列に含まれるページを除外する
        excludePagesFromPageList(pageList)
        if (pageList.length === 0) continue

        // ソートする
        pageList.sort()

        await renderBatchSection({
            rows: pageList,
            hopLinksElement,
            createSection: () => tokenLinkCreateTh(pageLink, "th-type-backLinks", "BackLinks", { mark: "<<" }),
            renderRow: async (pageName, tokenLinkElement) => {
                if (pageName === "") return false
                const page = await logseq.Editor.getPage(pageName) as PageEntity | null
                if (!page) return false

                createTd(page, tokenLinkElement)
                return true
            },
        })
    }
}
