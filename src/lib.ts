import { BlockEntity, BlockUUIDTuple, PageEntity, } from "@logseq/libs/dist/LSPlugin.user"
import { pageArray } from "./query/type"

export const stringLimit = (content: string, limit: number): string => {
    if (!content) return ""

    // 文字数がlimitを超えている場合は、limitまでの文字列にする
    if (content && content.length > limit) 
        content = content.slice(0, limit) + "\n\n...\n"

    return content
}

export const includeReference = async (content): Promise<string | null> => {
    if (!content) return null
    if (content.match(/\(\(.+?\)\)/) === null) return null
    //contentに、{{embed ((何らかの英数値))}} であるか ((何らかの英数値)) が含まれている数だけ繰り返す
    while (content.match(/{{embed \(\((.+?)\)\)}}/) || content.match(/\(\((.+?)\)\)/)) {
        // {{embed ((何らかの英数値))}} であるか ((何らかの英数値)) だった場合はuuidとしてブロックを取得する
        const match = content.match(/{{embed \(\((.+?)\)\)}}/) || content.match(/\(\((.+?)\)\)/)
        if (!match) return null
        const thisBlock = await logseq.Editor.getBlock(match[1]) as BlockEntity | null
        if (!thisBlock) return null
        content = content.replace(match[0], thisBlock.content)
    }
    return content
}




//--------------------------------------------Credit: briansunter
//https://github.com/briansunter/logseq-plugin-gpt3-openai/blob/980b80dd7787457ffed2218c51fcf8007d4416d5/src/lib/logseq.ts#L47


const isBlockEntity = (b: BlockEntity | BlockUUIDTuple): b is BlockEntity => (b as BlockEntity).uuid !== undefined

//子ブロックを含めたブロックの内容を取得する
export const getTreeContent = async (b: BlockEntity):Promise<string> => {
    let content = ""
    const trimmedBlockContent = b.content.trim()
    if (trimmedBlockContent.length > 0) content += trimmedBlockContent + "\n"
    if (!b.children) return content

    for (const child of b.children) {
        if (isBlockEntity(child)) {
            content += await getTreeContent(child)
        } else {
            const childBlock = await logseq.Editor.getBlock(child[1], {
                includeChildren: true,
            })
            if (childBlock)
                content += await getTreeContent(childBlock)
        }
    }
    return content
}

export const getPageContent = async (page: PageEntity): Promise<string> => {
    let blockContents: string[] = []

    const pageBlocks = await logseq.Editor.getPageBlocksTree(page.name) as BlockEntity[]
    for (const pageBlock of pageBlocks) {
        const blockContent = await getTreeContent(pageBlock)
        if (typeof blockContent === "string"
            && blockContent.length > 0) blockContents.push(blockContent)
    }
    return blockContents.join("\n")
}

//--------------------------------------------end of credit



export const sortPageArray = (PageEntity: PageEntity[] | pageArray[]) => PageEntity.sort((a, b) => {
    if (a.name > b.name) return 1
    if (a.name < b.name) return -1
    return 0
})


// collapsed pageのaccessoryをそれぞれhiddenにする
export const collapsePageAccessory = async () => setTimeout(() => {
    //Linked Referencesをhiddenにする
    if (logseq.settings!.collapseLinkedReferences === true)
        hidden("body[data-page=page]>div#root>div>main div#main-content-container div.page.relative div.lazy-visibility>div>div.fade-enter-active div.references.page-linked>div.content>div.flex>div.initial")

    //Hierarchyをhiddenにする
    if (logseq.settings!.collapseHierarchy === true)
        hidden("body[data-page=page]>div#root>div>main div#main-content-container div.page.relative>div.page-hierarchy>div.flex>div.initial")

    //Page-tagsをhiddenにする
    if (logseq.settings!.collapsePageTags === true)
        hidden("body[data-page=page]>div#root>div>main div#main-content-container div.page.relative>div.page-tags>div.content>div.flex>div.initial")

}, 10)


// initialからhiddenにする
const hidden = (selector: string, flagOnce?: boolean) => {
    const element = parent.document.querySelector(selector) as HTMLDivElement | null
    if (element) {
        element.classList.remove("initial")
        element.classList.add("hidden")
    }
    if (flagOnce === false)
        setTimeout(() => hidden(selector, true), 500)
}