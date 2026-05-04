import { PageEntity } from "@logseq/libs/dist/LSPlugin"
import { t } from "logseq-l10n"
import { createTd, tokenLinkCreateTh } from "../type"
import { preparePageEntities } from "../helpers"
import { excludeJournalFilter } from "../../excludePages"

export const typePageHierarchy = async (hopLinksElement: HTMLDivElement) => {

    const currentPage = await logseq.Editor.getCurrentPage() as PageEntity | null
    if (!currentPage) return

    // クエリーでは、ページ名を小文字にする必要があるが、nameはすでに小文字になっている
    const PageEntity = preparePageEntities(await logseq.DB.q(`(namespace \"${currentPage.name}\")`) as PageEntity[] | null)

    //PageEntityが空の場合は処理を終了する
    if (PageEntity.length === 0) return

    //thを作成する
    const tokenLinkElement: HTMLDivElement = tokenLinkCreateTh(
        currentPage,
        "th-type-namespace",
        t("Namespace"),
        { mark: "" }
    )

    //tdを作成する
    for (const page of PageEntity)
        createTd({
            name: page.name,
            uuid: page.uuid,
            originalName: page.originalName,
        }, tokenLinkElement, {
            isHierarchyTitle: true,
            removeKeyword: currentPage.originalName
        })

    //結果を表示する
    hopLinksElement.append(tokenLinkElement)
}
