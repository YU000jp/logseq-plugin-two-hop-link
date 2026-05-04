import { t } from "logseq-l10n"
import { PageEntity } from "@logseq/libs/dist/LSPlugin.user"
import { createTd, pageArray } from "./type"
import { createHopLinksSection } from "./helpers"
import { renderBatchSection } from "./batch"
import { shouldExcludeOutgoingPage, toPageArray } from "./outgoing/shared"

export const outgoingLinks = async (
    outgoingList: pageArray[],
    hopLinksElement: HTMLDivElement,
    current: PageEntity | null
) => {
    const visibleOutgoingList = current
        ? outgoingList.filter((pageLink) => pageLink.uuid !== current.uuid)
        : outgoingList

    await renderBatchSection({
        rows: visibleOutgoingList,
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
    newSet: Set<unknown>,
    lookupPage: (name: string) => Promise<PageEntity | null>
): Promise<pageArray>[] =>
    Array.from(
        new Set(
            Array.from(pageLinks)
                .map((pageLink) => pageLink.dataset.ref?.replace(/^#/, ""))
                .filter((ref): ref is string => Boolean(ref))
        )
    ).map(async (pageLinkRef) => {
        try {
            const thisPage = await lookupPage(pageLinkRef) as PageEntity | undefined
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

