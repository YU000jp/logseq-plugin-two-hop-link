import { PageEntity } from "@logseq/libs/dist/LSPlugin"
import { createTd, pageArray, tokenLinkCreateTh } from "../type"
import { preparePageEntities } from "../helpers"
import { renderBatchSection } from "../batch"

const MAX_HIERARCHY_DEPTH = 3

export const typeHierarchy = async (outgoingList: pageArray[], hopLinksElement: HTMLDivElement, flagFull?: boolean) => {
    const visited = new Set<string>()
    const namespaceQueryCache = new Map<string, Promise<PageEntity[]>>()

    const getNamespacePages = (name: string) => {
        const cacheKey = name.trim()
        const cached = namespaceQueryCache.get(cacheKey)
        if (cached) return cached

        const request = Promise.resolve(
            logseq.DB.q(`(namespace \"${cacheKey}\")`) as unknown as PageEntity[] | undefined
        ).then((result) => preparePageEntities(result))
        namespaceQueryCache.set(cacheKey, request)
        return request
    }

    for (const pageLink of outgoingList)
        await getTd(0)(pageLink, 0, outgoingList)

    function getTd(depth: number): (value: pageArray | undefined, index: number, array: (pageArray | undefined)[]) => void {
        return async (pageLink) => {
            if (!pageLink) return
            if (visited.has(pageLink.uuid)) return
            visited.add(pageLink.uuid)

            let PageEntity = await getNamespacePages(pageLink.name)
            if (PageEntity.length === 0) return

            await renderBatchSection({
                rows: PageEntity,
                hopLinksElement,
                createSection: () => tokenLinkCreateTh(pageLink, "th-type-hierarchy", "Hierarchy", { mark: "<<" }),
                renderRow: (page, tokenLinkElement) => {
                    createTd(page, tokenLinkElement,
                        {
                            isHierarchyTitle: true,
                            removeKeyword: pageLink.originalName
                        })
                    return true
                },
            })

            if (flagFull === true && depth < MAX_HIERARCHY_DEPTH)
                for (const page of PageEntity)
                    await getTd(depth + 1)({
                        uuid: page.uuid,
                        name: page.name,
                        originalName: page.originalName
                    }, 0, outgoingList)
        }
    }
}
