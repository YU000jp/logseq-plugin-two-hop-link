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

export const createPageLookupCache = () => {
             const pageLookupCache = new Map<string, Promise<PageEntity | null>>()

             return (name: string) => {
                          const cacheKey = name.trim()
                          const cached = pageLookupCache.get(cacheKey)
                          if (cached) return cached

                          const request = logseq.Editor.getPage(cacheKey) as Promise<PageEntity | null>
                          pageLookupCache.set(cacheKey, request)
                          return request
             }
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

             const collectConcurrency = 3
             const collectedSections: Array<{ pageLink: pageArray, rows: T[] }> = []
             let nextIndex = 0

             const collectNext = async () => {
                          while (true) {
                                       const currentIndex = nextIndex++
                                       if (currentIndex >= outgoingList.length) return

                                       const pageLink = outgoingList[currentIndex]
                                       if (!pageLink) continue
                                       if (shouldSkipPageLink && shouldSkipPageLink(pageLink)) continue

                                       const rows = await collectRows(pageLink)
                                       if (!rows || rows.length === 0) continue

                                       collectedSections[currentIndex] = { pageLink, rows }
                          }
             }

             await Promise.all(Array.from({ length: Math.min(collectConcurrency, outgoingList.length) }, () => collectNext()))

             for (const section of collectedSections) {
                          if (!section) continue
                          await renderBatchSection({
                                       rows: section.rows,
                                       hopLinksElement,
                                       createSection: () => createSection(section.pageLink),
                                       renderRow: (row, sectionElement) => renderRow(row, sectionElement, section.pageLink),
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
