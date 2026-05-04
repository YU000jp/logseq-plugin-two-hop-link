import { t } from "logseq-l10n"
import { excludePages } from "../../excludePages"
import { sortPageArray } from "../../lib"
import { createTd, pageArray, tokenLinkCreateTh } from "../type"
import {
    createNamespaceCategoryMap,
    createNamespacePageLink,
    moveSingleItemCategoriesToMultiClass,
    reclassifyMultiClassCategory,
    removeNamespaceHierarchyGroups,
    splitPageHierarchy,
} from "../helpers"
import { renderBatchSection } from "../batch"


export const typeNamespace = async (hopLinksElement: HTMLDivElement, flag?: { category: boolean, removePageHierarchy: boolean }) => {

    const currentPage = await logseq.Editor.getCurrentPage() as pageArray | null
    if (!currentPage) return

    const { namespace, hierarchies } = splitPageHierarchy(currentPage.originalName)

    let result = (await logseq.DB.datascriptQuery(
        //同じ名前をもつページ名を取得するクエリー
        `
[:find (pull ?p [:block/name :block/original-name :block/uuid] )
        :in $ ?pattern
        :where
        [?p :block/name ?c]
        [(re-pattern ?pattern) ?q]
        [(re-find ?q ?c)]
]
`,
        `"${namespace.toLowerCase()}"`// クエリーでは、ページ名を小文字にする必要がある
    ) as pageArray[] | null)?.flat()

    //現在のページ名と同じページを除外する
    if (result) result = result.filter((item) => item.uuid !== currentPage.uuid)

    //結果が空の場合は処理を終了する
    if (!result || result.length === 0) return


    if (flag && flag.category) {
        // カテゴリ分けをおこなう
        // 「AAA/BBB/CCC/DDD」のように、original-nameが「/」を含む場合は、最後の「/」までをもつものをグループ化して、そのグループごとにprocessingに入れる。「/」を含まないものは、"分類なし"というグループで処理する
        const category = createNamespaceCategoryMap(result)
        moveSingleItemCategoriesToMultiClass(category)
        reclassifyMultiClassCategory(category)

        if (flag.removePageHierarchy === true) removeNamespaceHierarchyGroups(category, hierarchies)

        for (const key in category)
            await processing(
                category[key],
                hopLinksElement,
                key,
                key,
                true,
                hierarchies
            )
    } else {
        // カテゴリ分けしない
        await processing(
            result,
            hopLinksElement,
            namespace,
            currentPage.originalName,
            false
        )
    }
}


// 表示の単位処理をまとめる
const processing = async (
    result: pageArray[],
    hopLinksElement: HTMLDivElement,
    namespace: string,
    removeKeyword: string,
    isHierarchyTitle: boolean,
    hierarchies?: string
) => {

    if (!result || result.length === 0) return

    //設定されたページを除外する
    excludePages(result)

    //除外して空になった場合は、処理を終了する
    if (result.length === 0) return

    //sortする
    result = sortPageArray(result)

    const pageLink: pageArray | string = await createNamespacePageLink(namespace)

    await renderBatchSection({
        rows: result,
        hopLinksElement,
        createSection: () => tokenLinkCreateTh(
            // keyが"multi class"の場合は、(multi class)にする
            pageLink,
            "th-type-namespace",
            t("Namespace"),
            {
                mark: "",
                hierarchies,
            }
        ),
        renderRow: (page, tokenLinkElement) => {
            createTd({
                name: page.name,
                uuid: page.uuid,
                originalName: page["original-name"],
            }, tokenLinkElement,
                {
                    removeKeyword,
                    isHierarchyTitle
                }
            )

            return true
        },
    })

}



