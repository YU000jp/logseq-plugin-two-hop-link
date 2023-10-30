import { PageEntity } from "@logseq/libs/dist/LSPlugin"
import { sortForPageEntity } from "./lib"
import { t } from "logseq-l10n"
import { tokenLinkCreateTh, createTd } from "./tokenLink"
import { excludePageForPageEntity } from "./excludePages"

export const typePageTags = async (filteredPageLinksSet: ({ uuid: string; name: string } | undefined)[], hopLinksElement: HTMLDivElement) => {

    for (const pageLink of filteredPageLinksSet) {
        if (!pageLink) continue
        //そのページからページタグを指定している
        const page = await logseq.Editor.getPage(pageLink.uuid) as PageEntity | null
        if (!page) continue
        const PageEntityFromProperty: PageEntity[] = []
        //ページタグを取得する
        const pageTagsFromProperty = page.properties?.tags as string[] | undefined
        if (pageTagsFromProperty && pageTagsFromProperty.length !== 0) {
            for (const pageTag of pageTagsFromProperty) {
                if (pageTag === "") continue
                const pageTagObj = await logseq.Editor.getPage(pageTag) as PageEntity | null
                if (pageTagObj) PageEntityFromProperty.push(pageTagObj)
            }
        }
        //そのページにタグ漬けされている
        let PageEntity = await logseq.DB.q(`(page-tags "${pageLink.name}")`) as unknown as PageEntity[]
        if (PageEntity && PageEntity.length !== 0) {
            // pageTags.nameが2024/01のような形式だったら除外する。また2024のような数値も除外する
            PageEntity = PageEntity.filter((page) => page["journal?"] === false
                && page.originalName.match(/^\d{4}\/\d{2}$/) === null
                && page.originalName.match(/^\d{4}$/) === null)
        }
        //PageEntityとPageEntityFromPropertyが両方とも空の場合は処理を終了する
        if ((!PageEntity || PageEntity.length === 0)
            && (!PageEntityFromProperty || PageEntityFromProperty.length === 0)) continue

        //ページを除外する
        if (PageEntity) excludePageForPageEntity(PageEntity)
        if (PageEntityFromProperty) excludePageForPageEntity(PageEntityFromProperty)
        if (PageEntity.length === 0
            && PageEntityFromProperty.length === 0) continue
        //sortする
        if (PageEntity) sortForPageEntity(PageEntity)

        //th
        const tokenLinkElement: HTMLDivElement = tokenLinkCreateTh(pageLink, "th-type-pageTags", t("Page-Tags"))

        //td
        if (PageEntity)
            for (const page of PageEntity)
                createTd(page, tokenLinkElement, { isPageTags: true })
        for (const page of PageEntityFromProperty)
            createTd(page, tokenLinkElement, { isPageTags: true })

        hopLinksElement.append(tokenLinkElement)
    }
}