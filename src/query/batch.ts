import { pageArray } from "./type"

export type BatchSectionRowRenderer<T> = (
             row: T,
             sectionElement: HTMLDivElement
) => Promise<boolean | void> | boolean | void

export type BatchSectionOptions<T> = {
             rows: T[] | null | undefined
             hopLinksElement: HTMLDivElement
             createSection: () => HTMLDivElement
             renderRow: BatchSectionRowRenderer<T>
}

/**
 * Renders a section only when it has at least one usable row.
 * The renderer can return `false` to skip a row without marking the section as rendered.
 */
export const renderBatchSection = async <T>({
             rows,
             hopLinksElement,
             createSection,
             renderRow,
}: BatchSectionOptions<T>): Promise<boolean> => {
             if (!rows || rows.length === 0) return false

             const sectionElement = createSection()
             let hasRenderedRow = false

             for (const row of rows) {
                          const rendered = await renderRow(row, sectionElement)
                          if (rendered === false) continue
                          hasRenderedRow = true
             }

             if (!hasRenderedRow) return false

             hopLinksElement.append(sectionElement)
             return true
}

