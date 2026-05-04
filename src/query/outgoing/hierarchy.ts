import { PageEntity } from "@logseq/libs/dist/LSPlugin"
import { createTd, pageArray, tokenLinkCreateTh } from "../type"
import { preparePageEntities } from "../helpers"
import { renderBatchSection } from "../batch"

const MAX_HIERARCHY_DEPTH = 3

export const typeHierarchy = async (outgoingList: pageArray[], hopLinksElement: HTMLDivElement, flagFull?: boolean) => {
    const visited = new Set<string>()
    for (const pageLink of outgoingList)
        await getTd(0)(pageLink, 0, outgoingList)

    function getTd(depth: number): (value: pageArray | undefined, index: number, array: (pageArray | undefined)[]) => void {
        return async (pageLink) => {
            if (!pageLink) return
            if (visited.has(pageLink.uuid)) return
            visited.add(pageLink.uuid)

            let PageEntity = preparePageEntities(await logseq.DB.q(`(namespace \"${pageLink.name}\")`) as unknown as PageEntity[] | undefined)
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
