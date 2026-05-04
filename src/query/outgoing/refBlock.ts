import { IEntityID, PageEntity } from "@logseq/libs/dist/LSPlugin"
import { t } from "logseq-l10n"
import { checkAlias, excludePageFromBlockEntity } from "../../excludePages"
import { pageArray, tokenLinkCreateTh } from "../type"
import { normalizeBlockEntities } from "../helpers"
import { CreateTdBlock } from "../type"
import { replaceForLogseq } from "../blockContent"
import { renderOutgoingPageLinkSections } from "./shared"

//typeBlocks
export const typeRefBlock = async (
    outgoingList: pageArray[],
    hopLinksElement: HTMLDivElement,
    current: PageEntity | null,
    flag: {
        isImageOnly: boolean,
    }
) => {

    await renderOutgoingPageLinkSections({
        outgoingList,
        hopLinksElement,
        current,
        prepareOutgoingList: current ? (list) => checkAlias(current, list) : undefined,
        shouldSkipPageLink: (pageLink) => logseq.settings!.excludeCurrentPage === true
            && current !== null
            && (pageLink.uuid === current.uuid || pageLink.name === current.originalName),
        collectRows: async (pageLink) => {
            const page = await logseq.Editor.getPageLinkedReferences(pageLink.uuid) as [page: PageEntity, blocks: { uuid: string, content: string, page: IEntityID, }[]][]
            if (!page) return []

            const outgoingBlocks: { uuid: string, content: string, page: IEntityID }[] = []
            for (const reference of page) {
                const firstBlock = reference[1][0]
                if (firstBlock) outgoingBlocks.push(firstBlock)
            }
            if (outgoingBlocks.length === 0) return []

            excludePageFromBlockEntity(outgoingBlocks)
            if (outgoingBlocks.length === 0) return []

            const normalizedOutgoingList = normalizeBlockEntities(outgoingBlocks)
            if (normalizedOutgoingList.length === 0) return []

            return normalizedOutgoingList
        },
        createSection: (pageLink) => tokenLinkCreateTh(
            pageLink,
            "th-type-blocks",
            t("Blocks"),
            { mark: "<<" }
        ),
        renderRow: async (block, tokenLinkElement, pageLink) => {
            const content = await replaceForLogseq(block.content, { isImageOnly: flag.isImageOnly }) as string
            if (!content) return false
            await CreateTdBlock(pageLink, block, tokenLinkElement)
            return true
        },
    })
}
