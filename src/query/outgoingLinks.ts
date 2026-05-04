import { t } from "logseq-l10n"
import { PageEntity } from "@logseq/libs/dist/LSPlugin.user"
import { createTd, pageArray } from "./type"
import { createHopLinksSection } from "./helpers"
import { renderBatchSection } from "./batch"
import { shouldExcludeOutgoingPage, toPageArray } from "./outgoing/shared"

export const outgoingLinks = async (outgoingList: pageArray[], hopLinksElement: HTMLDivElement) => {
    await renderBatchSection({
        rows: outgoingList,
        hopLinksElement,
        createSection: () => createHopLinksSection(
            "outgoingLinks",
            `>> ${t("Outgoing Links (Keyword)")}`
        ),
        renderRow: (pageLink, outgoingLinksElement) => {
            createTd({
                uuid: pageLink.uuid,
                originalName: pageLink.name,
                name: pageLink.name
            }, outgoingLinksElement)

            return true
        },
    })
}

export const outgoingLinksFromCurrentPage = (
    pageLinks: NodeListOf<HTMLAnchorElement>,
    newSet: Set<unknown>
): Promise<pageArray>[] =>
    Array.from(pageLinks).map(async (pageLink) => {
        if (pageLink.dataset.ref === undefined) return undefined
        // 先頭に#がついている場合は取り除く
        const pageLinkRef: string = pageLink.dataset.ref.replace(/^#/, "")
        try {
            const thisPage = await logseq.Editor.getPage(pageLinkRef) as PageEntity | undefined
            if (!thisPage) return undefined

            if (shouldExcludeOutgoingPage(thisPage)) return undefined

            // 重複を除外する
            if (newSet.has(thisPage.uuid)) return undefined
            newSet.add(thisPage.uuid)

            return toPageArray(thisPage)
        } catch (error) {
            console.error(`Error fetching page: ${pageLinkRef}`, error)
            return undefined
        }
    }) as Promise<pageArray>[]

