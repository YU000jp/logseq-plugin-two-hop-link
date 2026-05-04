import { PageEntity } from "@logseq/libs/dist/LSPlugin"
import { t } from "logseq-l10n"
import { excludeJournalFilter, excludePageFromPageEntity } from "../excludePages"
import { sortPageArray } from "../lib"
import type { pageArray } from "./type"

export const createHopLinksSection = (id: string, title: string): HTMLDivElement => {
             const sectionElement: HTMLDivElement = document.createElement("div")
             sectionElement.id = id
             sectionElement.innerHTML += `<div class="hopLinksTh">${title}</div>`
             return sectionElement
}

export const splitPageHierarchy = (originalName: string): { namespace: string, hierarchies: string } => {
             const namespace: string = originalName.includes("/")
                          ? (originalName.split("/").pop()) as string
                          : originalName
             const hierarchies: string = originalName.includes("/")
                          ? (originalName.split("/").slice(0, -1).join("/")) as string
                          : originalName

             return { namespace, hierarchies }
}

export const createNamespacePageLink = async (namespace: string): Promise<pageArray | string> => {
             if (namespace === "multi class") return t("multi class")

             const page = await logseq.Editor.getPage(namespace) as pageArray | null
             return page ? page : namespace
}

export const getNamespaceCategoryKey = (page: pageArray): string =>
             page["original-name"].includes("/")
                          ? page["original-name"].split("/").slice(0, -1).join("/")
                          : "multi class"

export const createNamespaceCategoryMap = (result: pageArray[]): { [key: string]: pageArray[] } => {
             const category: { [key: string]: pageArray[] } = {}

             for (const page of result) {
                          const key = getNamespaceCategoryKey(page)
                          if (!category[key]) category[key] = []
                          category[key].push(page)
             }

             return category
}

export const moveSingleItemCategoriesToMultiClass = (category: { [key: string]: pageArray[] }) => {
             for (const key in category) {
                          if (category[key] && category[key].length === 1) {
                                       if (!category["multi class"]) category["multi class"] = []
                                       category["multi class"].push(...category[key])
                                       delete category[key]
                          }
             }
}

export const reclassifyMultiClassCategory = (category: { [key: string]: pageArray[] }) => {
             if (!category["multi class"] || category["multi class"].length <= 10) return

             for (const key in category) {
                          if (key === "multi class") continue
                          for (const page of category["multi class"]) {
                                       if (page["original-name"].startsWith(key)) {
                                                    if (!category[key]) category[key] = []
                                                    category[key].push(page)
                                                    category["multi class"] = category["multi class"].filter((item) => item.uuid !== page.uuid)
                                       }
                          }
             }
}

export const removeNamespaceHierarchyGroups = (category: { [key: string]: pageArray[] }, hierarchies: string) => {
             for (const key in category)
                          if (key.startsWith(hierarchies + "/") || key === hierarchies) delete category[key]
}

export const preparePageEntities = (pages: PageEntity[] | null | undefined): PageEntity[] => {
             if (!pages || pages.length === 0) return []

             const journalFilteredPages = excludeJournalFilter(pages)
             if (!journalFilteredPages || journalFilteredPages.length === 0) return []

             excludePageFromPageEntity(journalFilteredPages)
             if (journalFilteredPages.length === 0) return []

             sortPageArray(journalFilteredPages)
             return journalFilteredPages
}

export const normalizeBlockEntities = <T extends { uuid: string; content: string }>(blocks: T[]): T[] => {
             const seen = new Set<string>()

             return blocks.filter((block) => {
                          if (block.content === "") return false
                          if (seen.has(block.uuid)) return false
                          seen.add(block.uuid)
                          return true
             })
}
