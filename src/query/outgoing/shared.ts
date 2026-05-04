import { PageEntity } from "@logseq/libs/dist/LSPlugin"
import { pageArray } from "../type"
import { renderBatchSection, yieldToUI } from "../batch"
import { excludeJournal } from "../../excludePages"

export type OutgoingPageLinkSectionOptions<T> = {
             outgoingList: pageArray[]
             hopLinksElement: HTMLDivElement
             current?: PageEntity | null
             prepareOutgoingList?: (outgoingList: pageArray[]) => void
             shouldSkipPageLink?: (pageLink: pageArray) => boolean
             collectRows: (pageLink: pageArray) => Promise<T[] | null | undefined> | T[] | null | undefined
             createSection: (pageLink: pageArray) => HTMLDivElement
             renderRow: (row: T, sectionElement: HTMLDivElement, pageLink: pageArray) => Promise<boolean | void> | boolean | void
}

/**
 * Shared batch flow for outgoing page-link based sections.
 * It handles the outer page-link iteration and delegates section row rendering to `renderBatchSection`.
 */
export const renderOutgoingPageLinkSections = async <T>({
             outgoingList,
             hopLinksElement,
             current,
             prepareOutgoingList,
             shouldSkipPageLink,
             collectRows,
             createSection,
             renderRow,
}: OutgoingPageLinkSectionOptions<T>): Promise<void> => {
             if (current && prepareOutgoingList) prepareOutgoingList(outgoingList)

             for (const pageLink of outgoingList) {
                          if (!pageLink) continue
                          if (shouldSkipPageLink && shouldSkipPageLink(pageLink)) continue

                          const rows = await collectRows(pageLink)
                          if (!rows || rows.length === 0) continue

                          await renderBatchSection({
                                       rows,
                                       hopLinksElement,
                                       createSection: () => createSection(pageLink),
                                       renderRow: (row, sectionElement) => renderRow(row, sectionElement, pageLink),
                          })

                          await yieldToUI()
             }
}

export const shouldExcludeOutgoingPage = (page: PageEntity): boolean =>
             excludeJournal(page["journal?"], page.originalName)


export const toPageArray = (page: PageEntity): pageArray => ({
             uuid: page.uuid,
             name: page.originalName,
             originalName: page.originalName,
})
