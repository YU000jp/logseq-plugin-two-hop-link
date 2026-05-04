import { PageEntity } from "@logseq/libs/dist/LSPlugin"
import { createTd, pageArray, tokenLinkCreateTh } from "../type"
import { preparePageEntities } from "../helpers"
import { t } from "logseq-l10n"
import { renderBatchSection } from "../batch"

export const typePageTags = async (outgoingList: pageArray[], hopLinksElement: HTMLDivElement) => {

    for (const pageLink of outgoingList) {
        if (!pageLink) continue
        //そのページからページタグを指定している
        const page = await logseq.Editor.getPage(pageLink.uuid) as PageEntity | null
        if (!page) continue
        const PageEntityFromProperty: PageEntity[] = []
        //ページタグを取得する
        const pageTagsFromProperty = page.properties?.tags as string[] | undefined
        if (pageTagsFromProperty && pageTagsFromProperty.length !== 0)
            for (const pageTag of pageTagsFromProperty) {
                if (pageTag === "") continue
                const pageTagObj = await logseq.Editor.getPage(pageTag) as PageEntity | null
                if (pageTagObj) PageEntityFromProperty.push(pageTagObj)
            }

        //そのページにタグ漬けされている
        const PageEntity = preparePageEntities(await logseq.DB.q(`(page-tags \"${pageLink.name}\")`) as PageEntity[] | null)
        const PageEntityFromPropertyFiltered = preparePageEntities(PageEntityFromProperty)

        await renderBatchSection({
            rows: [...PageEntity, ...PageEntityFromPropertyFiltered],
            hopLinksElement,
            createSection: () => tokenLinkCreateTh(pageLink, "th-type-pageTags", t("Page-Tags"), { mark: "<<" }),
            renderRow: (page, tokenLinkElement) => {
                createTd(page, tokenLinkElement, { isPageTags: true })
                return true
            },
        })
    }
}
