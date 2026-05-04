import { PageEntity } from "@logseq/libs/dist/LSPlugin"
import { createTd, pageArray, tokenLinkCreateTh } from "../type"
import { preparePageEntities } from "../helpers"
import { renderBatchSection } from "../batch"

export const typeHierarchy = async (outgoingList: pageArray[], hopLinksElement: HTMLDivElement, flagFull?: boolean) => {
    for (const pageLink of outgoingList)
        await getTd()(pageLink, 0, outgoingList)

    function getTd(): (value: pageArray | undefined, index: number, array: (pageArray | undefined)[]) => void {
        return async (pageLink) => {
            if (!pageLink) return

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

            if (flagFull === true)
                for (const page of PageEntity)
                    await getTd()({
                        uuid: page.uuid,
                        name: page.name,
                        originalName: page.originalName
                    }, 0, outgoingList)
        }
    }
}
