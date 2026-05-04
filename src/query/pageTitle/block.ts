import { IEntityID } from "@logseq/libs/dist/LSPlugin.user"
import { t } from "logseq-l10n"
import { excludePageFromBlockEntity } from "../../excludePages"
import { CreateTdBlock, pageArray, tokenLinkCreateTh } from "../type"
import { normalizeBlockEntities } from "../helpers"
import { replaceForLogseq } from "../blockContent"
import { renderBatchSection } from "../batch"

export const typeBlock = async (
    hopLinksElement: HTMLDivElement,
    flag: {
        isImageOnly: boolean,
    }
) => {

    const currentPage = await logseq.Editor.getCurrentPage() as pageArray | null
    if (!currentPage) return

    let result = (await logseq.DB.datascriptQuery(
        //同じ名前をもつページ名を取得するクエリー
        `
        [:find (pull ?b [:block/content :block/uuid :block/page])
        :in $ ?current-page
        :where
        [?b :block/content ?content]
        [(str "(?i).*" ?current-page ".*") ?regs]
        [(re-pattern ?regs) ?regx]
        [(re-matches ?regx ?content)]]
]
`,
        `"${currentPage.name}"`// クエリーでは、ページ名を小文字にする必要がある
    ) as {
        content: string,
        uuid: string,
        page: IEntityID
    }[] | null)?.flat()


    //結果が空の場合は処理を終了する
    if (!result || result.length === 0) return

    //blocksをフィルターする
    let outgoingList = result.filter((block) => block.content !== "")
    if (outgoingList.length === 0) return

    if (logseq.settings!.excludeCurrentPage === true)
        outgoingList = outgoingList.filter((block) => block.page?.originalName !== currentPage.originalName)
    if (outgoingList.length === 0) return

    //ページを除外する
    excludePageFromBlockEntity(outgoingList)
    if (outgoingList.length === 0) return

    outgoingList = normalizeBlockEntities(outgoingList)
    if (outgoingList.length === 0) return

    // 各ブロックはその日付情報をもっていないので、ソートできない

    //thの作成
    const tokenLinkElement: HTMLDivElement = tokenLinkCreateTh(
        currentPage,
        "th-type-blocks",
        t("Blocks"),
        { mark: "<<" }
    )
    //end of 行タイトル(左ヘッダー)

    await renderBatchSection({
        rows: outgoingList,
        hopLinksElement,
        createSection: () => tokenLinkElement,
        renderRow: async (block, sectionElement) => {
            const content = await replaceForLogseq(block.content, flag) as string
            if (flag
                && flag.isImageOnly === true
                && content === "") return false

            await CreateTdBlock(currentPage, {
                uuid: block.uuid,
                content
            }, sectionElement)
            return true
        },
    })
    //結果を表示する
}
