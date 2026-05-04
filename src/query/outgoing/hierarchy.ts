import { PageEntity } from "@logseq/libs/dist/LSPlugin"
import { createTd, pageArray, tokenLinkCreateTh } from "../type"
import { preparePageEntities } from "../helpers"

export const typeHierarchy = (outgoingList: pageArray[], hopLinksElement: HTMLDivElement, flagFull?: boolean) => {
    outgoingList.forEach(getTd())

    function getTd(): (value: pageArray | undefined, index: number, array: (pageArray | undefined)[]) => void {
        return async (pageLink) => {
            if (!pageLink) return

            let PageEntity = preparePageEntities(await logseq.DB.q(`(namespace \"${pageLink.name}\")`) as unknown as PageEntity[] | undefined)
            if (PageEntity.length === 0) return

            //th
            const tokenLinkElement: HTMLDivElement = tokenLinkCreateTh(pageLink, "th-type-hierarchy", "Hierarchy", { mark: "<<" })

            //td
            for (const page of PageEntity)
                createTd(page, tokenLinkElement,
                    {
                        isHierarchyTitle: true,
                        removeKeyword: pageLink.originalName
                    })

            hopLinksElement.append(tokenLinkElement)

            if (flagFull === true)
                for (const page of PageEntity)
                    getTd()({
                        uuid: page.uuid,
                        name: page.name,
                        originalName: page.originalName
                    }, 0, outgoingList)
        }
    }
}
