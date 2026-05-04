import { SettingSchemaDesc } from '@logseq/libs/dist/LSPlugin.user'
import { t } from "logseq-l10n"

/* user setting */
// https://logseq.github.io/plugins/types/SettingSchemaDesc.html
export const settings = (): SettingSchemaDesc[] => [
    {//outgoingLinks
        key: "outgoingLinks",
        type: "boolean",
        title: t("Show outgoing links"),
        default: true,
        description: t("Enabled by default."),
    },
    {//External Links
        key: "externalLinks",
        type: "boolean",
        title: t("Show external links"),
        default: true,
        description: t("Enabled by default."),
    },
    {//HierarchyをoutgoingLinks(Keywords)に含める
        key: "keywordsIncludeHierarchy",
        type: "boolean",
        title: t("Include page hierarchy in outgoing links"),
        default: true,
        description: t("Enabled by default."),
    },
    {//除外するページ
        key: "excludePages",
        type: "string",
        title: t("Exclude pages by title keyword"),
        default: "",
        inputAs: "textarea",//改行で区切る
        description: t("Enter one page title keyword per line."),
    },
    {//outgoingLinksから日誌を除外する
        key: "excludeJournalFromOutgoingLinks",
        type: "boolean",
        title: t("Exclude journal pages from outgoing links"),
        default: true,
        description: t("Enabled by default."),
    },
    {//outgoingLinksからyyyyやyyyy/MMのような形式を除外する
        key: "excludeDateFromOutgoingLinks",
        type: "boolean",
        title: t("Exclude date pages from outgoing links"),
        default: false,
        description: t("Disabled by default. Example: 2024, 2024/01."),
    },
    {//Resultから日誌を除外する
        key: "excludeJournalFromResult",
        type: "boolean",
        title: t("Exclude journal pages from results"),
        default: true,
        description: t("Enabled by default."),
    },
    {//Resultからyyyyやyyyy/MMのような形式を除外する
        key: "excludeDateFromResult",
        type: "boolean",
        title: t("Exclude date pages from results"),
        default: false,
        description: t("Disabled by default. Example: 2024, 2024/01."),
    },
    {//ページを開いたときにLinked Referencesを閉じる
        key: "collapseLinkedReferences",
        type: "boolean",
        title: t("Collapse Linked References when a page opens"),
        default: false,
        description: t("Disabled by default."),
    },
    {//ページを開いたときにHierarchyを閉じる
        key: "collapseHierarchy",
        type: "boolean",
        title: t("Collapse Hierarchy when a page opens"),
        default: false,
        description: t("Disabled by default."),
    },
    {//ページを開いたときにPage-tagsを閉じる
        key: "collapsePageTags",
        type: "boolean",
        title: t("Collapse Page-Tags when a page opens"),
        default: false,
        description: t("Disabled by default."),
    },
    {//現在のページに関連するreferencesを取り除く
        key: "excludeCurrentPage",
        type: "boolean",
        title: t("Exclude the current page from BackLinks and Blocks"),
        default: false,
        description: t("Disabled by default."),
    },
    {//tooltipにupdatedAtを表示する
        key: "tooltipShowUpdatedAt",
        type: "boolean",
        title: t("Show last updated time in tooltips"),
        default: true,
        description: t("Enabled by default."),
    },
    {//tooltipsにPage-tagsを表示する
        key: "tooltipShowPageTags",
        type: "boolean",
        title: t("Show page tags in tooltips"),
        default: true,
        description: t("Enabled by default."),
    },
    {//tooltipsにaliasを表示する
        key: "tooltipShowAlias",
        type: "boolean",
        title: t("Show aliases in tooltips"),
        default: true,
        description: t("Enabled by default."),
    },
]
