import { BlockEntity, IEntityID, PageEntity } from "@logseq/libs/dist/LSPlugin"


/**
 * Returns a set of page names to exclude based on the settings.
 */
const getExcludePagesSet = (): Set<string> => {
    const setting = logseq.settings!.excludePages as string || ""
    return new Set(setting.split("\n").map(s => s.trim()).filter(s => s !== ""))
}


/**
 * Removes excluded pages from the given page list.
 * @param pageList - The list of page names to filter.
 */
export const excludePagesFromPageList = (pageList: string[]) => {
    const excludeSet = getExcludePagesSet()
    if (excludeSet.size === 0) return
    const filtered = pageList.filter(name => !excludeSet.has(name))
    pageList.splice(0, pageList.length, ...filtered)
}


/**
 * Excludes pages from a given array of PageEntity objects based on the settings in logseq.
 * @param PageEntityArray An array of PageEntity objects to be filtered.
 */
export const excludePageFromPageEntity = (PageEntityArray: PageEntity[]) => {
    const excludeSet = getExcludePagesSet()
    const excludeJournalFromResult = logseq.settings!.excludeJournalFromResult === true
    const filtered = PageEntityArray.filter(page => {
        if (excludeSet.has(page.originalName)) return false
        if (excludeJournalFromResult && page["journal?"] === true) return false
        return true
    })
    PageEntityArray.splice(0, PageEntityArray.length, ...filtered)
}


/**
 * Filters out pages that are excluded based on the `excludePages` setting in Logseq.
 * @param outgoingList - The list of BlockEntities to filter.
 */
export const excludePageFromBlockEntity = async (outgoingList: { uuid: string, content: string, page: IEntityID }[]) => {
    const excludeSet = getExcludePagesSet()
    if (excludeSet.size === 0) return
    const filtered = outgoingList.filter(block => {
        if (!block.page || !block.page.originalName) return true
        return !excludeSet.has(block.page.originalName)
    })
    outgoingList.splice(0, outgoingList.length, ...filtered)
}


/**
 * Removes pages from the outgoingList that match the names in the excludePages array.
 * @param outgoingList - An array of objects containing uuid and name properties.
 */
export const excludePages = (outgoingList: ({ uuid: string; name: string })[]) => {
    const excludeSet = getExcludePagesSet()
    if (excludeSet.size === 0) return
    const filtered = outgoingList.filter(pageLink => !excludeSet.has(pageLink?.name))
    outgoingList.splice(0, outgoingList.length, ...filtered)
}


/**
 * Checks if the current page has an alias property and removes any outgoing links that match the alias.
 * @param current - The current page entity.
 * @param outgoingList - The list of outgoing links from the current page.
 */
export const checkAlias = (current: PageEntity, outgoingList: ({ name: string })[]) => {
    if (current.properties && current.properties.alias) {
        const aliasProperty = current.properties.alias as string[] | undefined //originalNameと同等
        if (aliasProperty && aliasProperty.length !== 0) {
            const aliasSet = new Set(aliasProperty)
            const filtered = outgoingList.filter(pageLink => !aliasSet.has(pageLink?.name))
            outgoingList.splice(0, outgoingList.length, ...filtered)
        }
    }
}


/**
 * Filters out journal pages and pages with names in the format of "YYYY/MM" or "YYYY".
 * @param pageEntityArray An array of page entities to filter.
 * @returns A new array of page entities that do not match the exclusion criteria.
 */
export const excludeJournalFilter = (pageEntityArray: PageEntity[]) =>
    pageEntityArray.filter(
        (page) =>
            excludeJournal(page["journal?"],
                page.originalName
            ) === false)


export const excludeJournal = (journal: boolean, originalName: string): boolean =>// 除外する場合はtrueを返す
    // 設定項目 結果から日誌を除外する
    (logseq.settings!.excludeJournalFromResult === true
        // 日誌かどうか
        && journal === true)
    // 設定項目 結果から日付を除外する
    || (logseq.settings!.excludeDateFromResult === true
        && originalName !== ""
        //2024/01のような形式だったら除外する
        && (originalName.match(/^\d{4}\/\d{2}$/) !== null
            // 2024のような数値も除外する
            || originalName.match(/^\d{4}$/) !== null))
