import { PageEntity } from "@logseq/libs/dist/LSPlugin"
import { createTd, pageArray, tokenLinkCreateTh } from "../type"
import { preparePageEntities } from "../helpers"
import { t } from "logseq-l10n"

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

        //PageEntityとPageEntityFromPropertyが両方とも空の場合は処理を終了する
        if (PageEntity.length === 0
            && PageEntityFromPropertyFiltered.length === 0) continue

        //th
        const tokenLinkElement: HTMLDivElement = tokenLinkCreateTh(pageLink, "th-type-pageTags", t("Page-Tags"), { mark: "<<" })

        //td
        for (const page of PageEntity)
            createTd(page, tokenLinkElement, { isPageTags: true })
        for (const page of PageEntityFromPropertyFiltered)
            createTd(page, tokenLinkElement, { isPageTags: true })

        hopLinksElement.append(tokenLinkElement)
    }
}
