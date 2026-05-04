import { pageArray } from "./type"

const BATCH_RENDER_CHUNK_SIZE = 20

export const yieldToUI = async (): Promise<void> => {
             await new Promise<void>((resolve) => {
                          if (typeof requestAnimationFrame === "function") {
                                       requestAnimationFrame(() => resolve())
                                       return
                          }
                          setTimeout(resolve, 0)
             })
}

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

             for (const [index, row] of rows.entries()) {
                          const rendered = await renderRow(row, sectionElement)
                          if (rendered === false) continue
                          hasRenderedRow = true

                          if ((index + 1) % BATCH_RENDER_CHUNK_SIZE === 0)
                                       await yieldToUI()
             }

             if (!hasRenderedRow) return false

             hopLinksElement.append(sectionElement)
             return true
}

