import { BlockEntity, PageEntity } from "@logseq/libs/dist/LSPlugin"
import { checkAlias, excludePagesFromPageList } from "../../excludePages"
import { createTd, pageArray, tokenLinkCreateTh } from "../type"
import { renderOutgoingPageLinkSections } from "./shared"

//typeBlocks
export const typeRefPageName = async (outgoingList: pageArray[], hopLinksElement: HTMLDivElement, current: PageEntity | null) => {
    await renderOutgoingPageLinkSections({
        outgoingList,
        hopLinksElement,
        current,
        prepareOutgoingList: current ? (list) => checkAlias(current, list) : undefined,
        shouldSkipPageLink: (pageLink) => logseq.settings!.excludeCurrentPage === true
            && current !== null
            && pageLink.name === current.originalName,
        collectRows: async (pageLink) => {
            const page = await logseq.Editor.getPageLinkedReferences(pageLink.uuid) as [page: PageEntity, blocks: BlockEntity[]][] | null
            if (!page) return []

            const pageList = page.map((page) => page[0]?.originalName)
            if (!pageList || pageList.length === 0) return []

            excludePagesFromPageList(pageList)
            if (pageList.length === 0) return []

            pageList.sort()
            return pageList
        },
        createSection: (pageLink) => tokenLinkCreateTh(pageLink, "th-type-backLinks", "BackLinks", { mark: "<<" }),
        renderRow: async (pageName, tokenLinkElement) => {
            if (pageName === "") return false
            const page = await logseq.Editor.getPage(pageName) as PageEntity | null
            if (!page) return false

            createTd(page, tokenLinkElement)
            return true
        },
    })
}
