import { PageEntity } from "@logseq/libs/dist/LSPlugin"
import { createTd, pageArray, tokenLinkCreateTh } from "../type"
import { preparePageEntities } from "../helpers"
import { t } from "logseq-l10n"
import { renderOutgoingPageLinkSections } from "./shared"

export const typePageTags = async (outgoingList: pageArray[], hopLinksElement: HTMLDivElement) => {
    await renderOutgoingPageLinkSections({
        outgoingList,
        hopLinksElement,
        collectRows: async (pageLink) => {
            const page = await logseq.Editor.getPage(pageLink.uuid) as PageEntity | null
            if (!page) return []

            const pageTagLookupCache = new Map<string, Promise<PageEntity | null>>()
            const getPageByName = (name: string) => {
                const cached = pageTagLookupCache.get(name)
                if (cached) return cached
                const request = logseq.Editor.getPage(name) as Promise<PageEntity | null>
                pageTagLookupCache.set(name, request)
                return request
            }

            const pageEntityFromProperty: PageEntity[] = []
            const pageTagsFromProperty = page.properties?.tags as string[] | undefined
            if (pageTagsFromProperty && pageTagsFromProperty.length !== 0)
                for (const pageTag of pageTagsFromProperty) {
                    if (pageTag === "") continue
                    const pageTagObj = await getPageByName(pageTag)
                    if (pageTagObj) pageEntityFromProperty.push(pageTagObj)
                }

            const pageEntity = preparePageEntities(await logseq.DB.q(`(page-tags "${pageLink.name}")`) as PageEntity[] | null)
            const pageEntityFromPropertyFiltered = preparePageEntities(pageEntityFromProperty)
            return [...new Map([...pageEntity, ...pageEntityFromPropertyFiltered].map((page) => [page.uuid, page])).values()]
        },
        createSection: (pageLink) => tokenLinkCreateTh(pageLink, "th-type-pageTags", t("Page-Tags"), { mark: "<<" }),
        renderRow: (page, tokenLinkElement) => {
            createTd(page, tokenLinkElement, { isPageTags: true })
            return true
        },
    })
}
