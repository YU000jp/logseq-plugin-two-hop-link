import { pageArray } from "./type"
import { t } from "logseq-l10n"

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

const createLoadMoreButton = (onClick: () => Promise<void>) => {
             const buttonElement: HTMLButtonElement = document.createElement("button")
             buttonElement.type = "button"
             buttonElement.classList.add("hopLinksLoadMore")
             buttonElement.innerText = t("Load more")
             buttonElement.addEventListener("click", async () => {
                          buttonElement.disabled = true
                          try {
                                       await onClick()
                          } finally {
                                       buttonElement.disabled = false
                          }
             })
             return buttonElement
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
             const loadMoreContainer = document.createElement("div")
             loadMoreContainer.classList.add("hopLinksLoadMoreContainer")
             let hasRenderedRow = false
             let renderedCount = 0

             const renderNextChunk = async (): Promise<void> => {
                          const chunkEnd = Math.min(rows.length, renderedCount + BATCH_RENDER_CHUNK_SIZE)
                          for (; renderedCount < chunkEnd; renderedCount++) {
                                       const rendered = await renderRow(rows[renderedCount], sectionElement)
                                       if (rendered === false) continue
                                       hasRenderedRow = true

                                       if ((renderedCount + 1) % BATCH_RENDER_CHUNK_SIZE === 0)
                                                    await yieldToUI()
                          }

                          if (renderedCount < rows.length) {
                                       if (!loadMoreContainer.isConnected) sectionElement.append(loadMoreContainer)
                                       loadMoreContainer.replaceChildren(createLoadMoreButton(renderNextChunk))
                                       return
                          }

                          loadMoreContainer.remove()
                          if (!hasRenderedRow) sectionElement.remove()
             }

             hopLinksElement.append(sectionElement)
             await renderNextChunk()

             if (!hasRenderedRow && renderedCount >= rows.length) {
                          sectionElement.remove()
                          return false
             }

             return true
}

