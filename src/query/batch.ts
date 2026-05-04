import { pageArray } from "./type"
import { t } from "logseq-l10n"

const DEFAULT_BATCH_RENDER_CHUNK_SIZE = 20

type AutoLoadMoreObserver = {
             disconnect: () => void
}

const getBatchRenderChunkSize = (): number => {
             const configured = Number(logseq.settings?.loadMoreChunkSize)
             if (!Number.isFinite(configured) || configured <= 0) return DEFAULT_BATCH_RENDER_CHUNK_SIZE
             return Math.min(Math.floor(configured), 200)
}

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
             shouldContinue?: () => boolean
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

const attachAutoLoadMoreObserver = (
             targetElement: HTMLElement,
             triggerElement: HTMLButtonElement,
): AutoLoadMoreObserver | null => {
             const ObserverCtor = (window as Window & { IntersectionObserver?: unknown }).IntersectionObserver
             if (typeof ObserverCtor !== "function") return null

             const observer = new (ObserverCtor as unknown as new (
                          callback: (entries: Array<{ isIntersecting: boolean }>) => void,
                          options?: { root: null; threshold: number }
             ) => AutoLoadMoreObserver & { observe: (target: HTMLElement) => void })((entries) => {
                          if (!entries.some((entry) => entry.isIntersecting)) return
                          if (triggerElement.disabled) return
                          triggerElement.click()
             }, {
                          root: null,
                          threshold: 0.1,
             })

             observer.observe(targetElement)
             return observer
}

/**
 * Renders a section only when it has at least one usable row.
 * The renderer can return `false` to skip a row without marking the section as rendered.
 */
export const renderBatchSection = async <T>({
             rows,
             hopLinksElement,
             createSection,
             shouldContinue,
             renderRow,
}: BatchSectionOptions<T>): Promise<boolean> => {
             if (!rows || rows.length === 0) return false
             if (shouldContinue && !shouldContinue()) return false

             const sectionElement = createSection()
             if (shouldContinue && !shouldContinue()) return false

             const loadMoreContainer = document.createElement("div")
             loadMoreContainer.classList.add("hopLinksLoadMoreContainer")
             let hasRenderedRow = false
             let renderedCount = 0
             const batchRenderChunkSize = getBatchRenderChunkSize()
             let autoLoadMoreObserver: AutoLoadMoreObserver | null = null

             const disconnectAutoLoadMoreObserver = () => {
                          const observer = autoLoadMoreObserver
                          autoLoadMoreObserver = null
                          if (observer) observer.disconnect()
             }

             const renderNextChunk = async (): Promise<void> => {
                          if (shouldContinue && !shouldContinue()) {
                                       disconnectAutoLoadMoreObserver()
                                       loadMoreContainer.remove()
                                       if (!hasRenderedRow) sectionElement.remove()
                                       return
                          }

                          const chunkEnd = Math.min(rows.length, renderedCount + batchRenderChunkSize)
                          for (; renderedCount < chunkEnd; renderedCount++) {
                                       if (shouldContinue && !shouldContinue()) {
                                                    disconnectAutoLoadMoreObserver()
                                                    loadMoreContainer.remove()
                                                    if (!hasRenderedRow) sectionElement.remove()
                                                    return
                                       }

                                       const rendered = await renderRow(rows[renderedCount], sectionElement)
                                       if (rendered === false) continue
                                       hasRenderedRow = true

                                       if (shouldContinue && !shouldContinue()) {
                                                    disconnectAutoLoadMoreObserver()
                                                    loadMoreContainer.remove()
                                                    if (!hasRenderedRow) sectionElement.remove()
                                                    return
                                       }

                                       if ((renderedCount + 1) % batchRenderChunkSize === 0)
                                                    await yieldToUI()
                          }

                          if (renderedCount < rows.length) {
                                       if (shouldContinue && !shouldContinue()) {
                                                    disconnectAutoLoadMoreObserver()
                                                    loadMoreContainer.remove()
                                                    if (!hasRenderedRow) sectionElement.remove()
                                                    return
                                       }

                                       if (!loadMoreContainer.isConnected) sectionElement.append(loadMoreContainer)
                                       const loadMoreButton = createLoadMoreButton(renderNextChunk)
                                       loadMoreContainer.replaceChildren(loadMoreButton)

                                       if (!autoLoadMoreObserver) {
                                                    autoLoadMoreObserver = attachAutoLoadMoreObserver(
                                                                 loadMoreContainer,
                                                                 loadMoreButton,
                                                    )
                                       }
                                       return
                          }

                          loadMoreContainer.remove()
                          disconnectAutoLoadMoreObserver()
                          if (!hasRenderedRow) sectionElement.remove()
             }

             hopLinksElement.append(sectionElement)
             if (shouldContinue && !shouldContinue()) {
                          loadMoreContainer.remove()
                          disconnectAutoLoadMoreObserver()
                          sectionElement.remove()
                          return false
             }

             await renderNextChunk()

             if (!hasRenderedRow && renderedCount >= rows.length) {
                          disconnectAutoLoadMoreObserver()
                          sectionElement.remove()
                          return false
             }

             return true
}

