import { IEntityID, PageEntity } from "@logseq/libs/dist/LSPlugin"
import { t } from "logseq-l10n"
import { checkAlias, excludePageFromBlockEntity } from "../../excludePages"
import { pageArray, tokenLinkCreateTh } from "../type"
import { normalizeBlockEntities } from "../helpers"
import { CreateTdBlock } from "../type"
import { replaceForLogseq } from "../blockContent"
import { renderBatchSection } from "../batch"

//typeBlocks
export const typeRefBlock = async (
    outgoingList: pageArray[],
    hopLinksElement: HTMLDivElement,
    current: PageEntity | null,
    flag: {
        isImageOnly: boolean,
    }
) => {

    //aliasプロパティを取得し、outgoingListから除外する
    if (current) checkAlias(current, outgoingList)
    //行作成
    for (const pageLink of outgoingList) {
        if (!pageLink) continue
        //現在のページ名に一致する場合は除外する
        if (logseq.settings!.excludeCurrentPage === true
            && current && pageLink.name === current.originalName) continue
        //pageLinkRefのページを取得する
        const page = await logseq.Editor.getPageLinkedReferences(pageLink.uuid) as [page: PageEntity, blocks: { uuid: string, content: string, page: IEntityID, }[]][]
        if (!page) continue
        //blocksをフィルターする
        const outgoingList = page.filter((page) => page[1].length !== 0).map((page) => page[1][0])
        if (outgoingList.length === 0) continue

        //ページを除外する
        excludePageFromBlockEntity(outgoingList)
        if (outgoingList.length === 0) continue

        const normalizedOutgoingList = normalizeBlockEntities(outgoingList)
        if (normalizedOutgoingList.length === 0) continue

        // 各ブロックはその日付情報をもっていないので、ソートできない
        await renderBatchSection({
            rows: normalizedOutgoingList,
            hopLinksElement,
            createSection: () => tokenLinkCreateTh(
                pageLink,
                "th-type-blocks",
                t("Blocks"),
                { mark: "<<" }
            ),
            renderRow: async (block, tokenLinkElement) => {
                const content = await replaceForLogseq(block.content, { isImageOnly: flag.isImageOnly }) as string
                if (!content) return false
                await CreateTdBlock(pageLink, block, tokenLinkElement)
                return true
            },
        })
    }
}
