import { t } from "logseq-l10n"

type TokenLinkTextFlag = {
             hierarchies?: string
             mark: string
}

type PageDisplayFlag = {
             removeKeyword?: string
             isHierarchyTitle?: boolean
}

type PageLike = {
             name: string
             originalName: string
             uuid: string
}

type ResolvedPage = {
             page: PageLike
             displayName: string
}

export const normalizeTokenLinkText = (value: string, hierarchies?: string) =>
             (hierarchies ? value.replace(hierarchies + "/", "../") : value).replaceAll(/\//g, " / ")

export const formatTokenLinkText = (value: string, flag: TokenLinkTextFlag) => {
             const keyWord = normalizeTokenLinkText(value, flag.hierarchies) + " " + flag.mark
             return keyWord === "hls" ? "PDF" : keyWord
}

export const resolvePageDisplayName = (
             page: PageLike,
             flag?: PageDisplayFlag
): string => {
             let displayName = (flag && flag.removeKeyword // isHierarchyTitleがある場合は、キーワードを取り除く
                          && flag.isHierarchyTitle === true)
                          ? page.originalName.replace(flag.removeKeyword, "..")
                          : page.originalName

             // 「hls/」から始まる場合は、hls/の代わりに、「File > 」にする
             if (page.name.startsWith("hls/")) displayName = displayName.replace("hls/", `PDF ${t("File")} > `)
             else
                          // 「hls__」から始まる場合は、hls__の代わりに、「File > 」にする
                          if (page.name.startsWith("hls__")) displayName = displayName.replace("hls__", `PDF ${t("File")} > `)
                          else
                                       // 「/」が含まれる場合は、それのすべて「 / 」に置換する
                                       if (page.originalName.includes("/")) displayName = displayName.replaceAll(/\//g, " / ")

             return displayName
}

export const resolvePageDisplayData = async (
             page: PageLike,
             flag?: PageDisplayFlag
): Promise<ResolvedPage> => {
             if (page.name.match(/^[0-9a-f]{8}(-[0-9a-f]{4}){3}-[0-9a-f]{12}$/)) {
                          const block = await logseq.Editor.getBlock(page.uuid) as { page: PageLike } | null
                          if (block?.page) {
                                       return {
                                                    page: block.page,
                                                    displayName: resolvePageDisplayName(block.page, flag),
                                       }
                          }
             }

             return {
                          page,
                          displayName: resolvePageDisplayName(page, flag),
             }
}
